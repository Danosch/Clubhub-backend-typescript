// src/features/support/services/SupportService.ts
import { BaseService } from '../../../services/BaseService';

/** Service for submitting support/feedback requests. */
export class SupportService extends BaseService {
  /** Send a feedback/support message to the backend. */
  async sendFeedback(
    subject: string,
    email: string,
    message: string
  ): Promise<void> {
    const payload = this.buildPayload({ subject, email, message });
    // TODO: replace '/support/feedback' with backend endpoint
    await this.api.request('/support/feedback', {
      method: 'POST',
      body: JSON.stringify(payload)
    });
    // TODO: remove console log once API integration is complete
    return new Promise(resolve =>
      setTimeout(() => {
        console.log('Support request:', { subject, email, message });
        resolve();
      }, 200)
    );
  }
}

export const supportService = new SupportService();
