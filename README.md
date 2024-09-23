# auv_rss

This was initially intended as an exercise for an RSS class, but I decided to make it public on Github.

The way it works is pretty simple. This connects to Audiovault.net, retrieves the latest shows and movies, and simply generates an RSS feed with the information.
It will use the ID to determine the publish date, since the date never apears on the site.

It stores the stuff it's found in a JSON file, and publishes the RSS file in a path of your choosing (inside the RSS_FEED_PATH in your dotenv.)

if RSS_FILE_PATH is not found in .env it will be stored in audiovault_feed.rss inside the relative folder.

## Usage

```bash
yarn
yarn start
```
#   a u d i o v a u l t _ n b  
 