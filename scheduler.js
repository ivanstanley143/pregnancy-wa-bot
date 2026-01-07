const utils = require("./utils");
const data = require("./data");

let LAST_TRIMESTER = null;
let LAST_WEEK = null;

module.exports = (sock) => {
  setInterval(async () => {

    // 🔒 WAIT until WhatsApp login is complete
    if (!sock?.user?.id) {
      console.log("⏳ Scheduler waiting for WhatsApp login...");
      return;
    }
    const now = utils.now();
    const time = now.format("HH:mm");
    const today = now.format("YYYY-MM-DD");
    const dayTime = now.format("dddd HH:mm");

    const { week } = utils.getPregnancy();
    const trimester = utils.getTrimester(week);

    // Water
    if (["07:30","09:30","11:30","13:30","15:30","17:30","19:30","21:00"].includes(time)) {
      sock.sendMessage(data.USER, {
        text: utils.mix("💧 Please drink water", "💧 വെള്ളം കുടിക്കൂ")
      });
    }

    // Meals
    const meals = {
      "09:00":"🍽️ Breakfast",
      "12:00":"🍎 Snack",
      "15:00":"🥗 Light meal",
      "18:00":"☕ Evening snack",
      "19:30":"🍽️ Dinner",
      "21:30":"🥛 Light food"
    };
    if (meals[time]) {
      sock.sendMessage(data.USER, {
        text: utils.mix(
          `${meals[time]} time`,
          "ഇപ്പോൾ ഭക്ഷണം കഴിക്കേണ്ട സമയം"
        )
      });
    }

    // Appointment
    data.APPOINTMENTS.forEach(a => {
      if (a.date === today && a.time === time) {
        const msg = utils.mix(
          `📅 ${a.note} today`,
          `📅 ഇന്ന് ഡോക്ടർ അപ്പോയിന്റ്മെന്റ്`
        );
        sock.sendMessage(data.USER, { text: msg });
        sock.sendMessage(data.HUSBAND, { text: msg });
      }
    });

    // Weekly dua
    if (dayTime === "Friday 09:00" && data.WEEKLY_DUA[week]) {
      sock.sendMessage(data.USER, {
        text: utils.mix(
          `🌙 Weekly Dua\n${data.WEEKLY_DUA[week]}`,
          `🌙 ആഴ്ചയിലെ ദുആ`
        )
      });
    }

    // Trimester change
    if (trimester !== LAST_TRIMESTER) {
      const caption = utils.mix(
        `🌸 Trimester ${trimester} started`,
        `🌸 ട്രൈമെസ്റ്റർ ${trimester} ആരംഭിച്ചു`
      );
      sock.sendMessage(data.USER, {
        image: { url: data.TRIMESTER_IMAGES[trimester] },
        caption
      });
      sock.sendMessage(data.HUSBAND, { text: caption });
      LAST_TRIMESTER = trimester;
    }

    // Weekly baby image
    if (dayTime === "Monday 09:00" && week !== LAST_WEEK && data.BABY_IMAGES[week]) {
      const [size, img] = data.BABY_IMAGES[week];
      const caption = utils.mix(
        `🤰 Week ${week}\nBaby size: ${size}`,
        `🤰 ${week} ആഴ്ച`
      );
      sock.sendMessage(data.USER, {
        image: { url: img },
        caption
      });
      sock.sendMessage(data.HUSBAND, { text: caption });
      LAST_WEEK = week;
    }

  }, 60000);
};
