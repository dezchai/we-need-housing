import * as craigslist from "./sites/craigslist.js";
import * as vansky from "./sites/vansky.js";
import * as wesbrook from "./sites/wesbrook.js";
import * as facebook from "./sites/facebook.js";
// import { setTimeout as sleep } from "timers/promises";

(async () => {
  vansky.monitor("ubc 3房");
  wesbrook.monitor({ bedrooms: "3" });
  craigslist.monitor(
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
  facebook.monitor();
})();
