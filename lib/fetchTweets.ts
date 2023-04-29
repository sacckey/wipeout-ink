export const fetchTweets = (tweetSnapshots: any) => {
  if (tweetSnapshots.empty) {
    return []
  }

  const tweets = tweetSnapshots.docs.map((doc: any) => {
    const tweet = doc.data()

    return {
      id: doc.id,
      text: tweet.text,
      replyCount: formatMetric(tweet.replyCount),
      twitterLikeCount: formatMetric(tweet.twitterLikeCount),
      retweetCount: formatMetric(tweet.retweetCount),
      name: tweet.name,
      username: tweet.username,
      profileImageUrl: tweet.profileImageUrl,
      url: tweet.url,
      video: tweet.video,
      twitterUid: tweet.twitterUid,
      likeCount: tweet.likeCount,
      publishedAt: tweet.publishedAt
    }
  })

  return tweets
}

export const formatMetric = (number: number) => {
  if (number < 1000) {
    return number
  }
  if (number < 1000000) {
    return `${(number / 1000).toFixed(1)}K`
  }
  return `${(number / 1000000).toFixed(1)}M`
}
