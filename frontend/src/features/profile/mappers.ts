import type { User } from './types';
import { Subject } from './types';

/** Map a backend user DTO into the app's `User` model. */
export function mapUser(dto: any): User {
  return {
    id: String(dto.id),
    role: dto.role ?? 'student',
    name: dto.username ?? dto.name ?? '',
    email: dto.email ?? '',
    avatar: dto.avatar ?? '',
    description: dto.description ?? '',
    subject: dto.subject ?? Subject.NONE,
    preferences: dto.preferences ?? [],
    clubsJoined: dto.clubsJoined ?? 0,
    eventsAttended: dto.eventsAttended ?? 0,
    memberships:
      dto.memberships?.map((m: any) => ({
        id: m.id,
        clubId: m.clubId,
        name: m.name,
        role: m.role,
        avatar: m.avatar ?? '',
        joinedAt: m.joinedAt ?? '',
      })) ?? [],
    settings: dto.settings ?? { notifications: {}, privacy: {}, preferences: {} },
  };
}

/**
 * Map a partial `User` object into a minimal DTO understood by the backend.
 * Only whitelists fields that are currently supported server-side.
 */
export function mapUserToDto(p: Partial<User>) {
  const out: any = {};
  if (p.name !== undefined) out.username = p.name;
  if (p.description !== undefined) out.description = p.description;
  if (p.subject !== undefined) out.subject = p.subject;
  if (p.preferences !== undefined) out.preferences = p.preferences;
  return out;
}
