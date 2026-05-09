export type NotificationType = "like" | "comment" | "follow";

export interface UserSummary {
  id: string;
  username: string;
  displayName: string;
  bio: string;
  avatarColor: string;
  createdAt: string;
  followersCount: number;
  followingCount: number;
  isFollowing: boolean;
}

export interface CommentRecord {
  id: string;
  postId: string;
  author: UserSummary;
  content: string;
  createdAt: string;
}

export interface PostRecord {
  id: string;
  author: UserSummary;
  content: string;
  createdAt: string;
  updatedAt: string;
  likeCount: number;
  commentCount: number;
  likedByMe: boolean;
}

export interface NotificationPreferences {
  notifyOnLike: boolean;
  notifyOnComment: boolean;
  notifyOnFollow: boolean;
  emailNotifications: boolean;
  realtimeNotifications: boolean;
}

export interface NotificationRecord {
  id: string;
  sender: UserSummary;
  type: NotificationType;
  message: string;
  postId: string | null;
  isRead: boolean;
  createdAt: string;
}

export interface AuthPayload {
  token: string;
  user: UserSummary;
}

export interface FeedResponse {
  items: PostRecord[];
  nextCursor: string | null;
}

export interface CommentsResponse {
  items: CommentRecord[];
  nextCursor: string | null;
}

export interface ProfileResponse {
  profile: UserSummary;
  posts: FeedResponse;
}

export interface NotificationsResponse {
  items: NotificationRecord[];
  nextCursor: string | null;
}

export interface PostDetailsResponse {
  post: PostRecord;
  comments: CommentsResponse;
}

export interface SearchUsersResponse {
  items: UserSummary[];
}

export interface TrendingResponse {
  items: PostRecord[];
}

export interface UnreadCountResponse {
  unreadCount: number;
}

export interface PreferencesResponse {
  preferences: NotificationPreferences;
}

export interface MeResponse {
  user: UserSummary;
}

export interface SuccessResponse {
  ok: true;
}

export interface ApiErrorResponse {
  error: string;
}

export interface SignupRequest {
  username: string;
  displayName: string;
  email: string;
  password: string;
}

export interface LoginRequest {
  email: string;
  password: string;
}

export interface CreatePostRequest {
  content: string;
}

export interface CreateCommentRequest {
  content: string;
}

export interface UpdateProfileRequest {
  displayName: string;
  bio: string;
}

export interface ChangePasswordRequest {
  currentPassword: string;
  newPassword: string;
}

export interface NotificationEvent {
  type: "new_notification" | "unread_count";
  notification?: NotificationRecord;
  unreadCount?: number;
}

export interface RequestPasswordReset {
  phone: string;
}

export interface VerifyPasswordReset {
  phone: string;
  code: string;
  newPassword: string;
}

export interface PasswordResetResponse {
  ok: true;
}
