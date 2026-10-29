export interface IPost {
  _id: string;
  id?: string;
  body?: string;
  image?: string;
  privacy: string;
  user: IUser;
  isShare: boolean;
  sharedPost: IPost | null;
  likes: string[];
  likesCount: number;
  commentsCount: number;
  sharesCount: number;
  topComment: any | null;
  createdAt: string;
  bookmarked?: boolean;
}

export interface IUser {
  _id: string;
  name: string;
  username: string;
  photo: string;
}

export interface SharedPost {
  _id: string;
  image: string;
  privacy: string;
  user: User2;
  sharedPost: any;
  likes: string[];
  createdAt: string;
  commentsCount: number;
  topComment: TopComment;
  sharesCount: number;
  likesCount: number;
  isShare: boolean;
  id: string;
}

export interface User2 {
  _id: string;
  name: string;
  username: string;
  photo: string;
}

export interface TopComment {
  _id: string;
  content: string;
  commentCreator: CommentCreator;
  post: string;
  parentComment: any;
  likes: any[];
  createdAt: string;
}

export interface CommentCreator {
  _id: string;
  name: string;
  username: string;
  photo: string;
}
