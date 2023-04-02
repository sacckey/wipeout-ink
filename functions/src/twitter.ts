import { admin } from './firebaseAdmin'
import * as functions from "firebase-functions"
import { Client } from "twitter-api-sdk"
// import { TwitterResponse } from "../node_modules/twitter-api-sdk/dist/types"
// import { tweetsRecentSearch, components } from "../node_modules/twitter-api-sdk/dist/gen/openapi-types"

// type variants = components["schemas"]["Variants"]

// type mediaItem = {
//   height?: number | undefined
//   media_key?: string | undefined
//   type: string
//   width?: number | undefined
//   variants?: variants
// }

const res2tweets = (res: any) => {
  const media_key2video: {[prop: string]: any} = {}
  res?.includes?.media && res?.includes?.media.map((media: any) => {
    if (media.media_key){
      media_key2video[media.media_key] = media.variants.filter((variant:any) => 'bit_rate' in variant).sort((a: any, b: any) => b.bit_rate - a.bit_rate)[0].url
    }
  })

  const authors: {[prop: string]: any} = {}
  res?.includes?.users?.map((author: any) => {
    authors[author.id] = author
  })

  const tweets: any = []
  res?.data?.map((tweet: any) => {
    const author = authors[tweet.author_id]
    tweets.push({
      id: tweet.id,
      text: tweet.text,
      replyCount: tweet.public_metrics?.reply_count ?? 0,
      twitterLikeCount: tweet.public_metrics?.like_count ?? 0,
      retweetCount: tweet.public_metrics?.retweet_count ?? 0,
      name: author?.name,
      username: author?.username,
      profileImageUrl: author?.profile_image_url,
      url: `https://twitter.com/${author?.username}/status/${tweet.id}`,
      video: tweet.attachments?.media_keys && media_key2video[tweet.attachments?.media_keys[0]],
      twitterUid: tweet.author_id,
      likeCount: 0,
      active: true,
      publishedAt: admin.firestore.Timestamp.fromDate(new Date(tweet.created_at))
    })
  })

  return tweets
}

export const searchTweets = async () => {
  const startTime = new Date()
  startTime.setMinutes(startTime.getMinutes() - 20)
  const startTimeString = startTime.toISOString()
  console.log(`start_time: ${startTimeString}`)

  const client = new Client(process.env.TWITTER_BEARER_TOKEN as string)
  const res = await client.tweets.tweetsRecentSearch({
    "query": "#Splatoon3 #wipeout #NintendoSwitch has:videos -is:retweet",
    "start_time": startTimeString,
    "max_results": 100,
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

  return res2tweets(res)
}

export const saveTweets = async (tweets: any) => {
  for (const tweet of tweets) {
    const tweetDataP = await admin.firestore().collection('tweets').doc(tweet.id).get()
    if (tweetDataP.exists) {
      continue
    }

    await admin.firestore().collection('tweets').doc(tweet.id).set({
      ...tweet,
      createdAt: admin.firestore.FieldValue.serverTimestamp(),
      updatedAt: admin.firestore.FieldValue.serverTimestamp()
    })
    console.log(`saved: ${tweet.id}`)
  }
}


const deleteLike = async (targetTweet: any) => {
  const likes = await admin.firestore().collectionGroup('likes').where('tweet.ref', '==', targetTweet.ref).get()
  likes.docs.map(async (doc: any) => {
    console.log('delete!!!!!!!!')
    functions.logger.info(doc, {structuredData: true})
    await doc.ref.delete()
  })
}


export const updateAndDelete = async (targetTweets: any) => {
  if (targetTweets.length === 0) {
    return
  }

  const targetTweetIds = targetTweets.map((targetTweet: any) => targetTweet.id)
  const client = new Client(process.env.TWITTER_BEARER_TOKEN as string)
  const res = await client.tweets.findTweetsById({
    "ids": targetTweetIds,
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

  const authors: {[prop: string]: any} = {}
  res?.includes?.users?.map((author: any) => {
    authors[author.id] = author
  })

  const resTweets: {[prop: string]: any} = {}
  res?.data?.map((tweet: any) => {
    resTweets[tweet.id] = tweet
  })

  targetTweets.map(async (targetTweet: any) => {
    const tweet = targetTweet.data()
    const tweetId = targetTweet.id
    const author = authors[tweet.twitterUid]
    const resTweet = resTweets[tweetId]

    if (!resTweet){
      functions.logger.info("inactive!!!!!!!!!", {structuredData: true})
      console.log(tweetId)
      await deleteLike(targetTweet)
      tweet.active = false
      tweet.updatedAt = admin.firestore.FieldValue.serverTimestamp()
    }
    else {
      tweet.replyCount = resTweet.public_metrics?.reply_count ?? tweet.replyCount
      tweet.twitterLikeCount = resTweet.public_metrics?.like_count ?? tweet.twitterLikeCount
      tweet.retweetCount = resTweet.public_metrics?.retweet_count ?? tweet.retweetCount
      tweet.name = author?.name
      tweet.username = author?.username
      tweet.profileImageUrl = author?.profile_image_url
      tweet.url = `https://twitter.com/${author?.username}/status/${resTweet.id}`
      tweet.updatedAt = admin.firestore.FieldValue.serverTimestamp()
    }

    functions.logger.info(tweet, {structuredData: true})

    await admin.firestore().collection('tweets').doc(tweetId).set(tweet)
  })
}
