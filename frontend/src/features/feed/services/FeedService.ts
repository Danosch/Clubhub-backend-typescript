import { BaseService } from '../../../services/BaseService';
import type { Comment } from '../../clubs/types';

/** Post item appearing in the feed. */
export interface FeedPost {
  id: string;
  clubId: string;
  clubName: string;
  clubImage: string;
  author: string;
  authorAvatar?: string;
  content: string;
  likes: number;
  liked?: boolean;
  comments: number;
  time: string;
  picture?: string;
  commentsList?: Comment[];
}

/** Event item appearing in the feed stream. */
export interface FeedEventItem {
  type: 'event';
  [key: string]: any;
}

/** Union of all possible feed items. */
export type FeedItem = FeedPost | FeedEventItem;

export class FeedService extends BaseService {
  /**
   * Fetch a page of the global feed.
   * Accepts multiple possible backend payload shapes and normalizes to an array.
   */
  async getPage(offset = 0, limit = 10): Promise<FeedItem[]> {
    const res = await this.api.request<
      | FeedItem[]
      | { content?: FeedItem[] }
      | { posts?: any[]; events?: any[] }
    >(`/feed?offset=${offset}&limit=${limit}`);

    if (Array.isArray(res)) return res;

    if (res && Array.isArray((res as any).content)) {
      return (res as any).content;
    }

    const postsData = Array.isArray((res as any)?.posts) ? (res as any).posts : [];
    const eventsData = Array.isArray((res as any)?.events) ? (res as any).events : [];

    const posts: FeedPost[] = postsData.map((p: any) => ({
      id: p.id,
      clubId: p.club?.id ?? p.clubId ?? '',
      clubName: p.club?.name ?? '',
      clubImage: p.club?.image ?? '',
      author: p.author?.username ?? p.author ?? 'Unknown',
      authorAvatar: p.author?.avatar ?? '',
      content: p.content,
      likes: p.likes ?? 0,
      liked: p.liked ?? p.likedByUser ?? p.likedByMe ?? false,
      comments: p.comments ?? 0,
      time: p.time,
      picture: p.picture ?? p.photo,
      commentsList: (p.commentsList ?? []).map((c: any) => ({
        id: c.id,
        author: {
          id: c.author?.id ?? c.authorId ?? c.userId ?? '',
          username: c.author?.username ?? c.author ?? 'Unknown',
          avatar: c.author?.avatar ?? c.avatar ?? '',
        },
        content: c.content ?? '',
        time: c.time ?? c.createdAt ?? '',
        likes: c.likes ?? 0,
        liked: c.liked ?? c.likedByUser ?? c.likedByMe ?? false,
      })),
    }));

    const events: FeedEventItem[] = eventsData.map((e: any) => ({
      type: 'event',
      id: e.id,
      clubId: e.clubId ?? e.club?.id ?? '',
      clubName: e.club?.name ?? '',
      // Prefer avatar, fallback to image if provided
      clubImage: e.club?.avatar ?? e.club?.image ?? '',
      isJoinedClub: e.club?.isJoined ?? false,
      title: e.title,
      date: e.date,
      time: e.time,
      location: e.location,
      description: e.description,
      joinedCount: e.attendeesCount ?? e.attendees?.length ?? e.joinedCount ?? 0,
      attendees: (e.attendees ?? []).map((a: any) => ({
        id: a.id ?? a.userId ?? '',
        name: a.name ?? a.username ?? '',
        surname: a.surname ?? '',
        email: a.email ?? '',
        avatar: a.avatar ?? '',
      })),
    }));

    // Even if both posts and events arrays are empty we should return an empty array
    // rather than throwing an error. An empty feed is a valid state (e.g. a user
    // that hasn't joined any clubs yet). Throwing an error causes the caller to
    // repeatedly retry the request, resulting in an infinite fetch loop.
    return [...posts, ...events];
  }

  /** Create a new post in the feed. */
  async addPost(post: Omit<FeedPost, 'id'>): Promise<FeedPost> {
    const payload = this.buildPayload(post);
    return this.api.request<FeedPost>('/feed', {
      method: 'POST',
      body: JSON.stringify(payload),
    });
  }

  /** Add a comment to a feed post. */
  async addComment(postId: string, comment: Omit<Comment, 'id'>) {
    return this.api.request<Comment>(`/feed/${postId}/comments`, {
      method: 'POST',
      body: JSON.stringify(comment),
    });
  }
}

export const feedService = new FeedService();
