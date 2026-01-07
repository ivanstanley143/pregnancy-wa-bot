const data = require("./data");
const utils = require("./utils");

module.exports = async (sock, msg) => {
  const text = msg.text.toLowerCase().trim();
  const from = msg.from;
  const { week, days } = utils.getPregnancy();

  if (text.startsWith("food")) {
    const item = text.replace("food","").trim();
    const status = data.FOOD_DB[item] || "⚠️ No data available";
    return sock.sendMessage(from, {
      text: utils.mix(
        `🍎 ${item} – ${status}`,
        `🍎 ${item} – ${status}`
      )
    });
  }

  if (text === "safe foods") {
    return sock.sendMessage(from, {
      text: utils.mix(
        `✅ Safe foods:\n${data.SAFE_FOODS.join(", ")}`,
        `✅ സുരക്ഷിത ഭക്ഷണങ്ങൾ`
      )
    });
  }

  if (text === "safe foods image") {
    return sock.sendMessage(from, {
      image: { url: data.SAFE_FOOD_IMAGE },
      caption: data.DISCLAIMER
    });
  }

  if (text === "avoid foods image") {
    return sock.sendMessage(from, {
      image: { url: data.AVOID_FOOD_IMAGE },
      caption: data.DISCLAIMER
    });
  }

  if (text === "week") {
    return sock.sendMessage(from, {
      text: utils.mix(
        `🤰 Week ${week} + ${days} days\nAge: ${utils.getAge()}`,
        `🤰 ${week} ആഴ്ച + ${days} ദിവസം`
      )
    });
  }

  return sock.sendMessage(from, {
    text: utils.mix(
      `🌸 Assalamu Alaikum ${data.NAME}\nPregnancy Week: ${week}`,
      `🌸 അസ്സലാമു അലൈക്കും ${data.NAME}`
    )
  });
};
