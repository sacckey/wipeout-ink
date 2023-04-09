import { admin } from './firebaseAdmin'
// import * as functions from "firebase-functions"
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
      publishedAt: admin.firestore.Timestamp.fromDate(new Date(tweet.created_at))
    })
  })

  return tweets
}

export const searchRecentTweets = async () => {
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

export const searchTweetsById = async (ids: string[]) => {
  if (ids.length === 0) return []

  const client = new Client(process.env.TWITTER_BEARER_TOKEN as string)
  const res = await client.tweets.findTweetsById({
    "ids": ids,
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

export const createTweets = async (tweets: any) => {
  for (const tweet of tweets) {
    const tweetDataP = await admin.firestore().collection('tweets').doc(tweet.id).get()
    if (tweetDataP.exists) {
      continue
    }

    await admin.firestore().collection('tweets').doc(tweet.id).set({
      ...tweet,
      likeCount: 0,
      active: true,
      createdAt: admin.firestore.FieldValue.serverTimestamp(),
      updatedAt: admin.firestore.FieldValue.serverTimestamp()
    })
    console.log(`created: ${tweet.id}`)
  }
}

export const updateTweets = async (tweets: any) => {
  tweets.map(async (tweet: any) => {
    await admin.firestore().collection('tweets').doc(tweet.id).update({
      ...tweet,
      updatedAt: admin.firestore.FieldValue.serverTimestamp()
    })
  })
}


// const deleteLike = async (targetTweet: any) => {
//   const likes = await admin.firestore().collectionGroup('likes').where('tweet.ref', '==', targetTweet.ref).get()
//   likes.docs.map(async (doc: any) => {
//     console.log('delete!!!!!!!!')
//     functions.logger.info(doc, {structuredData: true})
//     await doc.ref.delete()
//   })
// }

//  functions.logger.info(`inactive: ${tweetId}`)
//  await deleteLike(targetTweet)
//  tweet.active = false
//  tweet.updatedAt = admin.firestore.FieldValue.serverTimestamp()