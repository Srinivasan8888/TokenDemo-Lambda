const getPastTime = (option) => {
  let pastTime = "";
  const currentDateTime = new Date();

  const timeMap = {
    "1h": 1 * 60 * 60 * 1000,
    "3h": 3 * 60 * 60 * 1000,
    "6h": 6 * 60 * 60 * 1000,
    "12h": 12 * 60 * 60 * 1000,
    "1d": 24 * 60 * 60 * 1000,
    "2d": 2 * 24 * 60 * 60 * 1000,
    "3d": 3 * 24 * 60 * 60 * 1000,
    "7d": 7 * 24 * 60 * 60 * 1000,
    "14d": 14 * 24 * 60 * 60 * 1000,
    "30d": 30 * 24 * 60 * 60 * 1000,
  }

  pastTime = new Date(currentDateTime.getTime() - timeMap[option]);

  const kolkataTime =
    pastTime &&
    pastTime.toLocaleString("en-US", {
      timeZone: "Asia/Kolkata",
      hour12: false,
    });

  const [date, time] = kolkataTime.split(", ");
  const [month, day, year] = date.split("/");
  let [hours, minutes, seconds] = time.split(":");

  if (hours === "24") {
    hours = "00";
  }

  hours = hours.padStart(2, "0");
  minutes = minutes.padStart(2, "0");
  seconds = seconds.padStart(2, "0");

  const formattedPastTime = `${year}-${month.padStart(2, "0")}-${day.padStart(
    2,
    "0"
  )},${hours}:${minutes}:${seconds}`;

  return formattedPastTime;
};

export default getPastTime;
