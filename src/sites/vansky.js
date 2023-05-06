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
import * as fs from "fs";
import { Webhook, MessageBuilder } from "webhook-discord";
import { setTimeout as sleep } from "timers/promises";
import { Log } from "dezutil";
var log = Log.getLogger("vansky");
log("hello");
var WEBHOOK_URL = "https://discord.com/api/webhooks/1103979314942316565/w3yr_rZxSA0YBvsxo6J2xiVg87BN9pk8fuyvObFRYYKdBYs5B8unEZuem3GrF5b9XOOE";
var translate = function (text) {
    // this one is a tremendous pain in the ass, may switch to some actual translate api
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
var getPosting = function (uri) { return __awaiter(void 0, void 0, void 0, function () {
    var response, $, title, img, table, specs, moveInDate, rent;
    return __generator(this, function (_a) {
        switch (_a.label) {
            case 0: return [4 /*yield*/, got("https://www.vansky.com/info/" + uri, {
                    headers: {
                        "user-agent": "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome",
                    },
                })
                    .text()
                    .catch(function (err) {
                    console.error("Error Getting Post", err.code);
                })];
            case 1:
                response = _a.sent();
                if (!response)
                    return [2 /*return*/, getPosting(uri)];
                $ = cheerio.load(response);
                title = translate($("h1").text().trim());
                img = "https://vansky.com" + $("span.img_wrap").find("img").attr("src");
                table = $("tbody").find("tr").toArray();
                specs = $(table.find(function (x) {
                    return $(x).text().trim().replace("\n", "").startsWith("房间情况：");
                })).text();
                specs = translate(specs);
                moveInDate = $(table.find(function (x) {
                    return $(x).text().trim().replace("\n", "").startsWith("可用时间：");
                }))
                    .text()
                    .trim()
                    .replace("\n", "");
                moveInDate = translate(moveInDate);
                rent = $(table.find(function (x) {
                    return $(x).text().trim().replace("\n", "").startsWith("租金或价格：");
                }))
                    .text()
                    .trim()
                    .replace("\n", "");
                rent = translate(rent);
                // console.log("rent: " + rent);
                return [2 /*return*/, {
                        title: title,
                        img: img,
                        specs: specs,
                        moveInDate: moveInDate,
                        rent: rent,
                        url: "https://vansky.com/info/" + uri,
                    }];
        }
    });
}); };
var search = function (query) { return __awaiter(void 0, void 0, void 0, function () {
    var response, $, output;
    return __generator(this, function (_a) {
        switch (_a.label) {
            case 0: return [4 /*yield*/, got("https://www.vansky.com/info/ZFBG08.html?page=1&location=CITY01&title=" +
                    query.split(" ").join("+"), {
                    headers: {
                        "user-agent": "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/111.0.0.0 Safari/537.36",
                    },
                })
                    .text()
                    .catch(function (err) {
                    console.error("Error Fetching Vansky", err.code);
                })];
            case 1:
                response = _a.sent();
                if (!response)
                    return [2 /*return*/, search(query)];
                $ = cheerio.load(response);
                output = [];
                $("a.adsTitleFont").map(function (i, el) {
                    var href = $(el).attr("href");
                    if (href) {
                        output.push(href);
                    }
                });
                return [2 /*return*/, output];
        }
    });
}); };
var sendWebhook = function (post) { return __awaiter(void 0, void 0, void 0, function () {
    var Hook, specs, embed;
    return __generator(this, function (_a) {
        Hook = new Webhook(WEBHOOK_URL);
        specs = post.specs.replaceAll(/(\S+\s*\s*\S+)/g, "\n$&\t");
        embed = new MessageBuilder()
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
        Hook.send(embed);
        return [2 /*return*/];
    });
}); };
export var monitor = function (query) { return __awaiter(void 0, void 0, void 0, function () {
    var _loop_1;
    return __generator(this, function (_a) {
        switch (_a.label) {
            case 0:
                _loop_1 = function () {
                    var results, seen, _b, _c, unseen, _i, unseen_1, x, post;
                    return __generator(this, function (_d) {
                        switch (_d.label) {
                            case 0:
                                console.log("Vansky Monitor");
                                return [4 /*yield*/, search(query)];
                            case 1:
                                results = _d.sent();
                                _c = (_b = JSON).parse;
                                return [4 /*yield*/, fs.promises.readFile("./previous.json", "utf-8")];
                            case 2:
                                seen = _c.apply(_b, [_d.sent()]);
                                unseen = results.filter(function (x) { return !seen["vansky"].includes(x); });
                                _i = 0, unseen_1 = unseen;
                                _d.label = 3;
                            case 3:
                                if (!(_i < unseen_1.length)) return [3 /*break*/, 8];
                                x = unseen_1[_i];
                                return [4 /*yield*/, getPosting(x)];
                            case 4:
                                post = _d.sent();
                                console.log("Vansky New Post", post.title);
                                return [4 /*yield*/, sendWebhook(post)];
                            case 5:
                                _d.sent();
                                return [4 /*yield*/, sleep(1000)];
                            case 6:
                                _d.sent();
                                seen.vansky.push(x);
                                _d.label = 7;
                            case 7:
                                _i++;
                                return [3 /*break*/, 3];
                            case 8: return [4 /*yield*/, fs.promises.writeFile("./previous.json", JSON.stringify(seen, null, 4))];
                            case 9:
                                _d.sent();
                                return [4 /*yield*/, sleep(10000)];
                            case 10:
                                _d.sent();
                                return [2 /*return*/];
                        }
                    });
                };
                _a.label = 1;
            case 1:
                if (!true) return [3 /*break*/, 3];
                return [5 /*yield**/, _loop_1()];
            case 2:
                _a.sent();
                return [3 /*break*/, 1];
            case 3: return [2 /*return*/];
        }
    });
}); };
