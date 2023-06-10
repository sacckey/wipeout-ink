import Tweets from '@/components/Tweets'
import { useEffect, useState } from 'react'
import { useAuthContext } from '@/contexts/AuthContext'
import { collection, documentId, getDocs, limit, query, QuerySnapshot, where } from 'firebase/firestore'
import { db } from '@/lib/firebase'
import InfiniteScroll from 'react-infinite-scroller'
import { TweetType, TweetWithMetaType } from '@/types/tweet'
import { tweetWithMeta2Tweet } from '@/lib/utils'

export default function Likes() {
  const { likeTweetIds } = useAuthContext()
  const [list, setList] = useState<TweetType[]>([])
  const [hasMore, setHasMore] = useState(false)

  useEffect(() => {
    const getTweets = async () => {
      if (likeTweetIds && likeTweetIds.length > 0) {
        const tweetIds = likeTweetIds.slice(0,10)
        const q = query(collection(db, 'tweets'), where(documentId(), 'in', tweetIds), limit(10))
        const tweetSnapshots = await getDocs(q) as QuerySnapshot<TweetWithMetaType>
        const tweets = tweetSnapshots.docs.map(doc => tweetWithMeta2Tweet(doc.data()))
        tweets.sort((a, b) => tweetIds.indexOf(a.id) - tweetIds.indexOf(b.id))

        setList(tweets)
        setHasMore(tweets.length > 0)
      }
    }
    getTweets()
  }, [likeTweetIds])

  const loadMore = async (page: number) => {
    if (!likeTweetIds) {
      return
    }

    const tweetIds = likeTweetIds.slice(page*10, page*10+10)
    if (tweetIds.length === 0) {
      setHasMore(false)
      return
    }

    const q = query(collection(db, 'tweets'), where(documentId(), 'in', tweetIds), limit(10))
    const tweetSnapshots = await getDocs(q) as QuerySnapshot<TweetWithMetaType>
    const tweets = tweetSnapshots.docs.map(doc => tweetWithMeta2Tweet(doc.data()))
    tweets.sort((a, b) => tweetIds.indexOf(a.id) - tweetIds.indexOf(b.id))

    if (tweets.length === 0) {
      setHasMore(false)
      return
    }

    setList((preList) => [...preList, ...tweets])
  }

  const loader =<div className="loader" key={0}>Loading ...</div>

  return (
    <div>
      <h1 className='font-quicksand text-3xl text-center'>Likes</h1>
      <InfiniteScroll loadMore={loadMore} hasMore={hasMore} loader={loader}>
        <Tweets tweets={list} />
      </InfiniteScroll>
    </div>
  )
}
