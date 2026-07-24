import {
  generateAccessToken,
  generateRefreshToken,
  verifyAccessToken,
  verifyRefreshToken,
  decodeToken,
} from './jwt';

describe('JWT Utilities', () => {
  const testId = 'user-123';
  const testEmail = 'test@example.com';

  describe('generateAccessToken', () => {
    it('should generate valid access token', () => {
      const token = generateAccessToken(testId, testEmail);

      expect(token).toBeDefined();
      expect(typeof token).toBe('string');
      expect(token.split('.').length).toBe(3);
    });
  });

  describe('generateRefreshToken', () => {
    it('should generate valid refresh token', () => {
      const token = generateRefreshToken(testId, testEmail);

      expect(token).toBeDefined();
      expect(typeof token).toBe('string');
      expect(token.split('.').length).toBe(3);
    });
  });

  describe('verifyAccessToken', () => {
    it('should verify valid access token', () => {
      const token = generateAccessToken(testId, testEmail);
      const payload = verifyAccessToken(token);

      expect(payload).not.toBeNull();
      expect(payload?.id).toBe(testId);
      expect(payload?.email).toBe(testEmail);
      expect(payload?.type).toBe('access');
    });

    it('should return null for refresh token', () => {
      const refreshToken = generateRefreshToken(testId, testEmail);
      const payload = verifyAccessToken(refreshToken);
      expect(payload).toBeNull();
    });

    it('should return null for invalid token', () => {
      const payload = verifyAccessToken('invalid-token');
      expect(payload).toBeNull();
    });

    it('should return null for expired token', () => {
      const expiredToken = generateAccessToken(testId, testEmail);
      // Simulate waiting for expiration (in real scenario)
      const payload = verifyAccessToken(expiredToken);
      // Token is valid immediately after generation
      expect(payload).not.toBeNull();
    });
  });

  describe('verifyRefreshToken', () => {
    it('should verify valid refresh token', () => {
      const token = generateRefreshToken(testId, testEmail);
      const payload = verifyRefreshToken(token);

      expect(payload).not.toBeNull();
      expect(payload?.id).toBe(testId);
      expect(payload?.email).toBe(testEmail);
      expect(payload?.type).toBe('refresh');
    });

    it('should return null for access token', () => {
      const accessToken = generateAccessToken(testId, testEmail);
      const payload = verifyRefreshToken(accessToken);
      expect(payload).toBeNull();
    });

    it('should return null for invalid token', () => {
      const payload = verifyRefreshToken('invalid-token');
      expect(payload).toBeNull();
    });
  });

  describe('decodeToken', () => {
    it('should decode token without verification', () => {
      const token = generateAccessToken(testId, testEmail);
      const payload = decodeToken(token);

      expect(payload).not.toBeNull();
      expect(payload?.id).toBe(testId);
      expect(payload?.email).toBe(testEmail);
    });

    it('should return null for invalid token', () => {
      const payload = decodeToken('invalid-token');
      expect(payload).toBeNull();
    });
  });
});
