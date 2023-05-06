import * as craigslist from "./sites/craigslist";
(async () => {
    const results = await craigslist.search("apa", "", {
        areaID: 16,
        latitude: 49.281,
        longitude: -123.04,
        searchDistance: 30,
    });
    // console.log(results[0]);
    console.log(await craigslist.getPosting(results[0]));
})();
