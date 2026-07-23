export interface User {
  id: string;
  email: string;
  phone?: string;
  first_name: string;
  last_name: string;
  profile_picture?: string;
  bio?: string;
  gender?: string;
  skill_level?: string;
  preferred_positions?: string[];
  location?: string;
  rating?: number;
  created_at: Date;
  updated_at: Date;
}

export interface CreateUserRequest {
  email: string;
  password: string;
  first_name: string;
  last_name: string;
  phone?: string;
  gender?: string;
  skill_level?: string;
  preferred_positions?: string[];
}

export interface UpdateUserRequest {
  first_name?: string;
  last_name?: string;
  phone?: string;
  bio?: string;
  profile_picture?: string;
  gender?: string;
  skill_level?: string;
  preferred_positions?: string[];
  location?: string;
}

export interface LoginRequest {
  email: string;
  password: string;
}

export interface AuthResponse {
  user: User;
  accessToken: string;
  refreshToken: string;
}

export interface JwtPayload {
  id: string;
  email: string;
  iat?: number;
  exp?: number;
}
