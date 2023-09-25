import craigslistMonitor from "./sites/craigslist.js";
import vanskyMonitor from "./sites/vansky.js";
import wesbrookMonitor from "./sites/wesbrook.js";
import facebookMonitor from "./sites/facebook.js";
// import { setTimeout as sleep } from "timers/promises";

const main = async () => {
  vanskyMonitor("ubc 3房");
  wesbrookMonitor({ bedrooms: "3" });
  craigslistMonitor(
    "apa",
    "",
    {
      areaId: 16,
      latitude: 49.2599,
      longitude: -123.2388,
      searchDistance: 2.4,
    },
    {
      min_bedrooms: "3",
      max_bedrooms: "3",
    }
  );
  facebookMonitor();
};

main();
