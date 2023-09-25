import got from "got";
import Log from "dezutil";
import { setTimeout as sleep } from "timers/promises";
import { Webhook, MessageBuilder } from "webhook-discord";
import { SLEEP_TIME, ERROR_TIME, WEBHOOK_URL, FB_COOKIE } from "../config.js";
import { readPrevious, writePrevious } from "../utils.js";
import * as fs from "fs";

const { log, elog, slog } = Log.create("Facebook");

// let SLEEP_TIME = 1000;
// This is the only module that is hardcoded to fit my needs
// because the request can look very different depending on the type of search
// Warning: without cookies this may not work on lower quality IP's

interface Edge {
  node: Node;
  cursor: string;
}

interface Node {
  __typename: string;
  story_type: string;
  story_key: string;
  tracking: string;
  listing: Listing;
  id: string;
}

interface Listing {
  __typename: string;
  id: string;
  primary_listing_photo: {
    __typename: string;
    image: { uri: string };
    id: string;
  };
  __isMarketplaceListingRenderable: string;
  listing_price: {
    formatted_amount: string;
    amount_with_offset_in_currency: string;
    amount: string;
  };
  strikethrough_price: null;
  __isMarketplaceListingWithComparablePrice: string;
  comparable_price: null;
  comparable_price_type: null;
  // location: ListingLocation; unnesssary
  is_hidden: boolean;
  is_live: boolean;
  is_pending: boolean;
  is_sold: boolean;
  is_viewer_seller: boolean;
  min_listing_price: null;
  max_listing_price: null;
  marketplace_listing_category_id: string;
  marketplace_listing_title: string;
  custom_title: string;
  // custom_sub_titles_with_rendering_flags: CustomSubTitlesWithRenderingFlag[]; unnesssary
  origin_group: null;
  pre_recorded_videos: any[];
  __isMarketplaceListingWithChildListings: string;
  parent_listing: null;
  // marketplace_listing_seller: MarketplaceListingSeller; unnesssary
  __isMarketplaceListingWithDeliveryOptions: string;
  delivery_types: string[];
}

interface Result {
  price: string;
  title: string;
  photo: string;
  url: string;
}

interface Posting extends Result {
  description: string;
}
const headers = {
  authority: "www.facebook.com",
  accept:
    "text/html,application/xhtml+xml,application/xml;q=0.9,image/avif,image/webp,image/apng,*/*;q=0.8,application/signed-exchange;v=b3;q=0.7",
  "accept-language": "en-US,en;q=0.9",
  "cache-control": "no-cache",
  pragma: "no-cache",
  "sec-ch-prefers-color-scheme": "dark",
  "sec-ch-ua":
    '"Google Chrome";v="111", "Not(A:Brand";v="8", "Chromium";v="111"',
  "sec-ch-ua-full-version-list":
    '"Google Chrome";v="111.0.5563.147", "Not(A:Brand";v="8.0.0.0", "Chromium";v="111.0.5563.147"',
  "sec-ch-ua-mobile": "?0",
  "sec-ch-ua-platform": '"Windows"',
  "sec-ch-ua-platform-version": '"10.0.0"',
  "sec-fetch-dest": "document",
  "sec-fetch-mode": "navigate",
  "sec-fetch-site": "same-origin",
  "sec-fetch-user": "?1",
  "upgrade-insecure-requests": "1",
  "user-agent":
    "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/111.0.0.0 Safari/537.36",
  "viewport-width": "976",
  cookie: FB_COOKIE,
};
const search = async (): Promise<Array<Result>> => {
  const response = await got(
    "https://www.facebook.com/marketplace/vancouver/propertyrentals",
    {
      searchParams: {
        minPrice: "3000", // $
        minBedrooms: "3",
        maxBedrooms: "3",
        exact: "false",
        latitude: "49.262203571682846",
        longitude: "-123.26162338256836",
        radius: "3", // km
      },
      headers: headers,
    }
  )
    .text()
    .catch((err) => {
      elog("Error Fetching Facebook", err.code);
    });
  if (!response) {
    elog(`Waiting ${ERROR_TIME}ms before retrying`);
    await sleep(ERROR_TIME);
    return await search();
  }
  let format = response
    .split("\n")
    .find((line) => line.includes("MarketplaceFeedListingStory"))
    ?.split(`" data-sjs>`)[1]
    .split("</script>")[0];
  if (!format) {
    elog("Error Parsing Facebook, or zero listings");
    elog(`Waiting ${ERROR_TIME}ms before retrying`);
    await sleep(ERROR_TIME);
    return [];
  }
  format = JSON.parse(format);

  // returns an array of listings

  // const listings: Array<Listing> = format["require"][0][3][1]["__bbox"][
  //   "result"
  // ]["data"]["viewer"]["marketplace_feed_stories"]["edges"].map(
  //   (edge: Edge) => edge["node"]["listing"]
  // );

  let listings: Array<Listing> = [];
  try {
    //@ts-ignore
    listings = format["require"][0][3][0]["__bbox"]["require"][0][3][1][
      "__bbox"
    ]["result"]["data"]["viewer"]["marketplace_feed_stories"]["edges"].map(
      (edge: Edge) => edge["node"]["listing"]
    );
  } catch (e) {
    // elog(format);
    elog("Error Parsing Listings");
    await sleep(ERROR_TIME);
    return await search();
  }

  const output: Array<Result> = [];

  // parse data
  listings.map((listing: Listing) => {
    output.push({
      price: listing.listing_price.formatted_amount,
      title: listing.marketplace_listing_title,
      photo: listing.primary_listing_photo?.image.uri || "",
      url: `https://www.facebook.com/marketplace/item/${listing.id}`,
    });
  });
  return output;
};

const getPosting = async (result: Result): Promise<Posting> => {
  const response = await got(result.url, {
    headers: headers,
  })
    .text()
    .catch((err) => {
      elog("Error Fetching Facebook Post", err.code);
    });
  if (!response) {
    elog(`Waiting ${ERROR_TIME}ms before retrying`);
    await sleep(ERROR_TIME);
    return await getPosting(result);
  }

  const description = response
    .split(`},"redacted_description":{"text":"`)[1]
    .split(`"},`)[0];

  if (!description)
    return { ...result, description: "Error Fetching Description" };
  return { ...result, description: description };
};

const sendWebhook = async (listing: Posting) => {
  const hook = new Webhook(WEBHOOK_URL);
  const embed = new MessageBuilder()
    .setName("Facebook")
    .setTitle(listing.title)
    .setText("@everyone")
    .setURL(listing.url)
    .setDescription("New Facebook Listing")
    .setFooter("Developed by github/dezchai", "")
    .setThumbnail(listing.photo)
    .setColor("#03D56E")
    .addField("Description", listing.description.slice(0, 1023))
    .addField("Rent", listing.price)
    .setTime();
  hook.send(embed);
};

const monitor = async () => {
  while (true) {
    const results = await search();
    const seen: string[] = readPrevious("facebook");

    const unseen = results.filter((x) => !seen.includes(x["url"]));
    for (const result of unseen) {
      const post: Posting = await getPosting(result);
      slog("New Listing", post.title);
      await sendWebhook(post);
      await sleep(1000);
      seen.push(post.url);
    }

    writePrevious("facebook", seen);

    log(
      `Found ${results.length} results, ${unseen.length} were new. Waiting ${SLEEP_TIME}ms`
    );
    await sleep(SLEEP_TIME);
  }
};

export default monitor;
