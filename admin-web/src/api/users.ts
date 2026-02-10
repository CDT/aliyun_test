import { ApiResponse, Role, UserProfile } from '../types';
import { http, unwrapResponse } from './http';

export const getUsers = async (): Promise<UserProfile[]> => {
  const response = await http.get<ApiResponse<UserProfile[]>>('/users');
  return unwrapResponse(response.data);
};

export const createUser = async (payload: {
  username: string;
  password: string;
  role: Role;
}): Promise<UserProfile> => {
  const response = await http.post<ApiResponse<UserProfile>>('/users', payload);
  return unwrapResponse(response.data);
};

export const updateUser = async (
  userId: string,
  payload: {
    username?: string;
    password?: string;
    role?: Role;
  },
): Promise<UserProfile> => {
  const response = await http.put<ApiResponse<UserProfile>>(`/users/${userId}`, payload);
  return unwrapResponse(response.data);
};

export const deleteUser = async (userId: string): Promise<UserProfile> => {
  const response = await http.delete<ApiResponse<UserProfile>>(`/users/${userId}`);
  return unwrapResponse(response.data);
};
