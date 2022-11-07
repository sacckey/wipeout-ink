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

const saveTweet = async (tweet: any) => {
  const tweetData = await admin.firestore().collection('tweets').doc(tweet.id).get()
  if (tweetData.exists) {
    return
  }

  await admin.firestore().collection('tweets').doc(tweet.id).set({
    twitterUid: tweet.author_id,
    likeCount: 0,
    publishedAt: admin.firestore.Timestamp.fromDate(new Date(tweet.created_at)),
    createdAt: admin.firestore.FieldValue.serverTimestamp(),
    updatedAt: admin.firestore.FieldValue.serverTimestamp()
  })
  console.log(`saved: ${tweet.id}`)
}

export const fetchTweets = functions.region('asia-northeast1').pubsub.schedule('every 5 minutes').onRun(async (context) => {
  functions.logger.info("start!", {structuredData: true})

  const date = new Date(context.timestamp)
  date.setMinutes(date.getMinutes() - 10)

  try {
    const res = await searchTweets(date)

    res?.data && res.data.map(async (t) => {
      if (t.source === 'Nintendo Switch Share') {
        await saveTweet(t)
      }
    })
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
