import type { BookmarkedPost } from './types';

/** Normalize a backend DTO into a `BookmarkedPost`. */
export function mapBookmarkedPost(dto: any): BookmarkedPost {
  return {
    id: String(dto.id),
    author: dto.author?.username ?? dto.author ?? dto.username ?? 'Unknown',
    authorAvatar: dto.author?.avatar ?? '',
    content: dto.content ?? '',
    time: dto.time ?? dto.createdAt ?? '',
    likes: dto.likes ?? 0,
    comments: dto.comments ?? 0,
    clubId: dto.clubId ?? dto.club?.id,
    clubName: dto.clubName ?? dto.club?.name,
    clubImage: dto.clubImage ?? dto.club?.image,
    picture: dto.picture ?? dto.photo,
    liked: dto.liked ?? dto.likedByUser ?? dto.likedByMe ?? false,
  };
}
