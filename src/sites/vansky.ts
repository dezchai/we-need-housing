import got from "got";
import * as cheerio from "cheerio";
import * as fs from "fs";
import { Webhook, MessageBuilder } from "webhook-discord";
import { setTimeout as sleep } from "timers/promises";
import Log from "dezutil";
import { SLEEP_TIME, ERROR_TIME, WEBHOOK_URL } from "../config.js";
import { writePrevious, readPrevious } from "../utils.js";

const { log, elog, slog } = Log.create("Vansky");

interface Posting {
  title: string;
  img: string;
  specs: string;
  moveInDate: string;
  rent: string;
  url: string;
}

const translate = (text: string): string => {
  // this is a tremendous pain may switch to some actual translate api
  return text
    .replaceAll("睡房", " Bedroom ")
    .replaceAll("浴室", " Bathroom ")
    .replaceAll("客厅", " LivingRoom ")
    .replaceAll("全功能厨房", "")
    .replaceAll("饭厅", " DiningRoom")
    .replaceAll("左右", "")
    .replaceAll("；", "")
    .replaceAll("房间情况：", "")
    .replaceAll("可用时间：", "")
    .replaceAll("租金或价格：", "")
    .trim()
    .replaceAll("\n", "");
};
const getPosting = async (uri: string): Promise<Posting> => {
  const response = await got("https://www.vansky.com/info/" + uri, {
    headers: {
      "user-agent":
        "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome",
    },
  })
    .text()
    .catch((err) => {
      elog("Error Getting Post", err.code);
    });
  if (!response) return await getPosting(uri);

  const $ = cheerio.load(response);

  const title = translate($("h1").text().trim());
  // log("title: " + title);
  const img = "https://vansky.com" + $("span.img_wrap").find("img").attr("src");
  // log("img: " + img);

  let table = $("tbody").find("tr").toArray();

  let specs = $(
    table.find((x) =>
      $(x).text().trim().replace("\n", "").startsWith("房间情况：")
    )
  ).text();

  specs = translate(specs);
  // log("specs: " + specs);
  let moveInDate = $(
    table.find((x) =>
      $(x).text().trim().replace("\n", "").startsWith("可用时间：")
    )
  )
    .text()
    .trim()
    .replace("\n", "");
  moveInDate = translate(moveInDate);
  // log("moveInDate: " + moveInDate);
  let rent = $(
    table.find((x) =>
      $(x).text().trim().replace("\n", "").startsWith("租金或价格：")
    )
  )
    .text()
    .trim()
    .replace("\n", "");
  rent = translate(rent);
  // log("rent: " + rent);
  return {
    title,
    img,
    specs,
    moveInDate,
    rent,
    url: "https://vansky.com/info/" + uri,
  };
};
const search = async (query: string): Promise<Array<string>> => {
  const response = await got(
    "https://www.vansky.com/info/ZFBG08.html?page=1&location=CITY01&title=" +
      query.split(" ").join("+"),
    {
      headers: {
        "user-agent":
          "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/111.0.0.0 Safari/537.36",
      },
    }
  )
    .text()
    .catch((err) => {
      elog("Error Fetching Vansky", err.code);
    });
  if (!response) {
    elog(`Waiting ${ERROR_TIME}ms before retrying`);
    await sleep(ERROR_TIME);
    return await search(query);
  }
  const $ = cheerio.load(response);

  const output: Array<string> = []; // array of links
  $("a.adsTitleFont").map((i, el) => {
    const href = $(el).attr("href");
    if (href) {
      output.push(href);
    }
  });
  return output;
};

const sendWebhook = async (post: Posting) => {
  const hook = new Webhook(WEBHOOK_URL);
  // make each description of room on a sepearte line.
  // e.g. "1 Bedroom 1 Bathroom" -> "1 Bedroom\n1 Bathroom"
  // every second space is replaced with \n
  const specs = post.specs.replaceAll(/(\S+\s*\s*\S+)/g, "\n$&\t");
  const embed = new MessageBuilder()
    .setName("Vansky")
    .setTitle(post.title)
    .setURL(post.url)
    .setDescription("New Vansky Listing")
    .setFooter("Developed by github/dezchai", "")
    .setThumbnail(post.img)
    .setColor("#03D56E")
    .addField("Specs", specs)
    .addField("Move In Date", post.moveInDate)
    .addField("Rent", post.rent)
    .setTime();
  hook.send(embed);
};
const monitor = async (query: string) => {
  while (true) {
    const results = await search(query);
    const seen: string[] = readPrevious("vansky");

    const unseen = results.filter((x) => !seen.includes(x));

    for (const x of unseen) {
      const post = await getPosting(x);
      slog("New Post", post.title);
      await sendWebhook(post);
      await sleep(1000);
      seen.push(x);
    }

    writePrevious("vansky", seen);

    log(
      `Found ${results.length} results, ${unseen.length} were new. Waiting ${SLEEP_TIME}ms`
    );
    await sleep(SLEEP_TIME);
  }
};

export default monitor;
