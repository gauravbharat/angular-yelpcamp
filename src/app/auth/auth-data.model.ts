export interface Notifications {
  _id: string;
  campgroundId?: NotificationCampgroundDetails | any;
  campgroundName?: string;
  commentId?: NotificationCommentDetails | any;
  created: Date;
  isRead: boolean;
  notificationType: number;
  userId?: ShortUser | any;
  username?: string;
  follower?: {
    followerAvatar: string;
    followingUserId: ShortUser | any;
    id: ShortUser | any;
  };
  isCommentLike?: boolean;
}
interface ShortUser {
  _id: string;
  username: string;
  avatar: string;
}

interface NotificationCampgroundDetails {
  _id: string;
  name: string;
}

interface NotificationCommentDetails {
  _id: string;
  text: string;
}

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

export interface UserSettingsUpdate {
  userId: string;
  firstname: string;
  lastname: string;
  email: string;
  hideStatsDashboard: boolean;
  enableNotifications: {
    newCampground: boolean;
    newComment: boolean;
    newFollower: boolean;
    newCommentLike: boolean;
  };
  enableNotificationEmails: {
    newCampground: boolean;
    newComment: boolean;
    newFollower: boolean;
  };
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
  notifications?: any[] | Notifications[];
  isPublisher?: boolean;
  isRequestedAdmin?: boolean;
  isSuperAdmin?: boolean;
  enableNotifications: {
    newCampground: boolean;
    newComment: boolean;
    newFollower: boolean;
    newCommentLike: boolean;
  };
  enableNotificationEmails: {
    system: boolean;
    newCampground: boolean;
    newComment: boolean;
    newFollower: boolean;
  };
  hideStatsDashboard: boolean;
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
