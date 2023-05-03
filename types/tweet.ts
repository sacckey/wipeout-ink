import { Timestamp } from "firebase/firestore"

export type TweetType = {
  id: string
  text: string
  replyCount: number
  twitterLikeCount: number
  retweetCount: number
  name: string
  username: string
  profileImageUrl: string
  url: string
  video: string
  twitterUid: string
  likeCount: number
  publishedAt: number
}

export type TweetWithMetaType = TweetType & {
  active: boolean
  createdAt: Timestamp,
  updatedAt: Timestamp
}
