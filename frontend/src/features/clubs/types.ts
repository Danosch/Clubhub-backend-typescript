import { Subject, Preference } from '../profile/types';

/** Possible lifecycle states for a club event. */
/** Possible lifecycle states for a club event (backend enum). */
export type EventStatus = 'SCHEDULED' | 'COMPLETED' | 'CANCELLED';

/** Event attendee details. */
export interface Participant {
  id: string;
  name: string;
  surname: string;
  email: string;
  avatar?: string;
}

/** Normalized event model used within club features. */
export interface Event {
  id: number;
  title: string;
  description?: string;
  date: string;             // ISO date string, e.g. "2025-07-20"
  time: string;             // HH:mm format, e.g. "14:00"
  location?: string;        // e.g. "Student Union, Room 101"
  status?: EventStatus;
  joined?: number;
  participants?: Participant[];
}

/** Minimal user reference attached to comments. */
export interface AuthorRef {
  id: string;
  username: string;
  avatar?: string;
}

/** Comment on posts or threads. */
export interface Comment {
  id: string;
  author: AuthorRef;
  content: string;
  time: string;
  likes?: number;
  liked?: boolean;
  // Voting (used for thread replies; optional for post comments)
  upvotes?: number;
  downvotes?: number;
  upvoted?: boolean;
  downvoted?: boolean;
}

/** Single option within a poll. */
export interface PollOption {
  text: string;
  votes: number;
}

/** Poll attached to a post. */
export interface Poll {
  question: string;
  options: PollOption[];
}

/** Post created inside a club. */
export interface Post {
  id: string;
  /** Owning club id (when available). */
  clubId?: string;
  author: string;
  avatar?: string;
  content: string;
  likes: number;
  comments: number;
  time: string;
  commentsList?: Comment[];
  picture?: string;
  poll?: Poll;
  liked?: boolean;
}

/** Club member role. */
export type Role = 'ADMIN' | 'MODERATOR' | 'MEMBER';

/** Membership record used in club member lists. */
export interface Member {
  /** Unique membership identifier */
  id: number | string;
  /** Actual user identifier used to fetch profile */
  userId: number | string;
  name: string;
  role: Role;
  avatar: string;
}

/** Forum thread inside a club. */
export interface Thread {
  id: string;
  title: string;
  author: string;
  avatar?: string;
  replies: number;
  lastActivity: string;
  content?: string;
  posts?: Comment[];
  // Voting
  upvotes?: number;
  downvotes?: number;
  upvoted?: boolean;
  downvoted?: boolean;
}

/**
 * Aggregated club model containing basic info, content and membership lists.
 */
export interface Club {
  id: string;
  name: string;
  description: string;
  members: number;
  category: string;
  subject: Subject;
  interest: Preference;
  avatar: string;
  isJoined: boolean;

  events: Event[];
  members_list: Member[];
  forum_threads: Thread[];
}
