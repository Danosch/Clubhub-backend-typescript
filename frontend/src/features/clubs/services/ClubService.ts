import { BaseService } from '../../../services/BaseService';
import type { Club, Event as ClubEvent, Post, Comment, Role } from '../types';
import { Subject, Preference } from '../../profile/types';
import { mapClub, mapEvent, mapPost, mapComment, mapThread } from '../mappers';

/** Query parameters used to search/filter clubs. */
export interface ClubSearchParams {
  page?: number;
  size?: number;
  name?: string;
  category?: string;
  interest?: Preference;
  minMembers?: number;
  maxMembers?: number;
}

/** Service for all club-related operations (CRUD, posts, events, members). */
export class ClubService extends BaseService {
  /** List clubs with optional filters/pagination. */
  async getAll(params: ClubSearchParams = {}): Promise<{ clubs: Club[]; totalPages: number }> {
    const search = new URLSearchParams();
    if (params.page !== undefined) search.set('page', String(params.page));
    if (params.size !== undefined) search.set('size', String(params.size));
    if (params.name) search.set('name', params.name);
    if (params.category) search.set('category', params.category);
    if (params.interest && params.interest !== Preference.NONE)
      search.set('interest', params.interest);
    if (params.minMembers !== undefined) search.set('minMembers', String(params.minMembers));
    if (params.maxMembers !== undefined) search.set('maxMembers', String(params.maxMembers));

    const query = search.toString();
    const dto = await this.api.request<any>(`/clubs${query ? `?${query}` : ''}`); // public in docs
    // Support multiple backend response shapes:
    // 1) Array<ClubDto>
    // 2) { content: ClubDto[], totalPages: number }
    // 3) { clubs: ClubDto[], totalCount: number }
    let content: any[] = [];
    let totalPages = 1;
    if (Array.isArray(dto)) {
      content = dto;
      totalPages = 1;
    } else if (dto && Array.isArray(dto.content)) {
      content = dto.content;
      totalPages = typeof dto.totalPages === 'number' ? dto.totalPages : 1;
    } else if (dto && Array.isArray(dto.clubs)) {
      content = dto.clubs;
      const totalCount = typeof dto.totalCount === 'number' ? dto.totalCount : undefined;
      if (typeof totalCount === 'number' && typeof params.size === 'number' && params.size > 0) {
        totalPages = Math.ceil(totalCount / params.size);
      } else if (typeof totalCount === 'number' && totalCount === 0) {
        totalPages = 0;
      } else {
        totalPages = 1;
      }
    }
    return { clubs: content.map(mapClub), totalPages };
  }

  /** Fetch a single club by ID. */
  async getById(id: string): Promise<Club | undefined> {
    const dto = await this.api.request<any>(`/clubs/${id}`);
    return mapClub(dto);
  }

  // Forum threads inside a club
  /** List a page of forum threads for a club. */
  async listThreadsPage(clubId: string, offset = 0, limit = 10) {
    const params = new URLSearchParams();
    params.set('offset', String(offset));
    params.set('limit', String(limit));
    const query = params.toString();
    const arr = await this.api.request<any[]>(`/clubs/${clubId}/threads${query ? `?${query}` : ''}`);
    return arr.map(mapThread);
  }

  /** Create a new thread in a club (members only). */
  async createThread(clubId: string, title: string, content: string) {
    const dto = await this.api.request<any>(`/clubs/${clubId}/threads`, {
      method: 'POST',
      body: JSON.stringify({ title, content }),
    });
    return mapThread(dto);
  }

  /** Fetch a single thread by id. */
  async getThread(threadId: string | number) {
    const dto = await this.api.request<any>(`/threads/${threadId}`);
    return mapThread(dto);
  }

  // Voting on threads
  /** Upvote a thread. */
  async upvoteThread(threadId: string | number): Promise<void> {
    await this.api.request<void>(`/threads/${threadId}/upvote`, { method: 'POST' });
  }

  /** Remove upvote from a thread. */
  async removeUpvoteThread(threadId: string | number): Promise<void> {
    await this.api.request<void>(`/threads/${threadId}/upvote`, { method: 'DELETE' });
  }

  /** Downvote a thread. */
  async downvoteThread(threadId: string | number): Promise<void> {
    await this.api.request<void>(`/threads/${threadId}/downvote`, { method: 'POST' });
  }

  /** Remove downvote from a thread. */
  async removeDownvoteThread(threadId: string | number): Promise<void> {
    await this.api.request<void>(`/threads/${threadId}/downvote`, { method: 'DELETE' });
  }

  /**
   * List a page of replies for a thread using offset/limit pagination.
   * Backend endpoint: GET /api/threads/{threadId}/replies?offset=0&limit=10
   */
  async listThreadComments(threadId: string | number, offset = 0, limit = 10) {
    const params = new URLSearchParams();
    if (typeof offset === 'number') params.set('offset', String(offset));
    if (typeof limit === 'number') params.set('limit', String(limit));
    const query = params.toString();
    const arr = await this.api.request<any[]>(`/threads/${threadId}/replies${query ? `?${query}` : ''}`);
    return arr.map(mapComment);
  }

  /** Add reply to a thread. */
  async addThreadComment(threadId: string | number, content: string) {
    const dto = await this.api.request<any>(`/threads/${threadId}/replies`, {
      method: 'POST',
      body: JSON.stringify({ content }),
    });
    return mapComment(dto);
  }

  /** Create a new club. */
  async createClub(data: Partial<Club>): Promise<Club> {
    // backend expects: { name, description, category, subject, interest }
    const payload = this.buildPayload({
      name: data.name,
      description: data.description,
      category: data.category,
      subject: data.subject ?? Subject.NONE,
      interest: data.interest ?? Preference.NONE,
    });
    const dto = await this.api.request<any>('/clubs', {
      method: 'POST',
      body: JSON.stringify(payload),
    });
    return mapClub(dto);
  }

  /** Update an existing club by ID. */
  async updateClub(id: string, data: Partial<Club>): Promise<Club> {
    const payload: any = {};
    if (data.name !== undefined) payload.name = data.name;
    if (data.description !== undefined) payload.description = data.description;
    if (data.category !== undefined) payload.category = data.category;
    if (data.subject !== undefined) payload.subject = data.subject;
    if (data.interest !== undefined) payload.interest = data.interest;

    const dto = await this.api.request<any>(`/clubs/${id}`, {
      method: 'PUT',
      body: JSON.stringify(payload),
    });
    return mapClub(dto);
  }

  /** Delete a club by ID. */
  async deleteClub(id: string): Promise<void> {
    await this.api.request<void>(`/clubs/${id}`, { method: 'DELETE' });
  }

  /** Join a club by ID. */
  async joinClub(id: string): Promise<void> {
    await this.api.request<void>(`/clubs/${id}/join`, { method: 'POST' });
  }

  /** Leave a club by ID. */
  async leaveClub(id: string): Promise<void> {
    await this.api.request<void>(`/clubs/${id}/leave`, { method: 'POST' });
  }

  /** Upload or replace a club avatar image. */
  async updateAvatar(id: string, file: Blob): Promise<Club> {
    const dto = await this.api.request<any>(`/clubs/${id}/avatar`, {
      method: 'PUT',
      headers: { 'Content-Type': 'application/octet-stream' },
      body: file,
    });
    return mapClub(dto);
  }

  // Posts inside a club
  /** List all posts for a club, newest first. */
  async listPosts(clubId: string): Promise<Post[]> {
    const arr = await this.api.request<any[]>(`/clubs/${clubId}/posts`);
    return arr
      .map(mapPost)
      .sort((a, b) => new Date(b.time).getTime() - new Date(a.time).getTime());
  }

  /**
   * List a page of posts for a club using offset/limit pagination.
   * Backend endpoint: GET /api/clubs/{clubId}/posts?offset=0&limit=10
   */
  async listPostsPage(clubId: string, offset = 0, limit = 10): Promise<Post[]> {
    const params = new URLSearchParams();
    if (typeof offset === 'number') params.set('offset', String(offset));
    if (typeof limit === 'number') params.set('limit', String(limit));
    const query = params.toString();
    const arr = await this.api.request<any[]>(`/clubs/${clubId}/posts${query ? `?${query}` : ''}`);
    return arr.map(mapPost);
  }

  /**
   * Create a new post inside a club.
   * Sends JSON when `picture` is not provided; otherwise uses multipart form.
   */
  async createPost(clubId: string, content: string, picture?: File | Blob): Promise<Post> {
    let dto: any;
    if (picture) {
      const form = new FormData();
      form.append('content', content);
      form.append('picture', picture);
      dto = await this.api.request<any>(`/clubs/${clubId}/posts`, {
        method: 'POST',
        body: form,
        // Do NOT set Content-Type for FormData; browser adds boundary automatically
        headers: {},
      });
    } else {
      dto = await this.api.request<any>(`/clubs/${clubId}/posts`, {
        method: 'POST',
        body: JSON.stringify({ content }),
      });
    }
    return mapPost(dto);
  }

  /** Fetch a single post by ID. */
  async getPost(postId: string): Promise<Post> {
    const dto = await this.api.request<any>(`/posts/${postId}`);
    return mapPost(dto);
  }

  /** Update a club post content by IDs. */
  async updatePost(clubId: string, postId: string, content: string): Promise<Post> {
    const dto = await this.api.request<any>(`/clubs/${clubId}/posts/${postId}`, {
      method: 'PUT',
      body: JSON.stringify({ content }),
    });
    return mapPost(dto);
  }

  /** Delete a club post by IDs. */
  async deletePost(clubId: string, postId: string): Promise<void> {
    await this.api.request<void>(`/clubs/${clubId}/posts/${postId}`, { method: 'DELETE' });
  }

  /**
   * Replace/update a post picture by post ID.
   * Backend endpoint: PUT /api/posts/{postId}/picture
   */
  async updatePostPicture(postId: string, file: Blob): Promise<Post> {
    const dto = await this.api.request<any>(`/posts/${postId}/picture`, {
      method: 'PUT',
      // The backend example uses image/jpeg; use generic octet-stream to support any image
      headers: { 'Content-Type': 'application/octet-stream' },
      body: file,
    });
    return mapPost(dto);
  }

  /**
   * Remove a picture from a post by ID.
   * Backend endpoint: DELETE /api/posts/{postId}/picture
   */
  async deletePostPicture(postId: string): Promise<Post> {
    const dto = await this.api.request<any>(`/posts/${postId}/picture`, {
      method: 'DELETE',
    });
    return mapPost(dto);
  }

  /** Like a post by ID. */
  async likePost(postId: string): Promise<void> {
    await this.api.request<void>(`/posts/${postId}/like`, { method: 'POST' });
  }

  /** Remove like from a post by ID. */
  async unlikePost(postId: string): Promise<void> {
    await this.api.request<void>(`/posts/${postId}/like`, { method: 'DELETE' });
  }

  // Events inside a club
  /** List all events for a club. */
  async listEvents(clubId: string): Promise<ClubEvent[]> {
    const arr = await this.api.request<any[]>(`/clubs/${clubId}/events`);
    return arr.map(mapEvent);
  }

  /** Create a new club event. */
  async createEvent(clubId: string, ev: Partial<ClubEvent>): Promise<ClubEvent> {
    const payload: any = {};
    if (ev.title !== undefined) payload.title = ev.title;
    if (ev.description !== undefined) payload.description = ev.description;
    if (ev.date !== undefined) payload.date = ev.date;
    if (ev.time !== undefined) payload.time = ev.time;
    if (ev.location !== undefined) payload.location = ev.location;
    if (ev.status !== undefined) payload.status = ev.status;

    const dto = await this.api.request<any>(`/clubs/${clubId}/events`, {
      method: 'POST',
      body: JSON.stringify(payload),
    });
    return mapEvent(dto);
  }

  /** Update an existing club event. */
  async updateEvent(clubId: string, eventId: number, ev: Partial<ClubEvent>): Promise<ClubEvent> {
    const payload: any = {};
    if (ev.title !== undefined) payload.title = ev.title;
    if (ev.description !== undefined) payload.description = ev.description;
    if (ev.date !== undefined) payload.date = ev.date;
    if (ev.time !== undefined) payload.time = ev.time;
    if (ev.location !== undefined) payload.location = ev.location;
    if (ev.status !== undefined) payload.status = ev.status;

    const dto = await this.api.request<any>(`/clubs/${clubId}/events/${eventId}`, {
      method: 'PUT',
      body: JSON.stringify(payload),
    });
    return mapEvent(dto);
  }

  /** Delete a club event by ID. */
  async deleteEvent(clubId: string, eventId: number): Promise<void> {
    await this.api.request<void>(`/clubs/${clubId}/events/${eventId}`, { method: 'DELETE' });
  }

  /** Join a club event. */
  async joinEvent(clubId: string, eventId: string | number): Promise<void> {
    await this.api.request<void>(`/clubs/${clubId}/events/${eventId}/join`, { method: 'POST' });
  }

  /** Leave a club event. */
  async leaveEvent(clubId: string, eventId: string | number): Promise<void> {
    await this.api.request<void>(`/clubs/${clubId}/events/${eventId}/leave`, { method: 'POST' });
  }

  /** Change a member's role within the club. */
  async updateMemberRole(clubId: string, memberId: number | string, role: Role): Promise<void> {
    await this.api.request<void>(`/clubs/${clubId}/members/${memberId}/role`, {
      method: 'PUT',
      body: JSON.stringify({ role }),
    });
  }

  // Comments on a post
  /** List a page of comments for a post. */
  async listCommentsPage(postId: string, offset = 0, limit = 10): Promise<Comment[]> {
    const params = new URLSearchParams();
    if (typeof offset === 'number') params.set('offset', String(offset));
    if (typeof limit === 'number') params.set('limit', String(limit));
    const query = params.toString();
    const arr = await this.api.request<any[]>(`/posts/${postId}/comments${query ? `?${query}` : ''}`);
    return arr.map(mapComment);
  }

  // Backwards-compat: fetch first page by default
  async listComments(postId: string): Promise<Comment[]> {
    return this.listCommentsPage(postId, 0, 10);
  }

  /** Add a new comment to a post. */
  async addComment(postId: string, content: string): Promise<Comment> {
    const dto = await this.api.request<any>(`/posts/${postId}/comments`, {
      method: 'POST',
      body: JSON.stringify({ content }),
    });
    return mapComment(dto);
  }

  /** Like a comment by ID. */
  async likeComment(commentId: string): Promise<void> {
    await this.api.request<void>(`/comments/${commentId}/like`, { method: 'POST' });
  }

  /** Remove like from a comment by ID. */
  async unlikeComment(commentId: string): Promise<void> {
    await this.api.request<void>(`/comments/${commentId}/like`, { method: 'DELETE' });
  }

  // Voting on comments (used for thread replies)
  /** Upvote a thread reply by ID. Returns updated reply DTO. */
  async upvoteReply(replyId: string): Promise<Comment> {
    const dto = await this.api.request<any>(`/replies/${replyId}/upvote`, { method: 'POST' });
    return mapComment(dto);
  }

  /** Remove upvote on a thread reply by ID. Returns updated reply DTO. */
  async removeUpvoteReply(replyId: string): Promise<Comment> {
    const dto = await this.api.request<any>(`/replies/${replyId}/upvote`, { method: 'DELETE' });
    return mapComment(dto);
  }

  /** Downvote a thread reply by ID. Returns updated reply DTO. */
  async downvoteReply(replyId: string): Promise<Comment> {
    const dto = await this.api.request<any>(`/replies/${replyId}/downvote`, { method: 'POST' });
    return mapComment(dto);
  }

  /** Remove downvote on a thread reply by ID. Returns updated reply DTO. */
  async removeDownvoteReply(replyId: string): Promise<Comment> {
    const dto = await this.api.request<any>(`/replies/${replyId}/downvote`, { method: 'DELETE' });
    return mapComment(dto);
  }

  // Backwards-compatible aliases (comments -> replies)
  async upvoteComment(commentId: string): Promise<Comment> { return this.upvoteReply(commentId); }
  async removeUpvoteComment(commentId: string): Promise<Comment> { return this.removeUpvoteReply(commentId); }
  async downvoteComment(commentId: string): Promise<Comment> { return this.downvoteReply(commentId); }
  async removeDownvoteComment(commentId: string): Promise<Comment> { return this.removeDownvoteReply(commentId); }

  /** Delete a comment by ID (admins/moderators permitted). */
  async deleteComment(commentId: string): Promise<void> {
    await this.api.request<void>(`/comments/${commentId}`, { method: 'DELETE' });
  }
}

export const clubService = new ClubService();
