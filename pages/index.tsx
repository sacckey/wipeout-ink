import Head from 'next/head'
import { db } from "@/lib/firebase"
import { collection, getDocs, limit, orderBy, query, QuerySnapshot, startAfter, where } from "firebase/firestore"
import Tweets from '@/components/Tweets'
import { useState } from 'react'
import InfiniteScroll from 'react-infinite-scroller'
import { admin } from '@/lib/firebaseAdmin'
import { TweetType, TweetWithMetaType } from '@/types/tweet'
import { tweetWithMeta2Tweet } from '@/lib/utils'

export default function Home({ tweets }: { tweets: TweetType[] }) {
  const [list, setList] = useState(tweets)
  const [hasMore, setHasMore] = useState(tweets.length > 0)

  const loadMore = async (_page: number) => {
    const lastTweetDate = list.at(-1)?.publishedAt

    if (!lastTweetDate) {
      setHasMore(false)
      return
    }

    const q = query(collection(db, "tweets"), where('active', '==', true), orderBy('publishedAt', 'desc'), startAfter(lastTweetDate), limit(30))
    const tweetSnapshots = await getDocs(q) as QuerySnapshot<TweetWithMetaType>
    const tweets = tweetSnapshots.docs.map(doc => tweetWithMeta2Tweet(doc.data()))

    if (tweets.length === 0) {
      setHasMore(false)
      return
    }

    setList((preList) => [...preList, ...tweets])
  }

  const loader =<div className="loader" key={0}>Loading ...</div>

  return (
    <div>
      <Head>
        <title>wipeout.ink</title>
        <meta property="og:image" content="ogp.png" />
      </Head>
      <InfiniteScroll loadMore={loadMore} hasMore={hasMore} loader={loader}>
        <Tweets tweets={list} />
     </InfiniteScroll>
    </div>
  )
}

export async function getStaticProps() {
  const tweetSnapshots = await admin.firestore().collection('tweets').where('active', '==', true).orderBy('publishedAt', 'desc').limit(30).get() as admin.firestore.QuerySnapshot<TweetWithMetaType>
  const tweets = tweetSnapshots.docs.map(doc => tweetWithMeta2Tweet(doc.data()))

  return {
    props: {
      tweets,
    },
    revalidate: 60 * 5
  }
}
