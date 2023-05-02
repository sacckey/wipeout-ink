import Tweets from '@/components/Tweets'
import { useEffect, useState } from 'react'
import { useAuthContext } from '@/contexts/AuthContext'
import { collection, documentId, getDocs, limit, query, where } from "firebase/firestore"
import { fetchTweets } from '@/lib/fetchTweets'
import { db } from "@/lib/firebase"
import InfiniteScroll from 'react-infinite-scroller'

export default function Likes() {
  const { user, signInChecking, likeTweetIds } = useAuthContext()
  const isLoggedIn = !!user
  const isLoading = !!signInChecking
  const [list, setList] = useState<any>([])
  const [hasMore, setHasMore] = useState(false)

  useEffect(() => {
    const getTweets = async () => {
      if (!isLoading && user && likeTweetIds && likeTweetIds.length > 0) {
        const tweetIds = likeTweetIds.slice(0,10)
        const q = query(collection(db, "tweets"), where(documentId(), 'in', tweetIds), limit(10))
        const tweetSnapshots = await getDocs(q)
        const tweets = fetchTweets(tweetSnapshots)
        tweets.sort((a:any, b:any) => tweetIds.indexOf(a.id) - tweetIds.indexOf(b.id))

        setList(tweets)
        setHasMore(tweets.length > 0)
      }
    }
    getTweets()
  }, [isLoading])

  const loadMore = async (page: any) => {
    if (!likeTweetIds) {
      return
    }

    const tweetIds = likeTweetIds.slice(page*10, page*10+10)
    if (tweetIds.length === 0) {
      setHasMore(false)
      return
    }

    const q = query(collection(db, "tweets"), where(documentId(), 'in', tweetIds), limit(10))
    const tweetSnapshots = await getDocs(q)
    const tweets = fetchTweets(tweetSnapshots)
    tweets.sort((a:any, b:any) => tweetIds.indexOf(a.id) - tweetIds.indexOf(b.id))

    if (tweets.length === 0) {
      setHasMore(false)
      return
    }

    setList((preList: any) => [...preList, ...tweets])
  }

  const loader =<div className="loader" key={0}>Loading ...</div>

  return (
    <InfiniteScroll loadMore={loadMore} hasMore={hasMore} loader={loader}>
      <Tweets tweets={list} />
    </InfiniteScroll>
  )
}
