import type { Role } from '../clubs/types';

/** Academic subject majors. */
export enum Subject {
  NONE = 'NONE',
  COMPUTER_SCIENCE = 'COMPUTER_SCIENCE',
  MATHEMATICS = 'MATHEMATICS',
  PHYSICS = 'PHYSICS',
  ENGINEERING = 'ENGINEERING',
  BUSINESS = 'BUSINESS',
  LAW = 'LAW',
  MEDICINE = 'MEDICINE',
  ARCHITECTURE = 'ARCHITECTURE',
  CIVIL_ENGINEERING = 'CIVIL_ENGINEERING',
  ELECTRICAL_ENGINEERING = 'ELECTRICAL_ENGINEERING',
  MECHANICAL_ENGINEERING = 'MECHANICAL_ENGINEERING',
  MEDIA_DESIGN = 'MEDIA_DESIGN',
  SOCIAL_WORK = 'SOCIAL_WORK',
  BUSINESS_ADMINISTRATION = 'BUSINESS_ADMINISTRATION',
  INDUSTRIAL_ENGINEERING = 'INDUSTRIAL_ENGINEERING',
}

/** User interest tags/preferences. */
export enum Preference {
  NONE = 'NONE',
  PROGRAMMING = 'PROGRAMMING',
  PHOTOGRAPHY = 'PHOTOGRAPHY',
  DEBATE = 'DEBATE',
  VOLUNTEERING = 'VOLUNTEERING',
  MUSIC = 'MUSIC',
  ART = 'ART',
  SPORTS = 'SPORTS',
  GAMING = 'GAMING',
  COOKING = 'COOKING',
  READING = 'READING',
  TRAVEL = 'TRAVEL',
  DANCE = 'DANCE',
}

/** Notification settings for the user. */
export interface Notifications {
  email: boolean;
  push: boolean;
  clubUpdates: boolean;
  eventReminders: boolean;
  forumReplies: boolean;
}

/** Privacy preferences controlling profile visibility. */
export interface Privacy {
  profileVisibility: 'public' | 'private';
  showEmail: boolean;
  showClubs: boolean;
  allowMessages: boolean;
}

/** UI/user preferences such as theme and locale. */
export interface PreferencesSettings {
  theme: 'light' | 'dark';
  language: string;
  timeFormat: string;
}

/** Aggregated user settings. */
export interface Settings {
  notifications: Notifications;
  privacy: Privacy;
  preferences: PreferencesSettings;
}

/** Membership record tying a user to a club. */
export interface Membership {
  id: string;
  clubId: string;
  name: string;
  role: Role;
  avatar: string;
  joinedAt: string;
}

/** Normalized user model used by the app. */
export interface User {
  id: string;
  role: string;
  name: string;
  email: string;
  avatar: string;
  description: string;
  subject: Subject;
  preferences: Preference[];
  clubsJoined: number;
  eventsAttended: number;
  memberships: Membership[];
  settings: Settings;
}
