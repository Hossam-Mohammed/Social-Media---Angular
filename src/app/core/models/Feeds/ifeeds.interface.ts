export type FeedFilter = 'feed' | 'my-posts' | 'community' | 'saved';

export interface PostUser {
  _id: string;
  name: string;
  username: string;
  photo?: string;
}

export interface PostComment {
  _id: string;
  content: string;
  commentCreator: PostUser;
  createdAt: string;
}

export interface Post {
  _id: string;
  body?: string;
  image?: string;
  privacy: string;
  user: PostUser;
  sharedPost: Post | null;
  likes: string[]; // ids of the users who liked it
  likesCount: number;
  commentsCount: number;
  sharesCount: number;
  topComment: PostComment | null;
  isShare: boolean;
  bookmarked: boolean;
  createdAt: string;
}

// ⚠️ The wrapper is assumed to match notifications: { data: { posts: [...] }, meta: { pagination } }
export interface PostsResponse {
  success: boolean;
  message: string;
  data: { posts: Post[] } | Post[];
  meta?: { pagination?: { currentPage: number; numberOfPages: number } };
}
