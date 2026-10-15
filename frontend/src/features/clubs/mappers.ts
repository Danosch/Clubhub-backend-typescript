import type { Club, Event as ClubEvent, Comment, Member, Thread } from './types';
import { Subject, Preference } from '../profile/types';

/** Normalize a backend club DTO to the app's `Club` model. */
export function mapClub(dto: any): Club {
  const rawId = dto.id ?? dto.clubId ?? dto._id;
  const avatar = dto.avatar ?? '';
  return {
    id: String(rawId),
    name: dto.name,
    description: dto.description ?? '',
    category: dto.category ?? 'General',
    subject: dto.subject ?? Subject.NONE,
    interest: dto.interest ?? Preference.NONE,
    avatar,
    members: dto.membersCount ?? dto.members ?? 0,
    isJoined: !!dto.isJoined,

    events: (dto.events ?? []).map(mapEvent),
    members_list: (dto.membersList ?? dto.members_list ?? []).map(mapMember),
    forum_threads: (dto.forumThreads ?? dto.forum_threads ?? [])
      .map(mapThread)
      .sort((a: Thread, b: Thread) => {
        const ta = new Date(a.lastActivity || '').getTime();
        const tb = new Date(b.lastActivity || '').getTime();
        return (isNaN(tb) ? 0 : tb) - (isNaN(ta) ? 0 : ta);
      }),
  };
}

/** Normalize a backend member DTO into a `Member`. */
export function mapMember(dto: any): Member {
  return {
    id: dto.id ?? dto.membershipId ?? '',
    userId: dto.userId ?? dto.user_id ?? dto.id ?? '',
    name: dto.name ?? dto.username ?? '',
    role: dto.role ?? 'MEMBER',
    avatar: dto.avatar ?? '',
  };
}

/** Normalize a backend event DTO into an `Event`. */
export function mapEvent(dto: any): ClubEvent {
  return {
    id: dto.id,
    title: dto.title,
    description: dto.description,
    date: dto.date,
    time: dto.time,
    location: dto.location,
    status: (dto.status ?? 'SCHEDULED') as any,
    joined:
      dto.participantsCount ?? dto.joined ?? dto.attendeesCount ?? dto.attendees?.length,
    participants: (dto.participants ?? dto.attendees ?? []).map((p: any) => ({
      id: p.id ?? p.userId ?? '',
      name: p.name ?? p.username ?? '',
      surname: p.surname ?? '',
      email: p.email ?? '',
      avatar: p.avatar ?? '',
    })),
  };
}

/** Normalize a backend post DTO into a `Post`. */
export function mapPost(dto: any) {
  return {
    id: dto.id,
    clubId: dto.club?.id ?? dto.clubId ?? dto.club_id ?? undefined,
    author: dto.author?.username ?? dto.author ?? dto.username ?? 'Unknown',
    avatar: dto.author?.avatar ?? dto.avatar ?? '',
    content: dto.content ?? '',
    likes: dto.likes ?? 0,
    comments: dto.comments ?? 0,
    time: dto.time ?? dto.createdAt ?? '',
    commentsList: Array.isArray(dto.commentsList)
      ? (dto.commentsList as any[]).map(mapComment)
      : [],
    picture: dto.picture ?? dto.photo,
    poll: dto.poll,
    liked: dto.liked ?? dto.likedByUser ?? dto.likedByMe ?? false,
  };
}

/** Normalize a backend comment DTO into a `Comment`. */
export function mapComment(dto: any): Comment {
  const authorObj = dto.author ?? {};
  const author: any = {
    id: authorObj.id ?? dto.authorId ?? dto.userId ?? '',
    username: authorObj.username ?? dto.author ?? dto.username ?? 'Unknown',
    avatar: authorObj.avatar ?? dto.avatar ?? '',
  };
  return {
    id: dto.id,
    author,
    content: dto.content ?? '',
    time: dto.time ?? dto.createdAt ?? '',
    likes: dto.likes ?? 0,
    liked: dto.liked ?? dto.likedByUser ?? dto.likedByMe ?? false,
    upvotes: dto.upvotes ?? 0,
    downvotes: dto.downvotes ?? 0,
    upvoted: dto.upvoted ?? false,
    downvoted: dto.downvoted ?? false,
  };
}

/** Normalize a backend thread DTO into a `Thread`. */
export function mapThread(dto: any): Thread {
  const authorObj = dto.author ?? {};
  const author = authorObj.username ?? dto.author ?? dto.username ?? 'Unknown';
  const avatar = authorObj.avatar ?? dto.avatar ?? '';
  const commentsList = Array.isArray(dto.replies)
    ? (dto.replies as any[]).map(mapComment)
    : Array.isArray(dto.posts)
    ? (dto.posts as any[]).map(mapComment)
    : Array.isArray(dto.commentsList)
      ? (dto.commentsList as any[]).map(mapComment)
      : [];
  return {
    id: String(dto.id ?? dto.threadId ?? dto._id ?? ''),
    title: dto.title ?? '',
    author,
    avatar,
    replies: dto.replyCount ?? dto.replies ?? dto.comments ?? dto.commentCount ?? commentsList.length ?? 0,
    lastActivity: dto.lastActivity ?? dto.updatedAt ?? dto.time ?? dto.createdAt ?? '',
    content: dto.content ?? '',
    posts: commentsList,
    upvotes: dto.upvotes ?? 0,
    downvotes: dto.downvotes ?? 0,
    upvoted: dto.upvoted ?? false,
    downvoted: dto.downvoted ?? false,
  };
}
