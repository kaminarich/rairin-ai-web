"use client";

import { FormEvent, useEffect, useState } from "react";
import Link from "next/link";
import { useLanguage } from "@/components/Language";

type Payment = {
  amount: number;
  expiresAt: number;
  orderId: string;
  qrImage: string;
  token: string;
  verificationId: string;
};

type Status = "pending" | "paid" | "expired" | "failed" | "cancelled";

function telegramUrl(verificationId: string, language: "en" | "id") {
  const text = language === "id"
    ? `Pembayaran QRIS RaiRin-AI\nID Verifikasi: ${verificationId}\nMohon validasi pembayaran dan aktifkan perangkat saya.`
    : `RaiRin-AI QRIS payment\nVerification ID: ${verificationId}\nPlease validate my payment and activate my device.`;
  return `https://t.me/kaminarich?text=${encodeURIComponent(text)}`;
}

function clock(milliseconds: number) {
  const seconds = Math.max(0, Math.ceil(milliseconds / 1000));
  return `${Math.floor(seconds / 60)}:${String(seconds % 60).padStart(2, "0")}`;
}

export default function QrisCheckout() {
  const { language } = useLanguage();
  const id = language === "id";
  const [serial, setSerial] = useState("");
  const [payment, setPayment] = useState<Payment | null>(null);
  const [status, setStatus] = useState<Status>("pending");
  const [remaining, setRemaining] = useState(0);
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (!payment || status !== "pending") return;

    async function checkStatus() {
      try {
        const response = await fetch("/api/payments/qris/status", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ token: payment!.token }),
        });
        if (!response.ok) return;
        const result = await response.json() as { status: Status; verificationId: string };
        setStatus(result.status);
      } catch {
        // Keep QR visible; next poll retries transient failures.
      }
    }

    const tick = () => {
      const next = payment.expiresAt - Date.now();
      setRemaining(Math.max(0, next));
      if (next <= 0) setStatus("expired");
    };
    tick();
    const timer = window.setInterval(tick, 1000);
    const poll = window.setInterval(checkStatus, 3000);
    checkStatus();
    return () => {
      window.clearInterval(timer);
      window.clearInterval(poll);
    };
  }, [payment, status]);

  async function create(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setError("");
    setLoading(true);
    try {
      const response = await fetch("/api/payments/qris", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ serial }),
      });
      const result = await response.json() as Payment & { error?: string };
      if (!response.ok) throw new Error(result.error || (id ? "QRIS tidak dapat dibuat." : "Could not create QRIS."));
      setPayment(result);
      setRemaining(result.expiresAt - Date.now());
      setStatus("pending");
    } catch (caught) {
      setError(caught instanceof Error ? caught.message : id ? "QRIS tidak dapat dibuat." : "Could not create QRIS.");
    } finally {
      setLoading(false);
    }
  }

  function reset() {
    setPayment(null);
    setStatus("pending");
    setRemaining(0);
    setError("");
  }

  if (!payment) {
    return (
      <form className="qris-checkout" onSubmit={create}>
        <label htmlFor="qris-serial">{id ? "Nomor serial perangkat" : "Device serial number"}</label>
        <div className="qris-form-row">
          <input
            id="qris-serial"
            autoComplete="off"
            maxLength={128}
            minLength={4}
            onChange={(event) => setSerial(event.target.value)}
            pattern="[A-Za-z0-9._:-]+"
            placeholder={id ? "Masukkan serial sebelum membayar" : "Enter serial before payment"}
            required
            value={serial}
          />
          <button className="btn btn--accent btn--sm" disabled={loading} type="submit">
            {loading ? (id ? "MEMBUAT..." : "CREATING...") : (id ? "BUAT QRIS" : "GET QRIS")}
          </button>
        </div>
        <p className="qris-help">{id ? "Total: Rp 15.000. QRIS kedaluwarsa tepat lima menit setelah dibuat." : "Total: Rp 15.000. QRIS expires exactly five minutes after creation."}</p>
        <label className="qris-consent">
          <input required type="checkbox" />
          <span>{id ? "Saya menyetujui " : "I agree to "}<Link href="/policies">{id ? "Syarat, Kebijakan Tanpa Pengembalian Dana, dan Privasi" : "Terms, No-Refund Policy, and Privacy Policy"}</Link>.</span>
        </label>
        {error ? <p className="qris-error" role="alert">{error}</p> : null}
      </form>
    );
  }

  return (
    <div className="qris-checkout qris-active" aria-live="polite">
      <div className="qris-timer">
        <span>{status === "paid" ? (id ? "LUNAS" : "PAID") : status === "pending" ? (id ? "KEDALUWARSA DALAM" : "EXPIRES IN") : status.toUpperCase()}</span>
        <strong>{status === "pending" ? clock(remaining) : status === "paid" ? (id ? "TERVERIFIKASI" : "VERIFIED") : "0:00"}</strong>
      </div>
      {status === "pending" ? (
        // QR data URL is generated server-side from Midtrans response.
        // eslint-disable-next-line @next/next/no-img-element
        <img className="qris-image" src={payment.qrImage} alt={id ? "Kode QRIS untuk pembayaran RaiRin-AI" : "QRIS code for RaiRin-AI payment"} />
      ) : null}
      <dl className="qris-details">
        <div><dt>{id ? "Total" : "Amount"}</dt><dd>Rp {payment.amount.toLocaleString("id-ID")}</dd></div>
        <div><dt>Serial</dt><dd>{serial}</dd></div>
        <div><dt>{id ? "ID Verifikasi" : "Verification ID"}</dt><dd>{payment.verificationId}</dd></div>
      </dl>
      <p className="qris-warning">{id ? "Jangan bayar setelah waktu mencapai 0:00. Buat QRIS baru." : "Do not pay after timer reaches 0:00. Create a new QRIS instead."}</p>
      {status === "pending" ? <p className="qris-help">{id ? "Pindai sekarang. Status pembayaran diperiksa otomatis." : "Scan now. Payment status checks automatically."}</p> : null}
      {status === "paid" ? (
        <a className="btn btn--accent btn--block" href={telegramUrl(payment.verificationId, language)}>
          {id ? "LANJUT KE TELEGRAM" : "CONTINUE TO TELEGRAM"}
        </a>
      ) : null}
      {status !== "pending" && status !== "paid" ? (
        <button className="btn btn--block" onClick={reset} type="button">{id ? "BUAT QRIS BARU" : "CREATE NEW QRIS"}</button>
      ) : null}
    </div>
  );
}
