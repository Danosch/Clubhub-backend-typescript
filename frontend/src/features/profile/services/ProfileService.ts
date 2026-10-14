import { BaseService } from '../../../services/BaseService';
import type { User } from '../types';
import { mapUser, mapUserToDto } from '../mappers';

/** Service for profile CRUD and avatar uploads. */
export class ProfileService extends BaseService {
  /** Fetch the current user via the `/users/me` endpoint. */
  async getCurrent(): Promise<User> {
    const dto = await this.api.request<any>('/users/me');
    return mapUser(dto);
  }

  /** Fetch any user by user ID. */
  async getById(id: string | number): Promise<User> {
    const dto = await this.api.request<any>(`/users/${id}`);
    return mapUser(dto);
  }

  /** Update the current user with a partial payload. */
  async updateCurrent(id: string, partial: Partial<User>): Promise<User> {
    const dto = await this.api.request<any>(`/users/${id}`, {
      method: 'PUT',
      body: JSON.stringify(mapUserToDto(partial)),
    });
    return mapUser(dto);
  }

  /** Upload a new avatar for the given user. */
  async updateAvatar(id: string, file: Blob): Promise<User> {
    const dto = await this.api.request<any>(`/users/${id}/avatar`, {
      method: 'PUT',
      headers: { 'Content-Type': 'application/octet-stream' },
      body: file,
    });
    return mapUser(dto);
  }
}

export const profileService = new ProfileService();
