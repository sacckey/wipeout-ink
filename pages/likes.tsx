import Tweets from '../components/Tweets'
import { useEffect, useState } from 'react'
import { useAuthContext } from '../contexts/AuthContext'
import { collection, documentId, getDocs, limit, query, where } from "firebase/firestore"
import { fetchTweets } from 'lib/fetchTweets'
import { db } from "../lib/firebase"

export default function Likes() {
  const { user, signInChecking, likeTweetIds } = useAuthContext()
  const isLoggedIn = !!user
  const isLoading = !!signInChecking
  const [tweets, setTweets] = useState<any>([])

  useEffect(() => {
    const getTweets = async () => {
      if (!isLoading && user && likeTweetIds) {
        const tweetIds = likeTweetIds.slice(0,10)
        const q = query(collection(db, "tweets"), where(documentId(), 'in', tweetIds), limit(10))
        const tweetSnapshots = await getDocs(q)
        const tweets = fetchTweets(tweetSnapshots)
        tweets.sort((a:any, b:any) => tweetIds.indexOf(a.id) - tweetIds.indexOf(b.id))

        setTweets(tweets)
      }
    }
    getTweets()
  }, [isLoading])

  return (
    <Tweets tweets={tweets} />
  )
}
