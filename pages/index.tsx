import Head from 'next/head'
import { fetchTweets } from 'lib/fetchTweets'
import { db } from "../lib/firebase"
import { collection, getDocs, limit, orderBy, query, startAfter, Timestamp } from "firebase/firestore"
import Tweets from '../components/Tweets'
import { useState } from 'react'
import InfiniteScroll from 'react-infinite-scroller'

export default function Home({ tweets }: any) {
  const [list, setList] = useState(tweets)
  const [hasMore, setHasMore] = useState(tweets.length > 0)

  const loadMore = async (page: any) => {
    const lastTweetDate = Timestamp.fromDate(new Date(list.at(-1).publishedAt))
    const q = query(collection(db, "tweets"), orderBy('publishedAt', 'desc'), startAfter(lastTweetDate), limit(30))
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
    <div>
      <Head>
        <title>wipeout.ink</title>
      </Head>
      <InfiniteScroll loadMore={loadMore} hasMore={hasMore} loader={loader}>
        <Tweets tweets={list} />
     </InfiniteScroll>
    </div>
  )
}

export async function getStaticProps() {
  const q = query(collection(db, "tweets"), orderBy('publishedAt', 'desc'), limit(30))
  const tweetSnapshots = await getDocs(q)
  const tweets = fetchTweets(tweetSnapshots)

  return {
    props: {
      tweets,
    },
    revalidate: 60 * 5
  }
}
