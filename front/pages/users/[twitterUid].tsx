import { db } from '@/lib/firebase'
import { collection, getDocs, limit, orderBy, query, QuerySnapshot, startAfter, where } from 'firebase/firestore'
import Tweets from '@/components/Tweets'
import { useState } from 'react'
import InfiniteScroll from 'react-infinite-scroller'
import { admin } from '@/lib/firebaseAdmin'
import { TweetType, TweetWithMetaType } from '@/types/tweet'
import { tweetWithMeta2Tweet } from '@/lib/utils'

export default function UserPage({ tweets, twitterUid }: { tweets: TweetType[], twitterUid: string }) {
  const [list, setList] = useState(tweets)
  const [hasMore, setHasMore] = useState(tweets.length > 0)
  const userName = tweets[0]?.username ?? ''

  const loadMore = async () => {
    const lastTweetDate = list.at(-1)?.publishedAt

    if (!lastTweetDate) {
      setHasMore(false)
      return
    }

    const q = query(collection(db, 'tweets'), where('twitterUid', '==', twitterUid), where('active', '==', true), orderBy('publishedAt', 'desc'), startAfter(lastTweetDate), limit(30))
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
      <h1 className='font-quicksand text-3xl text-center'>{userName}'s wipeouts</h1>
      <InfiniteScroll loadMore={loadMore} hasMore={hasMore} loader={loader}>
        <Tweets tweets={list} />
      </InfiniteScroll>
    </div>
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
  const tweetSnapshots = await admin.firestore().collection('tweets').where('twitterUid', '==', twitterUid).where('active', '==', true).orderBy('publishedAt', 'desc').limit(30).get() as admin.firestore.QuerySnapshot<TweetWithMetaType>
  const tweets = tweetSnapshots.docs.map(doc => tweetWithMeta2Tweet(doc.data()))

  return {
    props: {
      tweets,
      twitterUid
    },
    revalidate: 60 * 5
  }
}
