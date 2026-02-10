export type Role = 'admin' | 'user';

export interface ApiResponse<T> {
  code: number;
  data: T;
  message: string;
}

export interface UserProfile {
  id: string;
  username: string;
  role: Role;
  createdAt: string;
  updatedAt: string;
}

export interface LoginResult {
  accessToken: string;
  user: UserProfile;
}
