import { TweetType, TweetWithMetaType } from "@/types/tweet"

export const tweetWithMeta2Tweet = (tweetWithMeta: TweetWithMetaType): TweetType => {
  return (({ active, createdAt, updatedAt, ...rest }) => rest)(tweetWithMeta)
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
