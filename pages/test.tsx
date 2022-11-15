import Head from 'next/head'
import { fetchTweets } from 'lib/fetchTweets'
import { db } from "../lib/firebase"
import { collection, getDocs, limit, orderBy, query, startAfter } from "firebase/firestore"
import Tweets from '../components/Tweets'
import InfiniteScroll from 'react-infinite-scroller'
import { useState } from 'react'

export default function Home({ tweets }: any) {
  //表示するデータ
  const [list, setList] = useState(tweets)

  //項目を読み込むときのコールバック
  const loadMore = async (page: any) => {
    const q = query(collection(db, "tweets"), orderBy('publishedAt', 'desc'), startAfter(list.at(-1)), limit(10))
    const tweetSnapshots = await getDocs(q)
    const tweets = await fetchTweets(tweetSnapshots)
    tweets && setList((preList: any) => [...preList, ...tweets])
  }

  //各スクロール要素
  // const items = (
  //   <ul>
  //     {list.map((value) => <li>{value}</li>)}
  //   </ul>
  // )

  //全体のスタイル
  // const root_style = {
  //   marginLeft : "50px",
  //   marginTop : "50px",
  // }

  //ロード中に表示する項目
  const loader =<div className="loader" key={0}>Loading ...</div>

  return (
    <div>
      <Head>
        <title>wipeout.ink</title>
      </Head>
      <InfiniteScroll
        loadMore={loadMore}    //項目を読み込む際に処理するコールバック関数
        hasMore={true}         //読み込みを行うかどうかの判定
        loader={loader}>      {/* 読み込み最中に表示する項目 */}

        <Tweets tweets={tweets} />
     </InfiniteScroll>
    </div>
  //   <div style={root_style}>
  //   <InfiniteScroll
  //     loadMore={loadMore}    //項目を読み込む際に処理するコールバック関数
  //     hasMore={true}         //読み込みを行うかどうかの判定
  //     loader={loader}>      {/* 読み込み最中に表示する項目 */}

  //       {items}             {/* 無限スクロールで表示する項目 */}
  //   </InfiniteScroll>
  // </div>
  )
}

export async function getStaticProps() {
  const q = query(collection(db, "tweets"), orderBy('publishedAt', 'desc'), limit(10))
  const tweetSnapshots = await getDocs(q)
  const tweets = await fetchTweets(tweetSnapshots)

  return {
    props: {
      tweets,
    },
    revalidate: 60 * 5
  }
}
