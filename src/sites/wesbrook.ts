import got from "got";
import * as cheerio from "cheerio";
import Log from "dezutil";
import { setTimeout as sleep } from "timers/promises";
import { Webhook, MessageBuilder } from "webhook-discord";
import { SLEEP_TIME, ERROR_TIME, WEBHOOK_URL } from "../config.js";
import { writePrevious, readPrevious } from "../utils.js";

const { log, elog, slog } = Log.create("Wesbrook");

interface WesbrookFilters {
  bedrooms?: string;
  bathrooms?: string;
  petsAllowed?: string;
  floorLevelPref?: string;
  building?: string;
}

interface WesbrookAvailable {
  roomSpec: string; // Room Type e.g. Studio | 1 Bathroom
  buildingName: string; // e.g. Greenwood Commons
  neighbourhood: string; // e.g. East Campus
  suite: string; // e.g. GW45A
  petFriendly: string; // yes/no
  rent: string; // e.g. $1,500
  moveInDate: string; // June 1, 2023
  img: string; // url
}

const search = async (
  filters?: WesbrookFilters
): Promise<Array<WesbrookAvailable>> => {
  const response = await got
    .post("https://www.wesbrookproperties.com/wp-admin/admin-ajax.php", {
      headers: {
        authority: "www.wesbrookproperties.com",
        accept: "*/*",
        "accept-language": "en-US,en;q=0.9",
        "cache-control": "no-cache",
        "content-type": "application/x-www-form-urlencoded; charset=UTF-8",
        origin: "https://www.wesbrookproperties.com",
        pragma: "no-cache",
        referer: "https://www.wesbrookproperties.com/availability/",
        "sec-ch-ua":
          '"Google Chrome";v="111", "Not(A:Brand";v="8", "Chromium";v="111"',
        "sec-ch-ua-mobile": "?0",
        "sec-ch-ua-platform": '"Windows"',
        "sec-fetch-dest": "empty",
        "sec-fetch-mode": "cors",
        "sec-fetch-site": "same-origin",
        "user-agent":
          "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/111.0.0.0 Safari/537.36",
        "x-requested-with": "XMLHttpRequest",
      },
      form: {
        action: "get_availability_html",
        ...filters,
      },
    })
    .text()
    .catch((err) => {
      elog("Error Fetching Wesbrook", err.code);
    });
  if (!response) {
    elog(`Waiting ${ERROR_TIME}ms before retrying`);
    await sleep(ERROR_TIME);
    return await search(filters);
  }
  const $ = cheerio.load(response);
  const results = $(".result_row").toArray();
  if (results.length == 0) {
    // console.log("No Results");
    return [];
  }

  const output: Array<WesbrookAvailable> = [];

  for (const result of results) {
    const img =
      "https://www.wesbrookproperties.com" +
      $(result).find(".result_pic").find("img").attr("src");
    const roomSpec = $(result).find(".header1").text();
    const buildingName = $(result).find(".header2").text();
    const neighbourhood = $(result).find(".header3").text();

    const stats = $(result).find("span");

    const suite = $(stats[0]).text();
    const petFriendly = $(stats[1]).text(); // we dont have pets
    const rent = $(stats[2]).text();
    const moveInDate = $(stats[3]).text();
    output.push({
      roomSpec,
      buildingName,
      neighbourhood,
      suite,
      petFriendly,
      rent,
      moveInDate,
      img,
    });
  }
  return output;
};

const sendWebhook = async (listing: WesbrookAvailable) => {
  const Hook = new Webhook(WEBHOOK_URL);
  const embed = new MessageBuilder()
    .setName("Wesbrook")
    .setText("@everyone")
    .setTitle(listing.buildingName + " - " + listing.suite)
    .setURL("https://www.wesbrookproperties.com/availability/")
    .setDescription("New Wesbrook Listing")
    .setFooter("Developed by github/dezchai", "")
    .setThumbnail(listing.img)
    .setColor("#03D56E")
    .addField("Specs", listing.roomSpec)
    .addField("Suite", listing.suite)
    .addField("Move In Date", listing.moveInDate)
    .addField("Rent", listing.rent)
    .setTime();
  Hook.send(embed);
};

const monitor = async (filters?: WesbrookFilters) => {
  while (true) {
    const results = await search(filters);
    const seen: string[] = readPrevious("wesbrook");
    // each key in unseen is x["suite"]+x["availability"] so the same suite can be unseen
    // more than once.
    const unseen = results.filter(
      (x) => !seen.includes(x["suite"] + x["moveInDate"])
    );
    for (const listing of unseen) {
      slog("New Listing", listing.suite);
      await sendWebhook(listing);
      await sleep(1000);
      seen.push(listing["suite"] + listing["moveInDate"]);
    }

    writePrevious("wesbrook", seen);

    log(
      `Found ${results.length} results, ${unseen.length} were new. Waiting ${SLEEP_TIME}ms`
    );
    await sleep(SLEEP_TIME);
  }
};

export default monitor;
