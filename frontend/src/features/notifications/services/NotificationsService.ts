// src/features/notifications/services/NotificationsService.ts
import { BaseService } from '../../../services/BaseService';

/** Notification severity levels supported by the UI. */
export type NotificationType = 'info' | 'success' | 'warning' | 'error';

/** Basic notification item. */
export interface Notification {
  id: number;
  type: NotificationType;
  message: string;
  time: string;
  read: boolean;
}

export class NotificationsService extends BaseService {
  /** Fetch all notifications for the current user. */
  async getAll(): Promise<Notification[]> {
    // TODO: replace '/notifications' with backend endpoint
    await this.api.request('/notifications');
    return [];
  }

  /** Mark a single notification as read. */
  async markAsRead(id: number): Promise<void> {
    const payload = this.buildPayload({ id });
    // TODO: replace '/notifications/mark-read' with backend endpoint
    await this.api.request('/notifications/mark-read', {
      method: 'POST',
      body: JSON.stringify(payload)
    });
  }

  /** Mark all notifications as read. */
  async markAllAsRead(): Promise<void> {
    // TODO: replace '/notifications/mark-all-read' with backend endpoint
    await this.api.request('/notifications/mark-all-read', { method: 'POST' });
  }
}

export const notificationsService = new NotificationsService();
