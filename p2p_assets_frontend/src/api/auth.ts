import { api } from './axios';
import { API_CONFIG } from '../config/api';
import type { User } from '../types';

export interface LoginResponse {
  access_token: string;
  token_type: string;
  user: User;
}

export async function login(username: string, password: string): Promise<LoginResponse> {
  const { data } = await api.post<{ data: LoginResponse }>(
    `${API_CONFIG.API_VERSION}/auth/login`,
    { username, password }
  );
  return data.data ?? (data as unknown as LoginResponse);
}

export async function getMe(): Promise<User> {
  const { data } = await api.get<{ data: User }>(`${API_CONFIG.API_VERSION}/auth/me`);
  return data.data ?? (data as unknown as User);
}
