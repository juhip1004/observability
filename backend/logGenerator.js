const axios = require("axios");

const services = ["network", "database", "storage", "bigdata"];
const levels = ["info", "warn", "error"];

function random(arr) {
  return arr[Math.floor(Math.random() * arr.length)];
}

setInterval(async () => {
  try {
    await axios.post("http://localhost:6001/log", {
      appName: "simulator",
      service: random(services),
      environment: "prod",
      level: random(levels),
      message: "Auto-generated system log"
    });

    console.log("log sent");
  } catch (err) {
    console.error(err.message);
  }
}, 1000);