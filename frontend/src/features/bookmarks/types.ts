/** Minimal view model for a bookmarked post. */
export interface BookmarkedPost {
  id: string;
  author: string;
  authorAvatar?: string;
  content: string;
  time: string;
  likes: number;
  comments: number;
  clubId?: string;
  clubName?: string;
  clubImage?: string;
  picture?: string;
  liked?: boolean;
}
