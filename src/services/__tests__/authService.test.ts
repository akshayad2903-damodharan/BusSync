import { describe, it, expect, beforeEach } from 'vitest';
import { authService } from '../authService';
import { mockEngine } from '../mockEngine';

describe('Feature 2: authService & Roster Verification', () => {
  const apexId = '11111111-1111-1111-1111-111111111111';

  beforeEach(() => {
    mockEngine.logout();
    const driver = mockEngine.drivers[0];
    driver.failed_pin_attempts = 0;
    driver.locked_until = null;
  });

  it('allows roster email to request OTP', async () => {
    const res = await authService.requestOtp(apexId, 'student@apex.edu');
    expect(res.success).toBe(true);
  });

  it('rejects email not in institution roster with descriptive error', async () => {
    await expect(authService.requestOtp(apexId, 'unauthorized@gmail.com')).rejects.toThrow(
      'not registered in your institution roster'
    );
  });

  it('verifies student OTP and returns user profile with student role', async () => {
    const profile = await authService.verifyOtp(apexId, 'student@bussync.dev', '123456', 'student');
    expect(profile).toBeDefined();
    expect(profile.email).toBe('student@bussync.dev');
    expect(profile.role).toBe('student');
    expect(authService.getCurrentUser()?.email).toBe('student@bussync.dev');
  });

  it('verifies driver shared credentials and succeeds', async () => {
    const res = await authService.driverSharedLogin('driver@bussync.dev', 'Driver@123');
    expect(res.success).toBe(true);
    expect(res.institutionId).toBe(apexId);
  });

  it('verifies driver personal PIN 1234 successfully', async () => {
    const driver = mockEngine.drivers[0];
    const res = await authService.verifyDriverPin(apexId, driver.id, '1234');
    expect(res.success).toBe(true);
    expect(res.driver?.name).toBe('Ravi Kumar');
  });

  it('enforces 5-attempt rate-limiting and locks account on 5th incorrect PIN', async () => {
    const driver = mockEngine.drivers[0];

    // Attempts 1 to 4
    for (let i = 1; i <= 4; i++) {
      const res = await authService.verifyDriverPin(apexId, driver.id, '0000');
      expect(res.success).toBe(false);
      expect(res.locked).toBe(false);
      expect(res.remainingAttempts).toBe(5 - i);
    }

    // 5th attempt triggers lockout
    const res5 = await authService.verifyDriverPin(apexId, driver.id, '0000');
    expect(res5.success).toBe(false);
    expect(res5.locked).toBe(true);
    expect(res5.remainingAttempts).toBe(0);

    // Subsequent attempt is blocked by lockout
    const blockedRes = await authService.verifyDriverPin(apexId, driver.id, '1234');
    expect(blockedRes.success).toBe(false);
    expect(blockedRes.locked).toBe(true);
  });

  it('authenticates one-tap dev quick login accounts', async () => {
    const driverProfile = await authService.devQuickLogin('driver@bussync.dev');
    expect(driverProfile.role).toBe('driver');

    const studentProfile = await authService.devQuickLogin('student@bussync.dev');
    expect(studentProfile.role).toBe('student');

    const employeeProfile = await authService.devQuickLogin('employee@bussync.dev');
    expect(employeeProfile.role).toBe('employee');

    const adminProfile = await authService.devQuickLogin('admin@bussync.dev');
    expect(adminProfile.role).toBe('admin');
  });
});

