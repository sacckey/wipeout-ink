import { Client } from "twitter-api-sdk"

export const fetchTweets = async (tweetIds: string[]) => {
  if (tweetIds.length === 0) {
    return []
  }

  const client = new Client(process.env.TWITTER_BEARER_TOKEN as string)

  const res = await client.tweets.findTweetsById({
    "ids": tweetIds,
    "tweet.fields": [
      "source",
      "public_metrics",
      "created_at"
    ],
    "expansions": [
      "author_id",
      "attachments.media_keys"
    ],
    "media.fields": [
      "variants",
    ],
    "user.fields": [
      "profile_image_url"
    ]
  })

  const media_key2video: {[prop: string]: any} = {}
  res?.includes?.media && res?.includes?.media.map((media: any) => {
    if(media.media_key){
      media_key2video[media.media_key] = media.variants.filter((variant:any) => 'bit_rate' in variant).sort((a: any, b: any) => b.bit_rate - a.bit_rate)[0].url
    }
  })

  const tweets = res?.data && res.data.map((t) => {
    const author = res?.includes?.users && res?.includes?.users.find((a) => a.id === t.author_id)
    return {
      id: t.id,
      text: t.text,
      createdAt: t.created_at && new Date(t.created_at).toLocaleDateString('en', {
        year: 'numeric',
        month: 'long',
        day: 'numeric',
        timeZone: 'UTC',
      }),
      metrics: {
        replies: formatMetric(t.public_metrics?.reply_count ?? 0),
        likes: formatMetric(t.public_metrics?.like_count ?? 0),
        retweets: formatMetric(t.public_metrics?.retweet_count ?? 0),
      },
      author: {
        uid: author?.id,
        name: author?.name,
        username: author?.username,
        profileImageUrl: author?.profile_image_url,
      },
      url: `https://twitter.com/${author?.username}/status/${t.id}`,
      video: t.attachments?.media_keys && media_key2video[t.attachments?.media_keys[0]],
      source: t.source
    }
  })

  return tweets
}

export const formatMetric = (number: number) => {
  if (number < 1000) {
    return number
  }
  if (number < 1000000) {
    return `${(number / 1000).toFixed(1)}K`
  }
  return `${(number / 1000000).toFixed(1)}M`
}
