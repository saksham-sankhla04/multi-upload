import { TwitterApi } from "twitter-api-v2";

const client = new TwitterApi({
  appKey: process.env.TWITTER_API_KEY,
  appSecret: process.env.TWITTER_API_SECRET,
  accessToken: process.env.TWITTER_ACCESS_TOKEN,
  accessSecret: process.env.TWITTER_ACCESS_SECRET,
});

export async function postToTwitter(content) {
  try {
    const tweet = await client.v2.tweet(content);
    return { success: true, id: tweet.data.id };
  } catch (error) {
    return { success: false, error: error.message };
  }
}
