import { admin } from './firebaseAdmin'
import * as functions from "firebase-functions"
import { searchRecentTweets, createTweets, searchTweetsById, updateTweets } from './twitter'

export const fetchTweets = functions.region('asia-northeast1').pubsub.schedule('every 5 minutes').onRun(async () => {
  functions.logger.info("start!")

  try {
    const tweets = await searchRecentTweets()
    await createTweets(tweets)
  } catch (e) {
    functions.logger.info("error!")
    functions.logger.error(e)
  }

  functions.logger.info("end!")
})

export const refetchTweets = functions.region('asia-northeast1').pubsub.schedule('0 4 * * *').timeZone('Asia/Tokyo').onRun(async () => {
  functions.logger.info("start!")

  try {
    const tweetSnapshots = await admin.firestore().collection('tweets').where('active', '==', true).orderBy('publishedAt', 'desc').limit(1000).get()

    const tweetIdsSet: string[][] = []
    const tweetIds: string[] = []
    tweetSnapshots.docs.forEach((doc) => {
      tweetIds.push(doc.id)

      if (tweetIds.length === 100) {
        tweetIdsSet.push([...tweetIds])
        tweetIds.length = 0
      }
    })
    tweetIdsSet.push([...tweetIds])

    await Promise.all(tweetIdsSet.map(async (ids) => {
      const tweets = await searchTweetsById(ids)
      await updateTweets(tweets)
    }))
  } catch (e) {
    functions.logger.info("error!")
    functions.logger.error(e)
  }

  functions.logger.info("end!")
})

export const onCreateLike = functions.region('asia-northeast1').firestore.document('users/{uid}/likes/{tweetId}').onCreate(async (_snapshot, context) => {
  functions.logger.info("start!")

  try {
    await admin.firestore().collection('tweets').doc(context.params.tweetId).update({
      likeCount: admin.firestore.FieldValue.increment(1),
      updatedAt: admin.firestore.FieldValue.serverTimestamp()
    })
  } catch (e) {
    functions.logger.info("error!")
    functions.logger.error(e)
  }

  functions.logger.info("end!")
})

export const onDeleteLike = functions.region('asia-northeast1').firestore.document('users/{uid}/likes/{tweetId}').onDelete(async (_snapshot, context) => {
  functions.logger.info("start!")

  try {
    await admin.firestore().collection('tweets').doc(context.params.tweetId).update({
      likeCount: admin.firestore.FieldValue.increment(-1),
      updatedAt: admin.firestore.FieldValue.serverTimestamp()
    })
  } catch (e) {
    functions.logger.info("error!")
    functions.logger.error(e)
  }

  functions.logger.info("end!")
})

export const saveSampleTweets = functions.region('asia-northeast1').https.onCall(async () => {
  if (process.env.FIREBASE_DEBUG_MODE === 'false') {
    return
  }

  const publishedAt = (new Date()).getTime() - 3600 * 1000
  for (let i = 0; i < 40; i++) {
    await admin.firestore().collection('tweets').doc(`sample_${i}`).set({
      id: `sample_${i}`,
      text: `sample_${i}`,
      replyCount: 0,
      twitterLikeCount: 0,
      retweetCount: 0,
      name: 'name',
      username: 'username',
      profileImageUrl: 'https://pbs.twimg.com/profile_images/1066244463725445120/m-owVBJX_normal.jpg',
      url: 'https://twitter.com/sacckey/status/1591004599854714880',
      video: 'https://video.twimg.com/ext_tw_video/1591004490899288065/pu/vid/1280x720/5v5fBoq-9tFUXVKo.mp4?tag=12',
      twitterUid: 'twitterUid',
      likeCount: 0,
      active: true,
      publishedAt: publishedAt + i * 1000,
      createdAt: admin.firestore.FieldValue.serverTimestamp(),
      updatedAt: admin.firestore.FieldValue.serverTimestamp()
    })
  }
})

// adhoc
// const tweetSnapshots = await admin.firestore().collection('tweets').limit(1000).get()
// tweetSnapshots.docs.map(async (doc) => {
//   const tweet = doc.data()

//   await admin.firestore().collection('tweets').doc(doc.id).update({
//     publishedAt: tweet.publishedAt.toDate().getTime()
//   })
// })
