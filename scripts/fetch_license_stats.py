#!/usr/bin/env python3
"""Fetch the RaiRin licence count from the VPS over SSH and write a JSON snapshot.

Counts registered device serials the way the verification server resolves them:
the root whitelist plus every reseller whitelist, deduplicated, with blacklisted
serials subtracted for the "active" figure. Only aggregate integers ever leave
the server - no serial, path or credential is printed or written.

Configuration comes from the environment, so nothing sensitive lands in the repo:

  VPS_HOST                    IP or hostname (required)
  VPS_PORT                    SSH port (default 22)
  VPS_USER                    SSH user (required)
  VPS_SSH_KEY                 private key contents, preferred over a password
  VPS_SSH_KEY_PASSPHRASE      passphrase for that key, if it has one
  VPS_PASSWORD                password auth, used when no key is given
  VPS_HOST_KEY                known_hosts line, pins the server identity
  VPS_ALLOW_UNKNOWN_HOST_KEY  set to 1 to skip pinning (not recommended)
  RAIRIN_STATS_COMMAND        remote counter (default /usr/local/bin/rairin-license-count)
  RAIRIN_REMOTE_DIR           remote data dir for the inline fallback (default ~/rairin)

Usage:
  python3 scripts/fetch_license_stats.py --print-host-key
  python3 scripts/fetch_license_stats.py --stdout
  python3 scripts/fetch_license_stats.py --output src/data/license-stats.json
"""

from __future__ import annotations

import argparse
import io
import json
import os
import sys
import tempfile
from datetime import date, timezone, datetime
from pathlib import Path

try:
    import paramiko
except ImportError:  # pragma: no cover
    sys.exit("paramiko is not installed. Run: pip install paramiko")


DEFAULT_COMMAND = "/usr/local/bin/rairin-license-count"
DEFAULT_REMOTE_DIR = "~/rairin"
CONNECT_TIMEOUT = 20
COMMAND_TIMEOUT = 45
REQUIRED_FIELDS = ("active", "registered", "root", "reseller", "resellers", "blacklisted")

# Fallback used when the counter is not installed on the VPS yet. Emits counts only.
INLINE_COUNTER = """
import glob, json, os

BASE = os.path.expanduser({base!r})


def from_json(path):
    try:
        with open(path) as handle:
            data = json.load(handle)
    except Exception:
        return set()
    if isinstance(data, dict):
        return {{str(k).strip() for k in data if str(k).strip()}}
    if isinstance(data, list):
        return {{str(i).strip() for i in data if str(i).strip()}}
    return set()


root = from_json(os.path.join(BASE, "whitelist.json"))
files = sorted(glob.glob(os.path.join(BASE, "resellers", "*", "whitelist.json")))
reseller = set()
for path in files:
    reseller |= from_json(path)

registered = root | reseller

blacklist = set()
try:
    with open(os.path.join(BASE, "blacklist.txt")) as handle:
        blacklist = {{line.strip() for line in handle if line.strip()}}
except Exception:
    pass

print(json.dumps({{
    "active": len(registered - blacklist),
    "registered": len(registered),
    "root": len(root),
    "reseller": len(reseller),
    "resellers": len(files),
    "blacklisted": len(registered & blacklist),
}}))
"""


def env(name: str, default: str = "") -> str:
    return (os.environ.get(name) or default).strip()


def load_private_key(raw: str, passphrase: str | None):
    errors = []
    for key_class in (paramiko.Ed25519Key, paramiko.ECDSAKey, paramiko.RSAKey, paramiko.DSSKey):
        try:
            return key_class.from_private_key(io.StringIO(raw), password=passphrase or None)
        except Exception as exc:
            errors.append(f"{key_class.__name__}: {exc}")
    raise SystemExit("VPS_SSH_KEY could not be parsed as a supported key type.\n" + "\n".join(errors))


def build_client(host: str, port: int, user: str, *, trust_unknown_host: bool) -> paramiko.SSHClient:
    client = paramiko.SSHClient()

    host_key_line = env("VPS_HOST_KEY")
    if host_key_line:
        with tempfile.NamedTemporaryFile("w", suffix=".known_hosts", delete=False) as handle:
            handle.write(host_key_line.rstrip("\n") + "\n")
            known_hosts = handle.name
        try:
            client.load_host_keys(known_hosts)
        finally:
            os.unlink(known_hosts)
        client.set_missing_host_key_policy(paramiko.RejectPolicy())
    elif trust_unknown_host or env("VPS_ALLOW_UNKNOWN_HOST_KEY") == "1":
        client.set_missing_host_key_policy(paramiko.AutoAddPolicy())
    else:
        raise SystemExit(
            "VPS_HOST_KEY is not set, so the server identity cannot be verified.\n"
            "Run this script once with --print-host-key, store the printed line as the\n"
            "VPS_HOST_KEY secret, or set VPS_ALLOW_UNKNOWN_HOST_KEY=1 to accept the risk."
        )

    key_material = os.environ.get("VPS_SSH_KEY") or ""
    password = env("VPS_PASSWORD")

    connect_args = {
        "hostname": host,
        "port": port,
        "username": user,
        "timeout": CONNECT_TIMEOUT,
        "banner_timeout": CONNECT_TIMEOUT,
        "auth_timeout": CONNECT_TIMEOUT,
        "allow_agent": False,
        "look_for_keys": False,
    }

    if key_material.strip():
        connect_args["pkey"] = load_private_key(key_material, env("VPS_SSH_KEY_PASSPHRASE"))
    elif password:
        connect_args["password"] = password
    else:
        raise SystemExit("No credentials found. Set VPS_SSH_KEY (preferred) or VPS_PASSWORD.")

    client.connect(**connect_args)
    return client


def parse_counts(raw: str) -> dict | None:
    text = raw.strip()
    if not text:
        return None
    try:
        payload = json.loads(text.splitlines()[-1])
    except (json.JSONDecodeError, IndexError):
        return None
    if not isinstance(payload, dict):
        return None
    if any(not isinstance(payload.get(field), int) for field in REQUIRED_FIELDS):
        return None
    return payload


def run(client: paramiko.SSHClient, command: str, stdin_payload: str | None = None) -> tuple[str, str, int]:
    stdin, stdout, stderr = client.exec_command(command, timeout=COMMAND_TIMEOUT)
    if stdin_payload is not None:
        stdin.write(stdin_payload)
        stdin.channel.shutdown_write()
    out = stdout.read().decode("utf-8", "replace")
    err = stderr.read().decode("utf-8", "replace")
    return out, err, stdout.channel.recv_exit_status()


def collect_counts(client: paramiko.SSHClient) -> dict:
    """Prefer the installed counter, including forced-command keys. Fall back to inline."""
    command = env("RAIRIN_STATS_COMMAND", DEFAULT_COMMAND)
    out, err, _ = run(client, command)
    counts = parse_counts(out)
    if counts:
        return counts

    first_error = (err or out).strip()[:300]

    remote_dir = env("RAIRIN_REMOTE_DIR", DEFAULT_REMOTE_DIR)
    out, err, status = run(client, "python3 -", INLINE_COUNTER.format(base=remote_dir))
    counts = parse_counts(out)
    if counts:
        return counts

    raise SystemExit(
        "Could not read licence counts from the VPS.\n"
        f"  counter command: {first_error or 'no usable output'}\n"
        f"  inline fallback (exit {status}): {(err or out).strip()[:300] or 'no output'}"
    )


def print_host_key(host: str, port: int, user: str) -> int:
    client = build_client(host, port, user, trust_unknown_host=True)
    try:
        transport = client.get_transport()
        if transport is None:
            raise SystemExit("No SSH transport after connecting.")
        key = transport.get_remote_server_key()
        label = host if port == 22 else f"[{host}]:{port}"
        print("Store this line as the VPS_HOST_KEY secret:\n")
        print(f"{label} {key.get_name()} {key.get_base64()}")
    finally:
        client.close()
    return 0


def main() -> int:
    parser = argparse.ArgumentParser(description="Collect RaiRin licence counts over SSH.")
    parser.add_argument("--output", type=Path, help="write the stats JSON to this path")
    parser.add_argument("--stdout", action="store_true", help="print the stats JSON instead of writing it")
    parser.add_argument("--print-host-key", action="store_true", help="print the server host key line and exit")
    parser.add_argument(
        "--skip-if-unconfigured",
        action="store_true",
        help="exit 0 without touching anything when VPS_HOST or VPS_USER is unset",
    )
    args = parser.parse_args()

    host, user = env("VPS_HOST"), env("VPS_USER")
    if not host or not user:
        if args.skip_if_unconfigured:
            print("VPS_HOST or VPS_USER is not set, leaving the committed snapshot untouched.")
            return 0
        raise SystemExit("VPS_HOST and VPS_USER are required.")

    try:
        port = int(env("VPS_PORT", "22"))
    except ValueError:
        raise SystemExit("VPS_PORT must be a number.")

    if args.print_host_key:
        return print_host_key(host, port, user)

    client = build_client(host, port, user, trust_unknown_host=False)
    try:
        counts = collect_counts(client)
    finally:
        client.close()

    stats = {field: counts[field] for field in REQUIRED_FIELDS}
    stats["updatedAt"] = date.today().isoformat()
    stats["source"] = "ssh"
    rendered = json.dumps(stats, indent=2) + "\n"

    if args.stdout or not args.output:
        sys.stdout.write(rendered)
        return 0

    previous = None
    if args.output.exists():
        try:
            previous = json.loads(args.output.read_text(encoding="utf-8"))
        except (OSError, ValueError):
            previous = None

    if isinstance(previous, dict) and all(previous.get(f) == stats[f] for f in REQUIRED_FIELDS):
        stats["updatedAt"] = previous.get("updatedAt") or stats["updatedAt"]
        rendered = json.dumps(stats, indent=2) + "\n"

    args.output.parent.mkdir(parents=True, exist_ok=True)
    args.output.write_text(rendered, encoding="utf-8")
    checked = datetime.now(timezone.utc).strftime("%Y-%m-%dT%H:%MZ")
    print(f"{args.output}: {stats['active']} active of {stats['registered']} registered (checked {checked})")
    return 0


if __name__ == "__main__":
    sys.exit(main())
