var __awaiter = (this && this.__awaiter) || function (thisArg, _arguments, P, generator) {
    function adopt(value) { return value instanceof P ? value : new P(function (resolve) { resolve(value); }); }
    return new (P || (P = Promise))(function (resolve, reject) {
        function fulfilled(value) { try { step(generator.next(value)); } catch (e) { reject(e); } }
        function rejected(value) { try { step(generator["throw"](value)); } catch (e) { reject(e); } }
        function step(result) { result.done ? resolve(result.value) : adopt(result.value).then(fulfilled, rejected); }
        step((generator = generator.apply(thisArg, _arguments || [])).next());
    });
};
var __generator = (this && this.__generator) || function (thisArg, body) {
    var _ = { label: 0, sent: function() { if (t[0] & 1) throw t[1]; return t[1]; }, trys: [], ops: [] }, f, y, t, g;
    return g = { next: verb(0), "throw": verb(1), "return": verb(2) }, typeof Symbol === "function" && (g[Symbol.iterator] = function() { return this; }), g;
    function verb(n) { return function (v) { return step([n, v]); }; }
    function step(op) {
        if (f) throw new TypeError("Generator is already executing.");
        while (g && (g = 0, op[0] && (_ = 0)), _) try {
            if (f = 1, y && (t = op[0] & 2 ? y["return"] : op[0] ? y["throw"] || ((t = y["return"]) && t.call(y), 0) : y.next) && !(t = t.call(y, op[1])).done) return t;
            if (y = 0, t) op = [op[0] & 2, t.value];
            switch (op[0]) {
                case 0: case 1: t = op; break;
                case 4: _.label++; return { value: op[1], done: false };
                case 5: _.label++; y = op[1]; op = [0]; continue;
                case 7: op = _.ops.pop(); _.trys.pop(); continue;
                default:
                    if (!(t = _.trys, t = t.length > 0 && t[t.length - 1]) && (op[0] === 6 || op[0] === 2)) { _ = 0; continue; }
                    if (op[0] === 3 && (!t || (op[1] > t[0] && op[1] < t[3]))) { _.label = op[1]; break; }
                    if (op[0] === 6 && _.label < t[1]) { _.label = t[1]; t = op; break; }
                    if (t && _.label < t[2]) { _.label = t[2]; _.ops.push(op); break; }
                    if (t[2]) _.ops.pop();
                    _.trys.pop(); continue;
            }
            op = body.call(thisArg, _);
        } catch (e) { op = [6, e]; y = 0; } finally { f = t = 0; }
        if (op[0] & 5) throw op[1]; return { value: op[0] ? op[1] : void 0, done: true };
    }
};
import got from "got";
export var facebook = function () { return __awaiter(void 0, void 0, void 0, function () {
    var response, format, listings, output;
    return __generator(this, function (_a) {
        switch (_a.label) {
            case 0: return [4 /*yield*/, got("https://www.facebook.com/marketplace/vancouver/propertyrentals", {
                    searchParams: {
                        minPrice: "3000",
                        minBedrooms: "3",
                        exact: "false",
                        latitude: "49.280032361124775",
                        longitude: "-123.18704978779931",
                        radius: "2.25",
                    },
                    headers: {
                        authority: "www.facebook.com",
                        accept: "text/html,application/xhtml+xml,application/xml;q=0.9,image/avif,image/webp,image/apng,*/*;q=0.8,application/signed-exchange;v=b3;q=0.7",
                        "accept-language": "en-US,en;q=0.9",
                        "cache-control": "no-cache",
                        pragma: "no-cache",
                        "sec-ch-prefers-color-scheme": "dark",
                        "sec-ch-ua": '"Google Chrome";v="111", "Not(A:Brand";v="8", "Chromium";v="111"',
                        "sec-ch-ua-full-version-list": '"Google Chrome";v="111.0.5563.147", "Not(A:Brand";v="8.0.0.0", "Chromium";v="111.0.5563.147"',
                        "sec-ch-ua-mobile": "?0",
                        "sec-ch-ua-platform": '"Windows"',
                        "sec-ch-ua-platform-version": '"10.0.0"',
                        "sec-fetch-dest": "document",
                        "sec-fetch-mode": "navigate",
                        "sec-fetch-site": "same-origin",
                        "sec-fetch-user": "?1",
                        "upgrade-insecure-requests": "1",
                        "user-agent": "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/111.0.0.0 Safari/537.36",
                        "viewport-width": "976",
                    },
                })
                    .text()
                    .catch(function (err) {
                    console.error("Error Fetching Facebook", err.code);
                })];
            case 1:
                response = _a.sent();
                if (!response)
                    return [2 /*return*/];
                format = response
                    .split("\n")
                    .find(function (line) { return line.includes("formatted_amount"); })
                    .split("handleWithCustomApplyEach(ScheduledApplyEach,")[1]
                    .split(");});});</script>")[0];
                format = JSON.parse(format);
                listings = format["require"][0][3][1]["__bbox"]["result"]["data"]["viewer"]["marketplace_feed_stories"]["edges"].map(function (edge) { return edge["node"]["listing"]; });
                output = [];
                // parse data
                listings.map(function (listing) {
                    output.push({
                        price: listing.listing_price.formatted_amount,
                        title: listing.marketplace_listing_title,
                        photo: listing.primary_listing_photo.image.uri,
                        url: "https://www.facebook.com/marketplace/item/".concat(listing.id),
                    });
                });
                return [2 /*return*/, output];
        }
    });
}); };
