import {
  AuthPayload,
  CommentsResponse,
  FeedResponse,
  MeResponse,
  NotificationPreferences,
  NotificationsResponse,
  PostDetailsResponse,
  PreferencesResponse,
  ProfileResponse,
  SearchUsersResponse,
  TrendingResponse,
  UnreadCountResponse,
} from "@shared/api";

const API_PREFIX = "/api/v1";
const TOKEN_KEY = "pulse-auth-token";

export function getStoredToken() {
  return localStorage.getItem(TOKEN_KEY);
}

export function storeToken(token: string | null) {
  if (!token) {
    localStorage.removeItem(TOKEN_KEY);
    return;
  }

  localStorage.setItem(TOKEN_KEY, token);
}

async function request<T>(path: string, init: RequestInit = {}, token?: string | null): Promise<T> {
  const headers = new Headers(init.headers || {});
  headers.set("Content-Type", "application/json");
  if (token) {
    headers.set("Authorization", `Bearer ${token}`);
  }

  const response = await fetch(`${API_PREFIX}${path}`, {
    ...init,
    headers,
  });

  if (!response.ok) {
    const payload = await response.json().catch(() => ({ error: "Request failed" }));
    throw new Error(payload.error || "Request failed");
  }

  return response.json();
}

export const api = {
  auth: {
    signup(payload: {
      username: string;
      displayName: string;
      email: string;
      password: string;
    }) {
      return request<AuthPayload>("/auth/signup", {
        method: "POST",
        body: JSON.stringify(payload),
      });
    },
    login(payload: { email: string; password: string }) {
      return request<AuthPayload>("/auth/login", {
        method: "POST",
        body: JSON.stringify(payload),
      });
    },
    logout(token: string) {
      return request<{ ok: true }>("/auth/logout", { method: "POST" }, token);
    },
    me(token: string) {
      return request<MeResponse>("/auth/me", {}, token);
    },
    changePassword(
      token: string,
      payload: { currentPassword: string; newPassword: string },
    ) {
      return request<{ ok: true }>(
        "/auth/password",
        {
          method: "POST",
          body: JSON.stringify(payload),
        },
        token,
      );
    },
  },
  posts: {
    feed(token: string, cursor?: string | null) {
      const query = cursor ? `?cursor=${cursor}` : "";
      return request<FeedResponse>(`/posts/feed${query}`, {}, token);
    },
    trending(token: string) {
      return request<TrendingResponse>("/posts/trending", {}, token);
    },
    create(token: string, content: string) {
      return request<{ post: FeedResponse["items"][number] }>(
        "/posts",
        {
          method: "POST",
          body: JSON.stringify({ content }),
        },
        token,
      );
    },
    details(token: string, postId: string) {
      return request<PostDetailsResponse>(`/posts/${postId}`, {}, token);
    },
    remove(token: string, postId: string) {
      return request<{ ok: true }>(`/posts/${postId}`, { method: "DELETE" }, token);
    },
    toggleLike(token: string, postId: string) {
      return request<{ post: FeedResponse["items"][number] }>(
        `/posts/${postId}/like`,
        { method: "POST" },
        token,
      );
    },
    comments(token: string, postId: string, cursor?: string | null) {
      const query = cursor ? `?cursor=${cursor}` : "";
      return request<CommentsResponse>(`/posts/${postId}/comments${query}`, {}, token);
    },
    addComment(token: string, postId: string, content: string) {
      return request<{ comment: CommentsResponse["items"][number] }>(
        `/posts/${postId}/comments`,
        {
          method: "POST",
          body: JSON.stringify({ content }),
        },
        token,
      );
    },
    deleteComment(token: string, commentId: string) {
      return request<{ ok: true }>(`/comments/${commentId}`, { method: "DELETE" }, token);
    },
  },
  users: {
    me(token: string) {
      return request<MeResponse>("/users/me", {}, token);
    },
    updateMe(token: string, payload: { displayName: string; bio: string }) {
      return request<MeResponse>(
        "/users/me",
        {
          method: "PATCH",
          body: JSON.stringify(payload),
        },
        token,
      );
    },
    search(token: string, query: string) {
      const suffix = query ? `?q=${encodeURIComponent(query)}` : "";
      return request<SearchUsersResponse>(`/users/search${suffix}`, {}, token);
    },
    profile(token: string, username: string) {
      return request<ProfileResponse>(`/users/${username}`, {}, token);
    },
    posts(token: string, username: string, cursor?: string | null) {
      const suffix = cursor ? `?cursor=${cursor}` : "";
      return request<FeedResponse>(`/users/${username}/posts${suffix}`, {}, token);
    },
    toggleFollow(token: string, username: string) {
      return request<{ profile: ProfileResponse["profile"] }>(
        `/users/${username}/follow`,
        { method: "POST" },
        token,
      );
    },
    followers(token: string, username: string) {
      return request<SearchUsersResponse>(`/users/${username}/followers`, {}, token);
    },
    following(token: string, username: string) {
      return request<SearchUsersResponse>(`/users/${username}/following`, {}, token);
    },
  },
  notifications: {
    list(token: string, cursor?: string | null, filter: "all" | "unread" = "all") {
      const query = new URLSearchParams();
      if (cursor) query.set("cursor", cursor);
      if (filter === "unread") query.set("filter", "unread");
      const suffix = query.toString() ? `?${query.toString()}` : "";
      return request<NotificationsResponse>(`/notifications${suffix}`, {}, token);
    },
    unreadCount(token: string) {
      return request<UnreadCountResponse>("/notifications/unread-count", {}, token);
    },
    markRead(token: string, notificationId: string) {
      return request<{ ok: true }>(
        `/notifications/${notificationId}/read`,
        { method: "PATCH" },
        token,
      );
    },
    markAllRead(token: string) {
      return request<{ ok: true }>("/notifications/mark-all-read", { method: "POST" }, token);
    },
    preferences(token: string) {
      return request<PreferencesResponse>("/notifications/preferences", {}, token);
    },
    updatePreferences(token: string, preferences: NotificationPreferences) {
      return request<PreferencesResponse>(
        "/notifications/preferences",
        {
          method: "PUT",
          body: JSON.stringify(preferences),
        },
        token,
      );
    },
  },
};
