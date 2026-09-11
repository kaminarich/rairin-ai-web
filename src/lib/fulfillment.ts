import { Client, SFTPWrapper } from "ssh2";

type Invoice = {
  amount: number;
  orderId: string;
  paidAt?: string;
  serial: string;
  transactionId?: string;
};

function required(name: string) {
  const value = process.env[name];
  if (!value) throw new Error(`${name} is not configured`);
  return value;
}

function connect() {
  const client = new Client();
  const ready = new Promise<Client>((resolve, reject) => {
    client
      .once("ready", () => resolve(client))
      .once("error", reject)
      .connect({
        host: required("RAIRIN_VPS_HOST"),
        port: Number(process.env.RAIRIN_VPS_PORT || "22"),
        username: required("RAIRIN_VPS_USER"),
        password: required("RAIRIN_VPS_PASSWORD"),
        readyTimeout: 15_000,
      });
  });
  return { client, ready };
}

function sftp(client: Client) {
  return new Promise<SFTPWrapper>((resolve, reject) => client.sftp((error, value) => error ? reject(error) : resolve(value)));
}

function readFile(client: SFTPWrapper, path: string) {
  return new Promise<string>((resolve, reject) => {
    const chunks: Buffer[] = [];
    const stream = client.createReadStream(path);
    stream.on("data", (chunk: Buffer) => chunks.push(chunk));
    stream.once("error", reject);
    stream.once("end", () => resolve(Buffer.concat(chunks).toString("utf8")));
  });
}

function rename(client: SFTPWrapper, source: string, destination: string) {
  return new Promise<void>((resolve, reject) => client.rename(source, destination, (error) => error ? reject(error) : resolve()));
}

function remove(client: SFTPWrapper, path: string) {
  return new Promise<void>((resolve, reject) => client.unlink(path, (error) => error ? reject(error) : resolve()));
}

async function lock(client: SFTPWrapper, path: string) {
  for (let attempt = 0; attempt < 30; attempt += 1) {
    try {
      const handle = await new Promise<Buffer>((resolve, reject) => client.open(path, "wx", 0o600, (error, value) => error ? reject(error) : resolve(value)));
      await new Promise<void>((resolve, reject) => client.close(handle, (error) => error ? reject(error) : resolve()));
      return;
    } catch (error) {
      const code = (error as NodeJS.ErrnoException).code;
      if (code !== "EEXIST" && code !== "4") throw error;
      await new Promise((resolve) => setTimeout(resolve, 100));
    }
  }
  throw new Error("Whitelist is busy");
}

function writeFile(client: SFTPWrapper, path: string, value: string) {
  return new Promise<void>((resolve, reject) => {
    const stream = client.createWriteStream(path, { flags: "wx", mode: 0o600 });
    stream.once("error", reject);
    stream.once("close", () => resolve());
    stream.end(value);
  });
}

export async function addSerialToWhitelist(serial: string) {
  const path = required("RAIRIN_WHITELIST_PATH");
  const { client, ready } = connect();

  try {
    const connection = await ready;
    const remote = await sftp(connection);
    const lockPath = `${path}.lock`;
    await lock(remote, lockPath);
    try {
      const current = JSON.parse(await readFile(remote, path)) as unknown;
      if (!current || Array.isArray(current) || typeof current !== "object") throw new Error("Whitelist must be a JSON object");

      const whitelist = current as Record<string, unknown>;
      if (Object.hasOwn(whitelist, serial)) return false;
      whitelist[serial] = "";

      const temporary = `${path}.${process.pid}.${Date.now()}.tmp`;
      await writeFile(remote, temporary, `${JSON.stringify(whitelist, null, 4)}\n`);
      await rename(remote, temporary, path);
      return true;
    } finally {
      await remove(remote, lockPath);
    }
  } finally {
    client.end();
  }
}

export async function sendInvoice(invoice: Invoice, newlyActivated: boolean) {
  const token = required("TELEGRAM_BOT_TOKEN");
  const chatId = required("TELEGRAM_CHAT_ID");
  const text = [
    "RaiRin-AI QRIS payment verified",
    `Order: ${invoice.orderId}`,
    `Transaction: ${invoice.transactionId || "N/A"}`,
    `Amount: Rp ${invoice.amount.toLocaleString("id-ID")}`,
    `Serial: ${invoice.serial}`,
    `Paid at: ${invoice.paidAt || "N/A"}`,
    `Whitelist: ${newlyActivated ? "serial added" : "serial already active"}`,
  ].join("\n");

  const response = await fetch(`https://api.telegram.org/bot${token}/sendMessage`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ chat_id: chatId, text }),
    signal: AbortSignal.timeout(15_000),
  });
  if (!response.ok) throw new Error(`Telegram notification failed (${response.status})`);
}

export async function fulfillPaidOrder(invoice: Invoice) {
  const newlyActivated = await addSerialToWhitelist(invoice.serial);
  if (newlyActivated) await sendInvoice(invoice, true);
  return { newlyActivated };
}
