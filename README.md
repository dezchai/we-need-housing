# We Need Housing
After finishing my first year at UBC, my friends and I encountered a problem for our second year.  We needed housing. Like many others, we were too high on the waitlist for on-campus housing. So we began to search through all the rental sites. All the listings we found were either too expensive or too far from campus. Adding insult to injury, once there was a reasonable listing, someone else would almost immediately take it. The demand was just off the charts, especially for three bedrooms. 
If I wanted to improve my chances of getting a place for us, I needed to craft some advantages, which led to the development of this application.
## Description
This command line app will refresh Facebook, Craigslist, Vansky, and Wesbrook Properties tens and thousands of times (millions if you want) daily with your search parameters. Once a new listing is found, a Discord message with all the listing details is sent to a Webhook:
<p align="center" >
  <img width="400" src="https://cdn.discordapp.com/attachments/1062207578161021040/1155646629160947712/image.png" />
</p>
<p align="center" >
An example Webhook Embed message.
</p>
Since we received push notifications the second a new listing was posted, we could quickly contact the person to schedule a viewing. Faster than anyone else could. And if you're curious, this is what the terminal looks like when running
<p align="center">
  <img src="https://cdn.discordapp.com/attachments/827619107359817728/1155657451664851005/2023-09-24_15_53_27-Window.png"/>
</p>

## Installation and Usage
Clone the project, then install the required libraries. Setup a `.env` file as shown, and configure `src/index.ts` with your search parameters, then run `npm run start`
```bash
git clone https://github.com/dezchai/WENEEDHOUSING.git
cd WENEEDHOUSING
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
