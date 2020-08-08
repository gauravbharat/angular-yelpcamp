export interface User {
  username: string;
  password: string;
  avatar?: string;
  firstName?: string;
  lastName?: string;
  email: string;
  resetPasswordToken?: string;
  resetPasswordExpires?: Date;
  isAdmin: boolean;
  notifications?: string[];
  followers?: string[];
  created?: Date;
  isPublisher?: boolean;
  isRequestedAdmin?: boolean;
}

export interface AuthData {
  username: string;
  email: string;
  password: string;
}
