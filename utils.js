const moment = require("moment-timezone");
const data = require("./data");

exports.now = () => moment().tz("Asia/Kolkata");

exports.getAge = () =>
  moment().diff(moment(data.DOB), "years");

exports.getPregnancy = () => {
  const days = moment().diff(moment(data.LMP), "days");
  return { week: Math.floor(days / 7), days: days % 7 };
};

exports.getTrimester = (w) =>
  w <= 12 ? 1 : w <= 27 ? 2 : 3;

exports.mix = (en, ml) =>
  `${en}\n${ml}\n\n${data.DISCLAIMER}`;
