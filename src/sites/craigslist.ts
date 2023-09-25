import axios from "axios";
import { v4 as uuidv4 } from "uuid";
import * as crypto from "crypto";
import Log from "dezutil";
import { setTimeout as sleep } from "timers/promises";
import { Webhook, MessageBuilder } from "webhook-discord";
import { SLEEP_TIME, ERROR_TIME, WEBHOOK_URL } from "../config.js";
import { readPrevious, writePrevious } from "../utils.js";

const { log, elog, slog } = Log.create("Craigslist");

interface LocationParams {
  areaId: number;
  latitude: number;
  longitude: number;
  searchDistance: number;
}
interface PostingLocation {
  areaId: number;
  hostname: string;
  lat: number;
  lon: number;
  subareaAbbr: string;
}
interface Result {
  categoryAbbr: string;
  categoryId: string;
  dedupeKey: string;
  images: string[];
  location: PostingLocation;
  postedDate: number;
  postingId: number;
  price: number;
  title: string;
}
interface Posting {
  postedDate: number;
  seeMyOther: number;
  url: string;
  location: PostingLocation;
  categoryId: number;
  updatedDate: number;
  attributes: PostingAttribute[];
  category: string;
  body: string;
  postingId: number;
  section: string;
  categoryAbbr: string;
  title: string;
  images: string[];
  price: number;
}
interface PostingAttribute {
  specialType: string;
  label: string;
  value: string;
}

const eclAppName: string = "craigslist mobile app";
const eclDoorKey: string = "let me use the dev code to log in"; // lmao
const eclUserAgent: string = "CLApp/1.14.2/iOS unknown";
const eclAppVersion: string = "1.14.2-20210412-152100-94d307e1";
const eclLogID: string = "2a1c34f";

const randomString = (length: number): string => {
  return crypto
    .randomBytes(Math.ceil(length / 2))
    .toString("hex")
    .slice(0, length);
};

const getCookie = async (): Promise<string> => {
  let cookie: string | undefined;
  const response = await axios
    .head("https://api.craigslist.org/connection-check", {
      headers: {
        "User-Agent": eclUserAgent,
      },
    })
    .catch((e) => {
      elog("Failed to get cookie", e);
    });

  if (!response) {
    elog(`Waiting ${ERROR_TIME}ms before retrying`);
    await sleep(ERROR_TIME);
    return getCookie();
  }

  cookie = response.headers?.["set-cookie"]?.[0];
  return cookie || (await getCookie());
};

const getBearer = async (areaId: number): Promise<string> => {
  let bearer: string | undefined;
  const cookie = await getCookie();

  const response = await axios({
    url: "https://rapi.craigslist.org/v7/access-token",
    method: "POST",
    headers: {
      "x-ecl-appversion": eclAppVersion,
      Accept: "application/json",
      "x-ecl-appname": eclAppName,
      "x-ecl-doorkey": eclDoorKey,
      "x-ecl-deviceid": uuidv4(),
      "x-ecl-areaid": areaId.toString(),
      "Accept-Language": "en-un",
      "x-ecl-devicename": randomString(16),
      "x-ecl-logid": eclLogID,
      // "Content-Length": body.toString().length.toString(),
      "User-Agent": eclUserAgent,
      "Content-Type": "application/x-www-form-urlencoded",
      Cookie: cookie,
      "x-ecl-useragent": eclUserAgent,
    },
    data: "clProviderCred=ios%3AMIISfwYJKoZIhvcNAQcCoIIScDCCEmwCAQExCzAJBgUrDgMCGgUAMIICIAYJKoZIhvcNAQcBoIICEQSCAg0xggIJMAsCAQ4CAQEEAwIBATALAgEZAgEBBAMCAQIwDAIBEwIBAQQEDAI4MjANAgEDAgEBBAUMAzE1MDANAgEKAgEBBAUWAzEyKzANAgENAgEBBAUCAwH70DAOAgEBAgEBBAYCBE%2Bri2owDgIBCQIBAQQGAgRQMjU2MA4CAQsCAQEEBgIEBxJn7zAOAgEQAgEBBAYCBDIl7towEAIBDwIBAQQIAgY3iNPxbuIwFAIBAAIBAQQMDApQcm9kdWN0aW9uMBgCAQQCAQIEEF%2Fy%2BJ%2F3OWWcbh7%2FOikamoAwHAIBBQIBAQQUZgjb9rVFqJpH%2F4WXl2mZCIfu1vcwHgIBCAIBAQQWFhQyMDIxLTA0LTE5VDIwOjA4OjI1WjAeAgEMAgEBBBYWFDIwMjEtMDQtMTlUMjA6MDg6MjVaMB4CARICAQEEFhYUMjAxOS0xMi0wNFQwNzo1NTo0NFowKQIBAgIBAQQhDB9vcmcuY3JhaWdzbGlzdC5DcmFpZ3NsaXN0TW9iaWxlMDQCAQcCAQEELKsOo%2B9l2%2FZOrtEXW74Z%2FZyOsU4TeGJM%2B%2BnQYpRZjgB2Yi9UyMcy3Gl8f1zeMFECAQYCAQEESRA1vaGxpdxSWcXpa%2BM%2Fu4FuGD9dXLipprSsPYQhE9Zs8AGlAOm8NH%2Bmz%2Bo8hCbvGJJN7mDpfmLSCyhCAsxZZ9MXovSZpsQK2GWggg5lMIIFfDCCBGSgAwIBAgIIDutXh%2BeeCY0wDQYJKoZIhvcNAQEFBQAwgZYxCzAJBgNVBAYTAlVTMRMwEQYDVQQKDApBcHBsZSBJbmMuMSwwKgYDVQQLDCNBcHBsZSBXb3JsZHdpZGUgRGV2ZWxvcGVyIFJlbGF0aW9uczFEMEIGA1UEAww7QXBwbGUgV29ybGR3aWRlIERldmVsb3BlciBSZWxhdGlvbnMgQ2VydGlmaWNhdGlvbiBBdXRob3JpdHkwHhcNMTUxMTEzMDIxNTA5WhcNMjMwMjA3MjE0ODQ3WjCBiTE3MDUGA1UEAwwuTWFjIEFwcCBTdG9yZSBhbmQgaVR1bmVzIFN0b3JlIFJlY2VpcHQgU2lnbmluZzEsMCoGA1UECwwjQXBwbGUgV29ybGR3aWRlIERldmVsb3BlciBSZWxhdGlvbnMxEzARBgNVBAoMCkFwcGxlIEluYy4xCzAJBgNVBAYTAlVTMIIBIjANBgkqhkiG9w0BAQEFAAOCAQ8AMIIBCgKCAQEApc%2BB%2FSWigVvWh%2B0j2jMcjuIjwKXEJss9xp%2FsSg1Vhv%2BkAteXyjlUbX1%2FslQYncQsUnGOZHuCzom6SdYI5bSIcc8%2FW0YuxsQduAOpWKIEPiF41du30I4SjYNMWypoN5PC8r0exNKhDEpYUqsS4%2B3dH5gVkDUtwswSyo1IgfdYeFRr6IwxNh9KBgxHVPM3kLiykol9X6SFSuHAnOC6pLuCl2P0K5PB%2FT5vysH1PKmPUhrAJQp2Dt7%2Bmf7%2Fwmv1W16sc1FJCFaJzEOQzI6BAtCgl7ZcsaFpaYeQEGgmJjm4HRBzsApdxXPQ33Y72C3ZiB7j7AfP4o7Q0%2FomVYHv4gNJIwIDAQABo4IB1zCCAdMwPwYIKwYBBQUHAQEEMzAxMC8GCCsGAQUFBzABhiNodHRwOi8vb2NzcC5hcHBsZS5jb20vb2NzcDAzLXd3ZHIwNDAdBgNVHQ4EFgQUkaSc%2FMR2t5%2BgivRN9Y82Xe0rBIUwDAYDVR0TAQH%2FBAIwADAfBgNVHSMEGDAWgBSIJxcJqbYYYIvs67r2R1nFUlSjtzCCAR4GA1UdIASCARUwggERMIIBDQYKKoZIhvdjZAUGATCB%2FjCBwwYIKwYBBQUHAgIwgbYMgbNSZWxpYW5jZSBvbiB0aGlzIGNlcnRpZmljYXRlIGJ5IGFueSBwYXJ0eSBhc3N1bWVzIGFjY2VwdGFuY2Ugb2YgdGhlIHRoZW4gYXBwbGljYWJsZSBzdGFuZGFyZCB0ZXJtcyBhbmQgY29uZGl0aW9ucyBvZiB1c2UsIGNlcnRpZmljYXRlIHBvbGljeSBhbmQgY2VydGlmaWNhdGlvbiBwcmFjdGljZSBzdGF0ZW1lbnRzLjA2BggrBgEFBQcCARYqaHR0cDovL3d3dy5hcHBsZS5jb20vY2VydGlmaWNhdGVhdXRob3JpdHkvMA4GA1UdDwEB%2FwQEAwIHgDAQBgoqhkiG92NkBgsBBAIFADANBgkqhkiG9w0BAQUFAAOCAQEADaYb0y4941srB25ClmzT6IxDMIJf4FzRjb69D70a%2FCWS24yFw4BZ3%2BPi1y4FFKwN27a4%2Fvw1LnzLrRdrjn8f5He5sWeVtBNephmGdvhaIJXnY4wPc%2Fzo7cYfrpn4ZUhcoOAoOsAQNy25oAQ5H3O5yAX98t5%2FGioqbisB%2FKAgXNnrfSemM%2Fj1mOC%2BRNuxTGf8bgpPyeIGqNKX86eOa1GiWoR1ZdEWBGLjwV%2F1CKnPaNmSAMnBjLP4jQBkulhgwHyvj3XKablbKtYdaG6YQvVMpzcZm8w7HHoZQ%2FOjbb9IYAYMNpIr7N4YtRHaLSPQjvygaZwXG56AezlHRTBhL8cTqDCCBCIwggMKoAMCAQICCAHevMQ5baAQMA0GCSqGSIb3DQEBBQUAMGIxCzAJBgNVBAYTAlVTMRMwEQYDVQQKEwpBcHBsZSBJbmMuMSYwJAYDVQQLEx1BcHBsZSBDZXJ0aWZpY2F0aW9uIEF1dGhvcml0eTEWMBQGA1UEAxMNQXBwbGUgUm9vdCBDQTAeFw0xMzAyMDcyMTQ4NDdaFw0yMzAyMDcyMTQ4NDdaMIGWMQswCQYDVQQGEwJVUzETMBEGA1UECgwKQXBwbGUgSW5jLjEsMCoGA1UECwwjQXBwbGUgV29ybGR3aWRlIERldmVsb3BlciBSZWxhdGlvbnMxRDBCBgNVBAMMO0FwcGxlIFdvcmxkd2lkZSBEZXZlbG9wZXIgUmVsYXRpb25zIENlcnRpZmljYXRpb24gQXV0aG9yaXR5MIIBIjANBgkqhkiG9w0BAQEFAAOCAQ8AMIIBCgKCAQEAyjhUpstWqsgkOUjpjO7sX7h%2FJpG8NFN6znxjgGF3ZF6lByO2Of5QLRVWWHAtfsRuwUqFPi%2Fw3oQaoVfJr3sY%2F2r6FRJJFQgZrKrbKjLtlmNoUhU9jIrsv2sYleADrAF9lwVnzg6FlTdq7Qm2rmfNUWSfxlzRvFduZzWAdjakh4FuOI%2FYKxVOeyXYWr9Og8GN0pPVGnG1YJydM05V%2BRJYDIa4Fg3B5XdFjVBIuist5JSF4ejEncZopbCj%2FGd%2BcLoCWUt3QpE5ufXN4UzvwDtIjKblIV39amq7pxY1YNLmrfNGKcnow4vpecBqYWcVsvD95Wi8Yl9uz5nd7xtj%2FpJlqwIDAQABo4GmMIGjMB0GA1UdDgQWBBSIJxcJqbYYYIvs67r2R1nFUlSjtzAPBgNVHRMBAf8EBTADAQH%2FMB8GA1UdIwQYMBaAFCvQaUeUdgn%2B9GuNLkCm90dNfwheMC4GA1UdHwQnMCUwI6AhoB%2BGHWh0dHA6Ly9jcmwuYXBwbGUuY29tL3Jvb3QuY3JsMA4GA1UdDwEB%2FwQEAwIBhjAQBgoqhkiG92NkBgIBBAIFADANBgkqhkiG9w0BAQUFAAOCAQEAT8%2FvWb4s9bJsL4%2FuE4cy6AU1qG6LfclpDLnZF7x3LNRn4v2abTpZXN%2BDAb2yriphcrGvzcNFMI%2Bjgw3OHUe08ZOKo3SbpMOYcoc7Pq9FC5JUuTK7kBhTawpOELbZHVBsIYAKiU5XjGtbPD2m%2Fd73DSMdC0omhz%2B6kZJMpBkSGW1X9XpYh3toiuSGjErr4kkUqqXdVQCprrtLMK7hoLG8KYDmCXflvjSiAcp%2F3OIK5ju4u%2By6YpXzBWNBgs0POx1MlaTbq%2FnJlelP5E3nJpmB6bz5tCnSAXpm4S6M9iGKxfh44YGuv9OQnamt86%2F9OBqWZzAcUaVc7HGKgrRsDwwVHzCCBLswggOjoAMCAQICAQIwDQYJKoZIhvcNAQEFBQAwYjELMAkGA1UEBhMCVVMxEzARBgNVBAoTCkFwcGxlIEluYy4xJjAkBgNVBAsTHUFwcGxlIENlcnRpZmljYXRpb24gQXV0aG9yaXR5MRYwFAYDVQQDEw1BcHBsZSBSb290IENBMB4XDTA2MDQyNTIxNDAzNloXDTM1MDIwOTIxNDAzNlowYjELMAkGA1UEBhMCVVMxEzARBgNVBAoTCkFwcGxlIEluYy4xJjAkBgNVBAsTHUFwcGxlIENlcnRpZmljYXRpb24gQXV0aG9yaXR5MRYwFAYDVQQDEw1BcHBsZSBSb290IENBMIIBIjANBgkqhkiG9w0BAQEFAAOCAQ8AMIIBCgKCAQEA5JGpCR%2BR2x5HUOsF7V55hC3rNqJXTFXsixmJ3vlLbPUHqyIwAugYPvhQCdN%2FQaiY%2BdHKZpwkaxHQo7vkGyrDH5WeegykR4tb1BY3M8vED03OFGnRyRly9V0O1X9fm%2FIlA7pVj01dDfFkNSMVSxVZHbOU9%2Facns9QusFYUGePCLQg98usLCBvcLY%2FATCMt0PPD5098ytJKBrI%2Fs61uQ7ZXhzWyz21Oq30Dw4AkguxIRYudNU8DdtiFqujcZJHU1XBry9Bs%2Fj743DN5qNMRX4fTGtQlkGJxHRiCxCDQYczioGxMFjsWgQyjGizjx3eZXP%2FZ15lvEnYdp8zFGWhd5TJLQIDAQABo4IBejCCAXYwDgYDVR0PAQH%2FBAQDAgEGMA8GA1UdEwEB%2FwQFMAMBAf8wHQYDVR0OBBYEFCvQaUeUdgn%2B9GuNLkCm90dNfwheMB8GA1UdIwQYMBaAFCvQaUeUdgn%2B9GuNLkCm90dNfwheMIIBEQYDVR0gBIIBCDCCAQQwggEABgkqhkiG92NkBQEwgfIwKgYIKwYBBQUHAgEWHmh0dHBzOi8vd3d3LmFwcGxlLmNvbS9hcHBsZWNhLzCBwwYIKwYBBQUHAgIwgbYagbNSZWxpYW5jZSBvbiB0aGlzIGNlcnRpZmljYXRlIGJ5IGFueSBwYXJ0eSBhc3N1bWVzIGFjY2VwdGFuY2Ugb2YgdGhlIHRoZW4gYXBwbGljYWJsZSBzdGFuZGFyZCB0ZXJtcyBhbmQgY29uZGl0aW9ucyBvZiB1c2UsIGNlcnRpZmljYXRlIHBvbGljeSBhbmQgY2VydGlmaWNhdGlvbiBwcmFjdGljZSBzdGF0ZW1lbnRzLjANBgkqhkiG9w0BAQUFAAOCAQEAXDaZTC14t%2B2Mm9zzd5vydtJ3ME%2FBH4WDhRuZPUc38qmbQI4s1LGQEti%2B9HOb7tJkD8t5TzTYoj75eP9ryAfsfTmDi1Mg0zjEsb%2BaTwpr%2Fyv8WacFCXwXQFYRHnTTt4sjO0ej1W8k4uvRt3DfD0XhJ8rxbXjt57UXF6jcfiI1yiXV2Q%2FWa9SiJCMR96Gsj3OBYMYbWwkvkrL4REjwYDieFfU9JmcgijNq9w2Cz97roy%2F5U2pbZMBjM3f3OgcsVuvaDyEO2rpzGU%2B12TZ%2FwYdV2aeZuTJC%2B9jVcZ5%2BoVK3G72TQiQSKscPHbZNnF5jyEuAF1CqitXa5PzQCQc3sHV1ITGCAcswggHHAgEBMIGjMIGWMQswCQYDVQQGEwJVUzETMBEGA1UECgwKQXBwbGUgSW5jLjEsMCoGA1UECwwjQXBwbGUgV29ybGR3aWRlIERldmVsb3BlciBSZWxhdGlvbnMxRDBCBgNVBAMMO0FwcGxlIFdvcmxkd2lkZSBEZXZlbG9wZXIgUmVsYXRpb25zIENlcnRpZmljYXRpb24gQXV0aG9yaXR5AggO61eH554JjTAJBgUrDgMCGgUAMA0GCSqGSIb3DQEBAQUABIIBAH5dep9UFRw0swHSuuWRsMQ8eoqpFNA0AMkBvE4U7hRzWy2MqbQrJhhpkoStI%2Fmw9PmUStPxDKv5H8uJSK4Y1l8IyFC9Kx3A7CsrghnxhHbgmbKfC8fcSpsbidROrLK83NdPaXvL%2BDG7eUurT54Hxkm4vApDdH4AGuI2r829V%2B5cEyNw%2B7bnDMcFQpX5e6lSq%2Fd%2FrAUh54V%2FneNtr0hTj6%2BqUDLJFdrTYV6By9aKia8HB%2BBGabaO%2FmkmQj8jqwBDaLrEdmkUyt8GlI8RmqrxKXURjVGPBSiYoiMJTpt8YNXYZes4Xl8gIbISDg%2F%2BzzYE9CfkKAHQZ%2FEEMVW0robWgMU%3D&lang=en&cc=us",
  }).catch((err) => {
    elog("Error Getting Post", err.code);
  });
  if (!response) {
    elog(`Waiting ${ERROR_TIME}ms before retrying`);
    await sleep(ERROR_TIME);
    return await getBearer(areaId);
  }
  bearer = response.data?.data?.items[0]?.accessToken;
  return bearer ?? "";
};

/**
 * Retrieves a posting from the Craigslist API.
 * @param {Result} result - The result object containing the postingId, categoryAbbr and location.
 * @returns {Promise<Posting>} A promise that resolves to a Posting object.
 * @throws Will throw an error if the response status is not 200 or if the response data is invalid.
 */
const getPosting = async (result: Result): Promise<Posting> => {
  const id = result.postingId;
  const categoryAbbr = result.categoryAbbr;
  const location = result.location;

  const cookie = await getCookie();
  const bearer = await getBearer(location.areaId);

  const response = await axios<{ data: { items: Posting[] } }>({
    url:
      "https://api.craigslist.org/v7/postings/" +
      location.hostname +
      "/" +
      location.subareaAbbr +
      "/" +
      categoryAbbr +
      "/" +
      id.toString() +
      ".0",
    method: "GET",
    headers: {
      Accept: "application/json",
      "x-ecl-devicecountry": "US",
      "x-ecl-devicemanufacturer": "Apple",
      "x-ecl-devicemodel": "iPad Pro 12.9-inch (3rd generation)",
      "x-ecl-systemname": "iOS",
      "x-ecl-appversion": eclAppVersion,
      "x-ecl-devicelocale": "en",
      "x-ecl-systemversion": "14.6",
      "x-ecl-devicebrand": "Apple",
      "x-ecl-appname": eclAppName,
      "x-ecl-doorkey": eclDoorKey,
      "x-ecl-deviceid": uuidv4(),
      "x-ecl-areaid": location.areaId.toString(),
      "x-ecl-logid": eclLogID,
      "x-ecl-useragent": eclUserAgent,
      "x-ecl-devicename": randomString(16),
      "User-Agent": eclUserAgent,
      Cookie: cookie,
      Authorization: "Bearer " + bearer,
    },
    params: {
      lang: "en",
      cc: "us",
    },
  }).catch((error) => {
    elog("Error Fetching Craigslist", error);
  });
  if (!response) {
    elog(`Waiting ${ERROR_TIME}ms before retrying`);
    await sleep(ERROR_TIME);
    return await getPosting(result);
  }

  if (response.data.data.items === undefined) {
    // throw new Error("Get Posting failed with invalid response");
    elog("Get Posting failed with invalid response");
    await sleep(ERROR_TIME);
    return await getPosting(result);
  }

  return response.data.data.items[0];
};

/**
 * Search for items in a specific category and location with optional filters.
 * @param {string} category - The category to search for. See categories.md
 * @param {string} query - The search query.
 * @param {LocationParams} location - The location to search near.
 * @param {Object.<string, string>} [filters] - Optional filters to apply to the search.
 * The name of key value pairs can be found by intercepting the sapi.craigslist.org... request
 * in browser dev tools.
 * @returns {Promise<Result[]>} A Promise that resolves with the search results.
 */
const search = async (
  category: string,
  query: string,
  location: LocationParams,
  filters?: {
    [key: string]: string;
  }
): Promise<Result[]> => {
  const queryParams: any = {
    area_id: location.areaId.toString(),
    batchSize: "100",
    lat: location.latitude.toString(),
    lon: location.longitude.toString(),
    search_distance: (location.searchDistance / 1.609).toString(), // api is in miles
    startIndex: "0",
    lang: "en",
    cc: "us",
  };
  if (query !== "") {
    queryParams["query"] = query;
  }
  if (filters) {
    for (const key in filters) {
      queryParams[key] = filters[key];
    }
  }

  const cookie = await getCookie();
  const bearer = await getBearer(location.areaId);

  let response = await axios<{ data: { items: Result[] } }>({
    url: "https://sapi.craigslist.org/v7/postings/" + category + "/search",
    method: "GET",
    params: queryParams,
    headers: {
      Accept: "application/json",
      "x-ecl-devicecountry": "US",
      "x-ecl-devicemanufacturer": "Apple",
      "x-ecl-devicemodel": "iPad Pro 12.9-inch (3rd generation)",
      "x-ecl-systemname": "iOS",
      "x-ecl-appversion": eclAppVersion,
      "x-ecl-devicelocale": "en",
      "x-ecl-systemversion": "14.6",
      "x-ecl-devicebrand": "Apple",
      "x-ecl-appname": eclAppName,
      "x-ecl-doorkey": eclDoorKey,
      "x-ecl-deviceid": uuidv4(),
      "x-ecl-areaid": location.areaId.toString(),
      "x-ecl-logid": eclLogID,
      "x-ecl-useragent": eclUserAgent,
      "x-ecl-devicename": randomString(16),
      "User-Agent": eclUserAgent,
      Cookie: cookie,
      Authorization: "Bearer " + bearer,
    },
  }).catch((error) => {
    elog("Error Fetching Craigslist", error);
  });
  if (!response) {
    elog(`Waiting ${ERROR_TIME}ms before retrying`);
    await sleep(ERROR_TIME);
    return await search(category, query, location, filters);
  }
  return response.data.data.items;
};

const sendWebhook = async (post: Posting) => {
  const hook = new Webhook(WEBHOOK_URL);
  const image = post.images[0]
    ? "https://images.craigslist.org/" +
      post.images[0].split(":")[1] +
      "_600x450.jpg"
    : "https://1000logos.net/wp-content/uploads/2020/11/Craigslist-emblem.jpg";
  const embed = new MessageBuilder()
    .setName("Craigslist")
    .setTitle(post.title)
    .setText("@everyone")
    .setURL(post.url)
    .setDescription("New Craigslist Listing")
    .setFooter("Developed by github/dezchai", "")
    .setThumbnail(image)
    .setColor("#03D56E")
    .addField("Description", post.body.slice(0, 1023))
    .addField("Price", post.price.toString())
    .setTime();
  hook.send(embed);
};

const monitor = async (
  category: string,
  query: string,
  location: LocationParams,
  filters?: {
    [key: string]: string;
  }
) => {
  while (true) {
    const results = await search(category, query, location, filters);
    const seen: number[] = readPrevious("craigslist");

    const unseen = results.filter((x) => !seen.includes(x.postingId));

    for (const result of unseen) {
      const post = await getPosting(result);

      slog("New Listing", post.title);
      await sendWebhook(post);
      seen.push(post.postingId);
      sleep(1000);
    }

    writePrevious("craigslist", seen);

    log(
      `Found ${results.length} results, ${unseen.length} were new. Waiting ${SLEEP_TIME}ms`
    );
    await sleep(SLEEP_TIME);
  }
};

export default monitor;
