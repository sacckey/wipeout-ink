import * as admin from 'firebase-admin'
import * as functions from "firebase-functions"
import { Client } from "twitter-api-sdk"

admin.initializeApp()

const searchTweets = async (startTime: Date) => {
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
      active: true,
      publishedAt: admin.firestore.Timestamp.fromDate(new Date(tweet.created_at)),
      createdAt: admin.firestore.FieldValue.serverTimestamp(),
      updatedAt: admin.firestore.FieldValue.serverTimestamp()
    })
    console.log(`saved: ${tweet.id}`)
  }

  res?.data && res.data.map(async (tweet: any) => {
    // if (tweet.source === 'Nintendo Switch Share') {
      await saveTweet(tweet)
    // }
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

const deleteTweet = async (targetTweet: any) => {
  const likes = await admin.firestore().collectionGroup('likes').where('tweet.ref', '==', targetTweet.ref).get()
  likes.docs.map(async (doc: any) => {
    console.log('delete!!!!!!!!')
    functions.logger.info(doc, {structuredData: true})
    await doc.ref.delete()
  })
}


const updateAndDelete = async (targetTweets: any) => {
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
      await deleteTweet(targetTweet)
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

export const updateTweets = functions.region('asia-northeast1').pubsub.schedule('0 4 * * *').timeZone('Asia/Tokyo').onRun(async (context) => {
  functions.logger.info("start!", {structuredData: true})

  try {
    const tweetSnapshots = await admin.firestore().collection('tweets').where('active', '==', true).orderBy('publishedAt', 'desc').limit(1000).get()

    let targetTweets:any[] = []
    tweetSnapshots.docs.map(async (doc: any) => {
      targetTweets.push(doc)

      if(targetTweets.length === 100) {
        await updateAndDelete(targetTweets)
        targetTweets = []
      }
    })
    await updateAndDelete(targetTweets)

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


export const saveTestTweets = functions.region('asia-northeast1').https.onCall(async () => {
  if (process.env.FIREBASE_DEBUG_MODE === 'false') {
    return
  }

  const publishedAt = new Date()
  publishedAt.setHours(publishedAt.getHours() - 1)

  for (let i = 0; i < 40; i++) {
    const tweetDataP = await admin.firestore().collection('tweets').doc(`test_${i}`).get()
    if (tweetDataP.exists) {
      continue
    }

    publishedAt.setMinutes(publishedAt.getMinutes() + 1)
    await admin.firestore().collection('tweets').doc(`test_${i}`).set({
      text: `test_${i}`,
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
      publishedAt,
      createdAt: admin.firestore.FieldValue.serverTimestamp(),
      updatedAt: admin.firestore.FieldValue.serverTimestamp()
    })
  }
})
