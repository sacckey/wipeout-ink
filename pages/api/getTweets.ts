import type { NextApiRequest, NextApiResponse } from 'next'
import admin from 'firebase-admin'
import { fetchTweets } from '../../lib/fetchTweets'

if (admin.apps.length === 0) {
  admin.initializeApp({
    credential: admin.credential.cert({
      projectId: process.env.NEXT_PUBLIC_FIREBASE_PROJECT_ID,
      clientEmail: process.env.FIREBASE_CLIENT_EMAIL,
      privateKey: process.env.FIREBASE_PRIVATE_KEY
      ? process.env.FIREBASE_PRIVATE_KEY.replace(/\\n/gm, "\n")
      : undefined
    })
  })
}

const handler = async (req: NextApiRequest, res: NextApiResponse) => {
  try {
    if (req.method !== 'GET' || !req.query['tweetIds[]']) {
      res.status(404).json({ error: 'Not Found' })
      return
    }

    const token = req.headers.authorization?.split('Bearer ')[1]!
    await admin.auth().verifyIdToken(token)

    const tweetIds = [req.query['tweetIds[]']].flat(1)
    if (tweetIds.length > 10) {
      res.status(500).json({ error: 'tweetIds Length Exceeds Limit' })
      return
    }

    const tweetSnapshots = await admin.firestore().collection('tweets').where(admin.firestore.FieldPath.documentId(), 'in', tweetIds).get()
    const tweets = await fetchTweets(tweetSnapshots)
    const sortedTweets: any[] = []
    tweetIds.forEach((tweetId) => {
      tweets?.forEach((tweet)=>{
        if(tweet.id===tweetId) {
          sortedTweets.push(tweet)
        }
      })
    })

    return res.status(200).json({ tweets: sortedTweets })
  } catch (e) {
    console.error(e)
    return res.status(500).json({ error: 'Unexpected error.' })
  }
}

export default handler
