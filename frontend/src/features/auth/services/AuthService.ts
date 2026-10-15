import { BaseService } from '../../../services/BaseService';

/**
 * Calls the backend's cookie-based authentication endpoints.
 */
export class AuthService extends BaseService {

  /**
   * Checks whether the browser has an active session.
   */
  async checkSession(): Promise<void> {
    await this.api.request<unknown>('/users/me', {
      skipUnauthorizedCallback: true
    });
  }

  /**
   * Signs in and lets the browser store the response cookie.
   * 
   * @param email User's email address.
   * @param password User's password.
   */
  async login(email: string, password: string): Promise<void> {
    await this.api.request<void>('/auth/login', {
      method: 'POST',
      body: JSON.stringify({ email, password }),
      skipUnauthorizedCallback: true
    });
  }

  /**
   * Creates an account without starting a session.
   * 
   * @param username Display name.
   * @param email email User's email address.
   * @param password User's password.
   */
  async register(
    username: string,
    email: string,
    password: string
  ): Promise<void> {
    await this.api.request<unknown>('/auth/register', {
      method: 'POST',
      body: JSON.stringify({ username, email, password }),
      skipUnauthorizedCallback: true
    });
  }

  /**
   * Extends the current session using its cookie.
   */
  async refresh(): Promise<void> {
    await this.api.request<void>('/auth/refresh',
      { method: 'POST' }
    );
  }

  /**
   * Revokes the current session and clears its cookie.
   */
  async logout(): Promise<void> {
    await this.api.request<void>('/auth/logout',
      { method: 'POST' }
    );
  }
}

export const authService = new AuthService();
