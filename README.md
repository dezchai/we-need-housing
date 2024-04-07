# We Need Housing
Having completed my first year at UBC, my friends and I faced a challenge as we entered our second year: finding housing. We were placed too high on the waitlist for on-campus options, which pushed us to look on rental sites. However, our search often ended in disappointment. The available options were either far too expensive or inconveniently far from campus. To make matters worse, suitable listings were snapped up almost instantly whenever we found them. The demand for three-bedroom apartments was just off the charts. Realizing this, I knew I needed to craft some advantages to improve our chances of getting a place. This realization led to the development of this application.
## Description
This command line app will refresh Facebook, Craigslist, Vansky, and Wesbrook Properties tens and thousands of times (millions if you want) daily with your search parameters. Once a new listing is found, a Discord message with all the listing details is sent to a Webhook:
<p align="center" >
  <img width="400" src="https://i.imgur.com/bjbrCCP.png" />
</p>
<p align="center" >
An example Webhook Embed message.
</p>
Since we received push notifications the second a new listing was posted, we could quickly contact the person to schedule a viewing. Faster than anyone else could. And if you're curious, this is what the terminal looks like when running
<p align="center">
  <img src="https://i.imgur.com/HLJ10qU.png"/>
</p>

## Installation and Usage
Clone the project, then install the required libraries. Setup a `.env` file as shown, and configure `src/index.ts` with your search parameters, then run `npm run start`
```bash
git clone https://github.com/dezchai/we-need-housing.git
cd we-need-housing
npm i
```
```
#.env
WEBHOOK_URL="!!!" # https://support.discord.com/hc/en-us/articles/228383668-Intro-to-Webhooks
SLEEP_TIME=10000 # ms
ERROR_TIME=30000 # ms
FB_COOKIE="" # optional, but will reduce errors
```
```bash
npm run start
```

## License
This project is licensed under the [MIT License](https://choosealicense.com/licenses/mit/).
