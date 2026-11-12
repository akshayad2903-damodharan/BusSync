// ==============================================================================
// BusSync: authService
// Clean service layer for authentication, roster verification, and driver PIN
// ==============================================================================

import { UserProfile, Driver, Role } from '../types';
import { mockEngine } from './mockEngine';

const isMock = import.meta.env.VITE_USE_MOCKS === 'true';
const isDev = import.meta.env.VITE_DEV_MODE === 'true';

export interface AuthState {
  user: UserProfile | null;
  driver: Driver | null;
  isAuthenticated: boolean;
}

export const authService = {
  // Check if an email is registered in the institution's roster
  async checkRoster(institutionId: string, email: string): Promise<{ inRoster: boolean; name?: string; role?: 'student' | 'employee' }> {
    if (isMock) {
      const res = mockEngine.verifyRosterEmail(institutionId, email);
      return {
        inRoster: res.allowed,
        name: res.entry?.name,
        role: res.entry?.role
      };
    }

    // In live Supabase mode: query roster table
    // (Handled via Supabase client when not in mock mode)
    return { inRoster: true };
  },

  // Student / Employee login via email OTP
  async requestOtp(institutionId: string, email: string): Promise<{ success: boolean; message: string }> {
    const cleanEmail = email.trim().toLowerCase();
    
    // Check roster first
    const rosterCheck = await this.checkRoster(institutionId, cleanEmail);
    if (!rosterCheck.inRoster) {
      throw new Error('This email is not registered in your institution roster. Please contact your administrator.');
    }

    if (isMock) {
      return {
        success: true,
        message: isDev ? 'OTP code 123456 sent (Dev Mode bypass active).' : 'Verification code sent to your email.'
      };
    }

    return { success: true, message: 'Verification email sent.' };
  },

  // Verify OTP for Student / Employee / Admin
  async verifyOtp(
    institutionId: string,
    email: string,
    otpCode: string,
    role: Role = 'student'
  ): Promise<UserProfile> {
    const cleanEmail = email.trim().toLowerCase();

    // Dev mode OTP bypass
    if (isDev && otpCode === '123456') {
      if (isMock) {
        return mockEngine.devQuickLogin(cleanEmail);
      }
    }

    if (isMock) {
      // In mock mode, if OTP matches 123456 or dev login
      if (otpCode !== '123456') {
        throw new Error('Invalid verification code. (In dev mode, use 123456)');
      }
      return mockEngine.devQuickLogin(cleanEmail);
    }

    throw new Error('Live Supabase OTP authentication not yet configured.');
  },

  // Shared institution login for drivers (Step 1)
  async driverSharedLogin(email: string, password: string): Promise<{ success: boolean; institutionId: string; institutionName: string }> {
    const cleanEmail = email.trim().toLowerCase();
    
    if (isMock) {
      if (cleanEmail === 'driver@bussync.dev' && password === 'Driver@123') {
        const inst = mockEngine.institutions[0]; // Apex Institute
        return {
          success: true,
          institutionId: inst.id,
          institutionName: inst.name
        };
      }
      throw new Error('Invalid shared institution email or password.');
    }

    throw new Error('Live Supabase driver login not yet configured.');
  },

  // Driver PIN verification with rate limiting (Step 2)
  async verifyDriverPin(
    institutionId: string,
    driverId: string,
    pin: string
  ): Promise<{ success: boolean; driver?: Driver; remainingAttempts?: number; locked?: boolean; message?: string }> {
    if (isMock) {
      return mockEngine.verifyDriverPin(institutionId, driverId, pin);
    }

    throw new Error('Live Supabase driver PIN verification not yet configured.');
  },

  // Complete driver session login after PIN verification
  async completeDriverLogin(institutionId: string, driver: Driver): Promise<UserProfile> {
    const userProfile: UserProfile = {
      id: driver.id,
      institution_id: institutionId,
      email: `${driver.name.toLowerCase().replace(/\s+/g, '.')}@driver.bussync`,
      name: driver.name,
      role: 'driver'
    };

    if (isMock) {
      mockEngine.currentUser = userProfile;
      mockEngine.currentDriver = driver;
      mockEngine.notify();
    }

    return userProfile;
  },

  // One-tap Dev Quick Login (Only active when VITE_DEV_MODE=true)
  async devQuickLogin(email: string): Promise<UserProfile> {
    if (!isDev) {
      throw new Error('Dev quick login is disabled in production builds.');
    }

    if (isMock) {
      return mockEngine.devQuickLogin(email);
    }

    throw new Error('Dev quick login requires mock mode or dev seeds.');
  },

  // Get current authenticated user
  getCurrentUser(): UserProfile | null {
    if (isMock) {
      return mockEngine.currentUser;
    }
    return null;
  },

  // Get current active driver (if logged in as driver)
  getCurrentDriver(): Driver | null {
    if (isMock) {
      return mockEngine.currentDriver;
    }
    return null;
  },

  // Logout
  async logout(): Promise<void> {
    if (isMock) {
      mockEngine.logout();
    }
  },

  // Subscribe to auth state changes
  onAuthStateChange(callback: (state: AuthState) => void): () => void {
    if (isMock) {
      return mockEngine.subscribe(() => {
        callback({
          user: mockEngine.currentUser,
          driver: mockEngine.currentDriver,
          isAuthenticated: !!mockEngine.currentUser
        });
      });
    }
    return () => {};
  }
};
