import jwt from 'jsonwebtoken';
import config from '../config/environment';
import { JwtPayload } from '../types/user.interface';

export const generateAccessToken = (id: string, email: string): string => {
  return jwt.sign({ id, email, type: 'access' }, config.jwt.secret, {
    expiresIn: config.jwt.expire,
  });
};

export const generateRefreshToken = (id: string, email: string): string => {
  return jwt.sign({ id, email, type: 'refresh' }, config.jwt.secret, {
    expiresIn: config.jwt.refreshExpire,
  });
};

export const verifyAccessToken = (token: string): JwtPayload | null => {
  try {
    const payload = jwt.verify(token, config.jwt.secret) as JwtPayload;
    // If type field exists, it must be 'access'. If missing, accept it (old tokens).
    if (payload.type && payload.type !== 'access') {
      return null;
    }
    return payload;
  } catch (error) {
    return null;
  }
};

export const verifyRefreshToken = (token: string): JwtPayload | null => {
  try {
    const payload = jwt.verify(token, config.jwt.secret) as JwtPayload;
    // If type field exists, it must be 'refresh'. If missing, accept it (old tokens).
    if (payload.type && payload.type !== 'refresh') {
      return null;
    }
    return payload;
  } catch (error) {
    return null;
  }
};

export const decodeToken = (token: string): JwtPayload | null => {
  try {
    return jwt.decode(token) as JwtPayload;
  } catch (error) {
    return null;
  }
};
