import { fetchTweets } from 'lib/fetchTweets'
import { db } from "../../lib/firebase"
import { collection, getDocs, limit, orderBy, query, startAfter, Timestamp, where } from "firebase/firestore"
import Tweets from '../../components/Tweets'
import { useState } from 'react'
import InfiniteScroll from 'react-infinite-scroller'

export default function UserPage({ tweets, twitterUid }: any) {
  const [list, setList] = useState(tweets)
  const [hasMore, setHasMore] = useState(tweets.length > 0)

  const loadMore = async (page: any) => {
    const lastTweetDate = Timestamp.fromDate(new Date(list.at(-1).publishedAt))
    const q = query(collection(db, "tweets"), where('twitterUid', '==', twitterUid), where('active', '==', true), orderBy('publishedAt', 'desc'), startAfter(lastTweetDate), limit(30))
    const tweetSnapshots = await getDocs(q)
    const tweets = fetchTweets(tweetSnapshots)

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

export const getStaticPaths = async () => {
  return {
    paths: [],
    fallback: 'blocking',
  }
}

export const getStaticProps = async (context: { params: { twitterUid: string } }) => {
  const { twitterUid } = context.params
  const q = query(collection(db, "tweets"), where('twitterUid', '==', twitterUid), where('active', '==', true), orderBy('publishedAt', 'desc'), limit(30))
  const tweetSnapshots = await getDocs(q)
  const tweets = fetchTweets(tweetSnapshots)

  return {
    props: {
      tweets,
      twitterUid
    },
    revalidate: 60 * 5
  }
}
