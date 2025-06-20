export interface User {
  uuid: string;
  email: string;
  nickname: string;
  avatar_url: string;
  signin_type: string;
  signin_provider: string;
  signin_openid: string;
  created_at: string;
  signin_ip: string;
  last_signin_at?: string;
  signin_count?: number;
}

export interface UserSession {
  uuid: string;
  email: string;
  nickname: string;
  avatar_url: string;
  created_at: string;
} 