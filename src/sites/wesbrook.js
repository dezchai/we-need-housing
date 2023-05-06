var __assign = (this && this.__assign) || function () {
    __assign = Object.assign || function(t) {
        for (var s, i = 1, n = arguments.length; i < n; i++) {
            s = arguments[i];
            for (var p in s) if (Object.prototype.hasOwnProperty.call(s, p))
                t[p] = s[p];
        }
        return t;
    };
    return __assign.apply(this, arguments);
};
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
import * as cheerio from "cheerio";
export var wesbrook = function (filters) { return __awaiter(void 0, void 0, void 0, function () {
    var response, $, results, output, _i, results_1, result, img, roomSpec, buildingName, neighbourhood, stats, suite, petFriendly, rent, availability;
    return __generator(this, function (_a) {
        switch (_a.label) {
            case 0: return [4 /*yield*/, got
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
                        "sec-ch-ua": '"Google Chrome";v="111", "Not(A:Brand";v="8", "Chromium";v="111"',
                        "sec-ch-ua-mobile": "?0",
                        "sec-ch-ua-platform": '"Windows"',
                        "sec-fetch-dest": "empty",
                        "sec-fetch-mode": "cors",
                        "sec-fetch-site": "same-origin",
                        "user-agent": "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/111.0.0.0 Safari/537.36",
                        "x-requested-with": "XMLHttpRequest",
                    },
                    form: __assign({ action: "get_availability_html" }, filters),
                })
                    .text()
                    .catch(function (err) {
                    console.error("ERROR", err.code);
                })];
            case 1:
                response = _a.sent();
                if (!response)
                    return [2 /*return*/];
                $ = cheerio.load(response);
                results = $(".result_row").toArray();
                if (results.length == 0) {
                    console.log("No Results");
                    return [2 /*return*/, []];
                }
                output = [];
                for (_i = 0, results_1 = results; _i < results_1.length; _i++) {
                    result = results_1[_i];
                    img = "https://www.wesbrookproperties.com" +
                        $(result).find(".result_pic").find("img").attr("src");
                    roomSpec = $(result).find(".header1").text();
                    buildingName = $(result).find(".header2").text();
                    neighbourhood = $(result).find(".header3").text();
                    stats = $(result).find("span");
                    suite = $(stats[0]).text();
                    petFriendly = $(stats[1]).text();
                    rent = $(stats[2]).text();
                    availability = $(stats[3]).text();
                    console.log(suite, petFriendly, rent, availability);
                    output.push({
                        roomSpec: roomSpec,
                        buildingName: buildingName,
                        neighbourhood: neighbourhood,
                        suite: suite,
                        petFriendly: petFriendly,
                        rent: rent,
                        availability: availability,
                        img: img,
                    });
                }
                return [2 /*return*/, output];
        }
    });
}); };
