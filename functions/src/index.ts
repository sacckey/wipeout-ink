import * as admin from 'firebase-admin'
import * as functions from "firebase-functions"
import { Client } from "twitter-api-sdk"

admin.initializeApp()

const searchTweets = async (startTime: Date) => {
  const startTimeString = startTime.toISOString()
  console.log(`start_time: ${startTimeString}`)

  const client = new Client(process.env.TWITTER_BEARER_TOKEN as string)
  const res = await client.tweets.tweetsRecentSearch({
    "query": "#Splatoon3 #wipeout has:videos -is:retweet",
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

  return res
}

const saveTweets = async (res: any) => {
  const media_key2video: {[prop: string]: any} = {}
  res?.includes?.media && res?.includes?.media.map((media: any) => {
    if (media.media_key){
      media_key2video[media.media_key] = media.variants.filter((variant:any) => 'bit_rate' in variant).sort((a: any, b: any) => b.bit_rate - a.bit_rate)[0].url
    }
  })

  const authors: {[prop: string]: any} = {}
  res?.includes?.users.map((author: any) => {
    authors[author.id] = author
  })

  const saveTweet = async (tweet: any) => {
    const tweetDataP = await admin.firestore().collection('tweets').doc(tweet.id).get()
    if (tweetDataP.exists) {
      return
    }

    const author = authors[tweet.author_id]

    await admin.firestore().collection('tweets').doc(tweet.id).set({
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
      publishedAt: admin.firestore.Timestamp.fromDate(new Date(tweet.created_at)),
      createdAt: admin.firestore.FieldValue.serverTimestamp(),
      updatedAt: admin.firestore.FieldValue.serverTimestamp()
    })
    console.log(`saved: ${tweet.id}`)
  }

  res?.data && res.data.map(async (tweet: any) => {
    if (tweet.source === 'Nintendo Switch Share') {
      await saveTweet(tweet)
    }
  })
}

export const fetchTweets = functions.region('asia-northeast1').pubsub.schedule('every 5 minutes').onRun(async (context) => {
  functions.logger.info("start!", {structuredData: true})

  const date = new Date(context.timestamp)
  date.setMinutes(date.getMinutes() - 10)

  try {
    const res = await searchTweets(date)
    res && await saveTweets(res)
  } catch (e:any) {
    console.log('error!!!!')
    console.error(e)
  }

  functions.logger.info("end!", {structuredData: true})
})

export const onCreateLike = functions.region('asia-northeast1').firestore.document('users/{uid}/likes/{tweetId}').onCreate(async (_snapshot, context) => {
  functions.logger.info("start!", {structuredData: true})

  try {
    await admin.firestore().collection('tweets').doc(context.params.tweetId).update({
      likeCount: admin.firestore.FieldValue.increment(1),
      updatedAt: admin.firestore.FieldValue.serverTimestamp()
    })
  } catch (e:any) {
    console.log('error!!!!')
    console.error(e)
  }

  functions.logger.info("end!", {structuredData: true})
})

export const onDeleteLike = functions.region('asia-northeast1').firestore.document('users/{uid}/likes/{tweetId}').onDelete(async (_snapshot, context) => {
  functions.logger.info("start!", {structuredData: true})

  try {
    await admin.firestore().collection('tweets').doc(context.params.tweetId).update({
      likeCount: admin.firestore.FieldValue.increment(-1),
      updatedAt: admin.firestore.FieldValue.serverTimestamp()
    })
  } catch (e:any) {
    console.log('error!!!!')
    console.error(e)
  }

  functions.logger.info("end!", {structuredData: true})
})

// const tmpSearchTweets = async (ids: string[]) => {
//   const client = new Client(process.env.TWITTER_BEARER_TOKEN as string)
//   const res = await client.tweets.findTweetsById({
//     "ids": ids,
//     "tweet.fields": [
//       "source",
//       "public_metrics",
//       "created_at"
//     ],
//     "expansions": [
//       "author_id",
//       "attachments.media_keys"
//     ],
//     "media.fields": [
//       "variants",
//     ],
//     "user.fields": [
//       "profile_image_url"
//     ]
//   })

//   return res
// }

// const tmpSaveTweets = async (res: any) => {
//   const media_key2video: {[prop: string]: any} = {}
//   res?.includes?.media && res?.includes?.media.map((media: any) => {
//     if (media.media_key){
//       media_key2video[media.media_key] = media.variants.filter((variant:any) => 'bit_rate' in variant).sort((a: any, b: any) => b.bit_rate - a.bit_rate)[0].url
//     }
//   })

//   const authors: {[prop: string]: any} = {}
//   res?.includes?.users.map((author: any) => {
//     authors[author.id] = author
//   })

//   const tmpSaveTweet = async (tweet: any) => {
//     const tweetDataP = await admin.firestore().collection('tweets').doc(tweet.id).get()
//     if (!tweetDataP.exists) {
//       return
//     }

//     const tweetData = tweetDataP.data()

//     const author = authors[tweet.author_id]

//     // TODO: tweetDataを更新して保存する形式にする
//     await admin.firestore().collection('tweets').doc(tweet.id).set({
//       twitterUid: tweet.author_id,
//       text: tweet.text,
//       replyCount: tweet.public_metrics?.reply_count ?? 0,
//       twitterLikeCount: tweet.public_metrics?.like_count ?? 0,
//       retweetCount: tweet.public_metrics?.retweet_count ?? 0,
//       name: author?.name,
//       username: author?.username,
//       profileImageUrl: author?.profile_image_url,
//       url: `https://twitter.com/${author?.username}/status/${tweet.id}`,
//       video: tweet.attachments?.media_keys && media_key2video[tweet.attachments?.media_keys[0]],
//       likeCount: tweetData?.likeCount,
//       publishedAt: admin.firestore.Timestamp.fromDate(new Date(tweet.created_at)),
//       createdAt: tweetData?.createdAt,
//       updatedAt: admin.firestore.FieldValue.serverTimestamp()
//     })
//     console.log(`saved: ${tweet.id}`)
//   }

//   res?.data && res.data.map(async (tweet: any) => {
//     if (tweet.source === 'Nintendo Switch Share') {
//       await tmpSaveTweet(tweet)
//     }
//   })
// }

// export const tmpFetchTweets = functions.region('asia-northeast1').pubsub.schedule('every 2 minutes').onRun(async (context) => {
//   functions.logger.info("start!", {structuredData: true})

//   try {
//     const ids = ['']
//     const res = await tmpSearchTweets(ids)
//     res && await tmpSaveTweets(res)
//   } catch (e:any) {
//     console.log('error!!!!')
//     console.error(e)
//   }

//   functions.logger.info("end!", {structuredData: true})
// })
