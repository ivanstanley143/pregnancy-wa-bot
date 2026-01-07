const { default: makeWASocket, useMultiFileAuthState } =
  require("@whiskeysockets/baileys");

const logic = require("./logic");
const scheduler = require("./scheduler");
const readline = require("readline");

async function start() {
  const { state, saveCreds } =
    await useMultiFileAuthState("/data/auth");

  const sock = makeWASocket({
    auth: state,
    printQRInTerminal: false // ❌ QR disabled
  });

  // ✅ Pairing code login (NEW METHOD)
  if (!state.creds.registered) {
    const rl = readline.createInterface({
      input: process.stdin,
      output: process.stdout
    });

    rl.question(
      "Enter WhatsApp number with country code (example: 66XXXXXXXXXX): ",
      async (number) => {
        try {
          const code = await sock.requestPairingCode(number.trim());
          console.log("\nPAIRING CODE:", code, "\n");
        } catch (err) {
          console.error("Failed to get pairing code:", err);
        }
        rl.close();
      }
    );
  }

  sock.ev.on("creds.update", saveCreds);

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

  scheduler(sock);
}

start();
