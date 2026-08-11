export type UserRole = 'admin' | 'driver' | 'developer';
export type UserStatus = 'approved' | 'pending' | 'rejected';

export interface AuthUser {
  id: string;
  name: string;
  email: string;
  password: string;
  role: UserRole;
  status: UserStatus;
  createdAt: string;
}
