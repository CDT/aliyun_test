import { ApiResponse, LoginResult, UserProfile } from '../types';
import { http, unwrapResponse } from './http';

export const login = async (username: string, password: string): Promise<LoginResult> => {
  const response = await http.post<ApiResponse<LoginResult>>('/auth/login', {
    username,
    password,
  });

  return unwrapResponse(response.data);
};

export const getMe = async (): Promise<UserProfile> => {
  const response = await http.get<ApiResponse<UserProfile>>('/auth/me');
  return unwrapResponse(response.data);
};
