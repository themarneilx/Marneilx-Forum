export interface Post {
  id: string;
  content: string;
  authorName: string;
  authorId: string;
  createdAt: number; // Timestamp
  upvotes: string[];
  downvotes: string[];
  imageUrl?: string;
}

export interface Comment {
  id: string;
  content: string;
  authorId: string;
  authorName: string;
  authorAvatar?: string;
  createdAt: number;
}
