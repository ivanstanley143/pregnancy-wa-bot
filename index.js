const { default: makeWASocket, useMultiFileAuthState } =
  require("@whiskeysockets/baileys");

const logic = require("./logic");
const scheduler = require("./scheduler");
const readline = require("readline");

let pairingRequested = false;
let schedulerStarted = false;

async function start() {
  const { state, saveCreds } =
    await useMultiFileAuthState("/data/auth");

  const sock = makeWASocket({
    auth: state,
    printQRInTerminal: false,
    browser: ["Ubuntu", "Chrome", "20.0.0"] // ✅ WEB API (SUPPORTED)
  });

  sock.ev.on("creds.update", saveCreds);

  sock.ev.on("connection.update", async (update) => {
    const { connection } = update;

    // 🔑 Ask pairing code ONLY ONCE
    if (
      connection === "open" &&
      !state.creds.registered &&
      !pairingRequested
    ) {
      pairingRequested = true;

      const rl = readline.createInterface({
        input: process.stdin,
        output: process.stdout
      });

      rl.question(
        "Enter WhatsApp number with country code (example: 66XXXXXXXXX): ",
        async (number) => {
          try {
            const code = await sock.requestPairingCode(number.trim());
            console.log("\n✅ PAIRING CODE:", code, "\n");
          } catch (err) {
            console.error("❌ Pairing failed:", err.message);
          }
          rl.close();
        }
      );
    }

    // ✅ Start scheduler ONLY after login is complete
    if (connection === "open" && sock.user?.id && !schedulerStarted) {
      schedulerStarted = true;
      console.log("✅ WhatsApp connected. Starting scheduler...");
      scheduler(sock);
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
