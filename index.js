const { default: makeWASocket, useMultiFileAuthState } =
  require("@whiskeysockets/baileys");

const readline = require("readline");
const logic = require("./logic");
const scheduler = require("./scheduler");

let pairingRequested = false;
let schedulerStarted = false;

async function start() {
  const { state, saveCreds } =
    await useMultiFileAuthState("./baileys_auth_info");

  const sock = makeWASocket({
    auth: state,

    // ✅ VIDEO FIX: hardcoded WhatsApp Web version
    version: [2, 3000, 1025190524],

    // video usually keeps this enabled
    printQRInTerminal: false
  });

  sock.ev.on("creds.update", saveCreds);

  sock.ev.on("connection.update", async (update) => {
    const { connection } = update;

    // 🔢 NUMBER PAIRING (VIDEO METHOD)
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
        "Enter WhatsApp number with country code (example: 91XXXXXXXXXX): ",
        async (number) => {
          try {
            const code = await sock.requestPairingCode(number.trim());
            console.log("\nPAIRING CODE:", code, "\n");
          } catch (err) {
            console.error("Pairing failed:", err);
          }
          rl.close();
        }
      );
    }

    // ▶️ Start scheduler AFTER login
    if (connection === "open" && sock.user?.id && !schedulerStarted) {
      schedulerStarted = true;
      console.log("WhatsApp connected. Starting scheduler...");
      scheduler(sock);
    }
  });

  sock.ev.on("messages.upsert", async ({ messages }) => {
    const m = messages[0];
    if (!m?.message || m.key.fromMe) return;

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
