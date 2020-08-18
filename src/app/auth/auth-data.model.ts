export interface RegisterUser {
  username: string;
  password: string;
  firstname?: string;
  lastname?: string;
  email: string;
  isAdmin: boolean;
  isPublisher?: boolean;
  isRequestedAdmin?: boolean;
  isSuperAdmin?: boolean;
}

export interface CurrentUser {
  id: number;
  userId: string;
  email: string;
  username: string;
  firstname: string;
  lastname: string;
  isAdmin: boolean;
  avatar?: string;
  followers?: string[];
  notifications?: string[];
  isPublisher?: boolean;
  isRequestedAdmin?: boolean;
  isSuperAdmin: boolean;
  token: string;
  expiresIn: number;
  tokenTimer?: any;
}

export interface DisplayCoUser {
  coUserId: string;
  email: string;
  username: string;
  firstname: string;
  lastname: string;
  isAdmin: boolean;
  avatar?: string;
  followers?: string[];
  isPublisher?: boolean;
  isRequestedAdmin?: boolean;
  isSuperAdmin: boolean;
}

export interface AuthData {
  username: string;
  email: string;
  password: string;
}
