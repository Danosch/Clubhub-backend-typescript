import { BaseService } from '../../../services/BaseService';

/** Pending club creation request. */
export interface ClubRequest {
  id: number;
  name: string;
  requestedBy: string;
  date: string;
}

/** Request for creating an external (non-student) account. */
export interface ExternalAccountRequest {
  id: number;
  email: string;
  reason: string;
  date: string;
}

/** Basic analytics snapshot for the platform. */
export interface Analytics {
  totalClubs: number;
  totalMembers: number;
  totalPosts: number;
  avgEngagement: number;
}

/** Service for administration workflows. */
export class AdminService extends BaseService {
  /** Fetch pending club creation requests. */
  async getClubRequests(): Promise<ClubRequest[]> {
    // TODO: replace '/admin/club-requests' with backend endpoint and return API response
    await this.api.request('/admin/club-requests');
    return [];
  }

  /** Approve a club creation request. */
  async approveClub(id: number): Promise<void> {
    const payload = this.buildPayload({ id });
    // TODO: replace '/admin/club-requests/approve' with backend endpoint
    await this.api.request('/admin/club-requests/approve', {
      method: 'POST',
      body: JSON.stringify(payload)
    });
  }

  /** Reject a club creation request. */
  async rejectClub(id: number): Promise<void> {
    const payload = this.buildPayload({ id });
    // TODO: replace '/admin/club-requests/reject' with backend endpoint
    await this.api.request('/admin/club-requests/reject', {
      method: 'POST',
      body: JSON.stringify(payload)
    });
  }

  /** Fetch pending external account requests. */
  async getExternalRequests(): Promise<ExternalAccountRequest[]> {
    // TODO: replace '/admin/external-requests' with backend endpoint
    await this.api.request('/admin/external-requests');
    return [];
  }

  /** Approve an external account request. */
  async approveExternal(id: number): Promise<void> {
    const payload = this.buildPayload({ id });
    // TODO: replace '/admin/external-requests/approve' with backend endpoint
    await this.api.request('/admin/external-requests/approve', {
      method: 'POST',
      body: JSON.stringify(payload)
    });
  }

  /** Reject an external account request. */
  async rejectExternal(id: number): Promise<void> {
    const payload = this.buildPayload({ id });
    // TODO: replace '/admin/external-requests/reject' with backend endpoint
    await this.api.request('/admin/external-requests/reject', {
      method: 'POST',
      body: JSON.stringify(payload)
    });
  }

  /** Fetch a snapshot of platform analytics. */
  async getAnalytics(): Promise<Analytics> {
    // TODO: replace '/admin/analytics' with backend endpoint
    await this.api.request('/admin/analytics');
    return { totalClubs: 0, totalMembers: 0, totalPosts: 0, avgEngagement: 0 };
  }
}

export const adminService = new AdminService();
