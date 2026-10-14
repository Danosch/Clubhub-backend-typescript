import { BaseService } from '../../../services/BaseService';
import { setAuthToken } from '../../../services/api';

/** Response shape returned by auth endpoints. */
type LoginRes = {
  token: string;
  user?: { id: number };
  userId?: number;
  id?: number;
};
/** Response shape for registration. Mirrors `LoginRes` on some backends. */
type RegisterRes = {
  token: string;
  user?: { id: number };
  userId?: number;
  id?: number;
};

// Backend requires: email, password. Register: email, username, password.
/** Service handling authentication flows. */
export class AuthService extends BaseService {
  /** Authenticate with email/password and persist token. */
  async login(email: string, password: string): Promise<LoginRes> {
    const payload = this.buildPayload({ email, password });
    const res = await this.api.request<LoginRes>('/auth/login', {
      method: 'POST',
      body: JSON.stringify(payload),
    });
    setAuthToken(res.token);
    return res;
  }

  /** Create a new account with username, email and password. */
  async register(
    username: string,
    email: string,
    password: string
  ): Promise<RegisterRes> {
    const payload = this.buildPayload({ email, username, password });
    const res = await this.api.request<RegisterRes>('/auth/register', {
      method: 'POST',
      body: JSON.stringify(payload),
    });
    return res;
  }

  /** Refresh an existing token and update the stored token. */
  async refresh(currentToken: string): Promise<LoginRes> {
    const res = await this.api.request<LoginRes>('/auth/refresh', {
      method: 'POST',
      body: JSON.stringify({ token: currentToken }),
    });
    setAuthToken(res.token);
    return res;
  }

  /** Notify the backend to invalidate the token and clear it locally. */
  async logout(currentToken: string): Promise<void> {
    await this.api.request('/auth/logout', {
      method: 'POST',
      body: JSON.stringify({ token: currentToken }),
    });
    setAuthToken(null);
  }
}

export const authService = new AuthService();
