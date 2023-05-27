import { TweetType, TweetWithMetaType } from '@/types/tweet'

export const tweetWithMeta2Tweet = (tweetWithMeta: TweetWithMetaType): TweetType => {
  return {
    id: tweetWithMeta.id,
    text: tweetWithMeta.text,
    replyCount: tweetWithMeta.replyCount,
    twitterLikeCount: tweetWithMeta.twitterLikeCount,
    retweetCount: tweetWithMeta.retweetCount,
    name: tweetWithMeta.name,
    username: tweetWithMeta.username,
    profileImageUrl: tweetWithMeta.profileImageUrl,
    url: tweetWithMeta.url,
    video: tweetWithMeta.video,
    twitterUid: tweetWithMeta.twitterUid,
    likeCount: tweetWithMeta.likeCount,
    publishedAt: tweetWithMeta.publishedAt
  }
}

export const formatMetric = (number: number) => {
  if (number < 1000) {
    return `${number}`
  }
  if (number < 1000000) {
    return `${(number / 1000).toFixed(1)}K`
  }
  return `${(number / 1000000).toFixed(1)}M`
}
