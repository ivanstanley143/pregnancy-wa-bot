const { default: makeWASocket, useMultiFileAuthState } =
  require("@whiskeysockets/baileys");

const qrcode = require("qrcode-terminal");
const logic = require("./logic");
const scheduler = require("./scheduler");

let schedulerStarted = false;

async function start() {
  const { state, saveCreds } =
    await useMultiFileAuthState("/data/auth");

  const sock = makeWASocket({
    auth: state,
    browser: ["Ubuntu", "Chrome", "20.0.0"]
  });

  sock.ev.on("creds.update", saveCreds);

  sock.ev.on("connection.update", (update) => {
    const { connection, qr } = update;

    // ✅ PRINT QR MANUALLY
    if (qr) {
      console.log("\n📱 Scan this QR code with WhatsApp:\n");
      qrcode.generate(qr, { small: true });
    }

    if (connection === "open" && !schedulerStarted) {
      schedulerStarted = true;
      console.log("✅ WhatsApp connected. Starting scheduler...");
      scheduler(sock);
    }

    if (connection === "close") {
      console.log("⚠️ Connection closed. Reconnecting...");
    }
  });

  sock.ev.on("messages.upsert", async ({ messages }) => {
    const m = messages[0];
    if (!m.message || m.key.fromMe) return;

    const text =
      m.message.conversation ||
      m.message.extendedTextMessage?.text ||
      "";

    await logic(sock, {
      text,
      from: m.key.remoteJid
    });
  });
}

start();
