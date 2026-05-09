import "dotenv/config";
import cors from "cors";
import express, { NextFunction, Request, RequestHandler, Response } from "express";
import {
  AuthPayload,
  CommentRecord,
  CommentsResponse,
  FeedResponse,
  MeResponse,
  NotificationEvent,
  NotificationPreferences,
  NotificationRecord,
  NotificationsResponse,
  NotificationType,
  PostDetailsResponse,
  PostRecord,
  PreferencesResponse,
  ProfileResponse,
  SearchUsersResponse,
  SuccessResponse,
  TrendingResponse,
  UnreadCountResponse,
} from "@shared/api";
import {
  DbComment,
  DbNotification,
  DbPost,
  DbUser,
  db,
  findUserByToken,
  getFollowersCount,
  getFollowingCount,
  isFollowing,
  makeToken,
  newId,
  NotificationEventJob,
  persistDatabase,
  pickAvatarColor,
  toUserSummary,
} from "./store";

type AuthedRequest = Request & { user?: DbUser; token?: string };

const API_PREFIX = "/api/v1";
const PAGE_SIZE = 10;
const COMMENT_PAGE_SIZE = 5;
const streams = new Map<string, Set<Response>>();
let workerStarted = false;
let heartbeatStarted = false;

function sanitizeUsername(value: string) {
  return value.trim().toLowerCase().replace(/[^a-z0-9_]/g, "");
}

function parseToken(req: Request) {
  const authHeader = req.headers.authorization;
  if (authHeader?.startsWith("Bearer ")) {
    return authHeader.slice(7);
  }

  const queryToken =
    typeof req.query.token === "string" ? req.query.token : Array.isArray(req.query.token) ? req.query.token[0] : null;
  return queryToken || null;
}

function requireAuth(req: AuthedRequest, res: Response, next: NextFunction) {
  const token = parseToken(req);
  const user = findUserByToken(token);
  if (!user) {
    res.status(401).json({ error: "Authentication required" });
    return;
  }

  req.user = user;
  req.token = token || undefined;
  next();
}

function paginate<T>(items: T[], cursor: string | null | undefined, limit: number) {
  const start = cursor ? Number(cursor) : 0;
  const slice = items.slice(start, start + limit);
  const nextCursor = start + limit < items.length ? String(start + limit) : null;
  return { slice, nextCursor };
}

function serializePost(post: DbPost, viewerId: string | null): PostRecord {
  const author = db.users.find((user) => user.id === post.userId)!;
  const likeCount = db.likes.filter((like) => like.postId === post.id).length;
  const commentCount = db.comments.filter((comment) => comment.postId === post.id && !comment.deleted).length;
  return {
    id: post.id,
    author: toUserSummary(author, viewerId),
    content: post.content,
    createdAt: post.createdAt,
    updatedAt: post.updatedAt,
    likeCount,
    commentCount,
    likedByMe: viewerId ? db.likes.some((like) => like.postId === post.id && like.userId === viewerId) : false,
  };
}

function serializeComment(comment: DbComment, viewerId: string | null): CommentRecord {
  const author = db.users.find((user) => user.id === comment.userId)!;
  return {
    id: comment.id,
    postId: comment.postId,
    author: toUserSummary(author, viewerId),
    content: comment.content,
    createdAt: comment.createdAt,
  };
}

function serializeNotification(notification: DbNotification, viewerId: string): NotificationRecord {
  const sender = db.users.find((user) => user.id === notification.senderId)!;
  return {
    id: notification.id,
    sender: toUserSummary(sender, viewerId),
    type: notification.type,
    message: notification.message,
    postId: notification.postId,
    isRead: notification.isRead,
    createdAt: notification.createdAt,
  };
}

function sendEvent(userId: string, event: NotificationEvent) {
  const connections = streams.get(userId);
  if (!connections?.size) return;
  const payload = `data: ${JSON.stringify(event)}\n\n`;
  connections.forEach((connection) => connection.write(payload));
}

function sendUnreadCount(userId: string) {
  const unreadCount = db.notifications.filter(
    (notification) => notification.recipientId === userId && !notification.isRead,
  ).length;
  sendEvent(userId, { type: "unread_count", unreadCount });
}

function queueNotification(job: Omit<NotificationEventJob, "id" | "createdAt">) {
  if (job.recipientId === job.senderId) return;
  db.queue.push({
    id: newId("job"),
    ...job,
    createdAt: new Date().toISOString(),
  });
  persistDatabase();
}

function shouldPushRealtime(userId: string, type: NotificationType) {
  const preferences = db.preferences[userId];
  if (!preferences?.realtimeNotifications) return false;
  if (type === "like") return preferences.notifyOnLike;
  if (type === "comment") return preferences.notifyOnComment;
  return preferences.notifyOnFollow;
}

function processQueueJob(job: NotificationEventJob) {
  const existing = db.notifications.find((notification) => {
    if (
      notification.recipientId !== job.recipientId ||
      notification.senderId !== job.senderId ||
      notification.type !== job.type
    ) {
      return false;
    }

    if ((notification.postId || null) !== (job.postId || null)) {
      return false;
    }

    return Math.abs(new Date(notification.createdAt).getTime() - Date.now()) < 60 * 60 * 1000;
  });

  if (existing) {
    persistDatabase();
    return;
  }

  const notification: DbNotification = {
    id: newId("n"),
    recipientId: job.recipientId,
    senderId: job.senderId,
    type: job.type,
    message: job.message,
    postId: job.postId,
    isRead: false,
    createdAt: new Date().toISOString(),
  };

  db.notifications.unshift(notification);
  persistDatabase();

  if (shouldPushRealtime(job.recipientId, job.type)) {
    sendEvent(job.recipientId, {
      type: "new_notification",
      notification: serializeNotification(notification, job.recipientId),
    });
    sendUnreadCount(job.recipientId);
  }
}

function startBackgroundServices() {
  if (!workerStarted) {
    workerStarted = true;
    setInterval(() => {
      const next = db.queue.shift();
      if (!next) return;
      processQueueJob(next);
    }, 700);
  }

  if (!heartbeatStarted) {
    heartbeatStarted = true;
    setInterval(() => {
      streams.forEach((connections) => {
        connections.forEach((connection) => connection.write(": heartbeat\n\n"));
      });
    }, 20000);
  }
}

function getFeedPostsForUser(userId: string) {
  const followingIds = new Set(
    db.follows.filter((follow) => follow.followerId === userId).map((follow) => follow.followingId),
  );
  followingIds.add(userId);
  return db.posts
    .filter((post) => !post.deleted && followingIds.has(post.userId))
    .sort((a, b) => +new Date(b.createdAt) - +new Date(a.createdAt));
}

function getUserByUsername(username: string) {
  return db.users.find((user) => user.username === username);
}

function respondWithAuth(res: Response, user: DbUser) {
  const token = makeToken();
  db.sessions = db.sessions.filter((session) => session.userId !== user.id);
  db.sessions.push({
    token,
    userId: user.id,
    createdAt: new Date().toISOString(),
  });
  persistDatabase();
  const payload: AuthPayload = { token, user: toUserSummary(user, user.id) };
  res.json(payload);
}

function makeListResponse<T>(items: T[], cursor: string | null): { items: T[]; nextCursor: string | null } {
  return { items, nextCursor: cursor };
}

export function createServer() {
  startBackgroundServices();

  const app = express();
  app.use(cors());
  app.use(express.json());
  app.use(express.urlencoded({ extended: true }));

  app.get("/health", (_req, res) => {
    res.json({ ok: true, queuedJobs: db.queue.length });
  });

  app.get(`${API_PREFIX}/ping`, (_req, res) => {
    res.json({ message: process.env.PING_MESSAGE ?? "pong" });
  });

  app.post(`${API_PREFIX}/auth/signup`, (req, res) => {
    const username = sanitizeUsername(String(req.body.username || ""));
    const displayName = String(req.body.displayName || "").trim();
    const email = String(req.body.email || "").trim().toLowerCase();
    const password = String(req.body.password || "");

    if (username.length < 3 || displayName.length < 2) {
      res.status(400).json({ error: "Username and display name are required." });
      return;
    }

    if (!email.includes("@")) {
      res.status(400).json({ error: "A valid email address is required." });
      return;
    }

    if (password.length < 8 || !/\d/.test(password)) {
      res.status(400).json({ error: "Password must be at least 8 characters with one number." });
      return;
    }

    if (db.users.some((user) => user.username === username || user.email === email)) {
      res.status(409).json({ error: "That username or email is already in use." });
      return;
    }

    const user: DbUser = {
      id: newId("u"),
      username,
      email,
      password,
      displayName,
      bio: "New to Pulse and tuning my notification strategy.",
      avatarColor: pickAvatarColor(),
      createdAt: new Date().toISOString(),
    };

    db.users.unshift(user);
    db.preferences[user.id] = {
      notifyOnLike: true,
      notifyOnComment: true,
      notifyOnFollow: true,
      emailNotifications: false,
      realtimeNotifications: true,
    };
    persistDatabase();
    respondWithAuth(res, user);
  });

  app.post(`${API_PREFIX}/auth/login`, (req, res) => {
    const email = String(req.body.email || "").trim().toLowerCase();
    const password = String(req.body.password || "");
    const user = db.users.find((entry) => entry.email === email && entry.password === password);
    if (!user) {
      res.status(401).json({ error: "Invalid email or password." });
      return;
    }

    respondWithAuth(res, user);
  });

  app.post(`${API_PREFIX}/auth/logout`, requireAuth, (req: AuthedRequest, res) => {
    db.sessions = db.sessions.filter((session) => session.token !== req.token);
    persistDatabase();
    const payload: SuccessResponse = { ok: true };
    res.json(payload);
  });

  app.get(`${API_PREFIX}/auth/me`, requireAuth, (req: AuthedRequest, res) => {
    const payload: MeResponse = {
      user: toUserSummary(req.user!, req.user!.id),
    };
    res.json(payload);
  });

  app.post(`${API_PREFIX}/auth/password`, requireAuth, (req: AuthedRequest, res) => {
    const currentPassword = String(req.body.currentPassword || "");
    const newPassword = String(req.body.newPassword || "");

    if (req.user!.password !== currentPassword) {
      res.status(400).json({ error: "Current password did not match." });
      return;
    }

    if (newPassword.length < 8 || !/\d/.test(newPassword)) {
      res.status(400).json({ error: "New password must be at least 8 characters with one number." });
      return;
    }

    req.user!.password = newPassword;
    persistDatabase();
    res.json({ ok: true });
  });
import twilio from 'twilio';

// POST /api/v1/auth/request-reset
app.post(`${API_PREFIX}/auth/request-reset`, async (req, res) => {
  const { phone }: RequestPasswordReset = req.body;
  const user = db.users.find((u) => u.phone === phone);
  if (!user) return res.status(404).json({ error: 'Phone not found' });

  const code = Math.floor(100000 + Math.random() * 900000).toString(); // 6‑digit code
  const expiresAt = new Date(Date.now() + 10 * 60 * 1000).toISOString(); // 10 min

  // Remove any existing reset for this phone
  db.passwordResets = db.passwordResets.filter((r) => r.phone !== phone);
  db.passwordResets.push({ phone, code, expiresAt });
  persistDatabase();

  // Send SMS via Twilio
  try {
    const client = twilio(process.env.TWILIO_ACCOUNT_SID, process.env.TWILIO_AUTH_TOKEN);
    await client.messages.create({
      body: `Your Pulse password reset code: ${code}`,
      from: process.env.TWILIO_FROM_NUMBER,
      to: phone,
    });
  } catch (e) {
    console.error('Twilio SMS error', e);
    // Continue – the code is stored even if SMS fails
  }

  res.json({ ok: true } as PasswordResetResponse);
});

// POST /api/v1/auth/verify-reset
app.post(`${API_PREFIX}/auth/verify-reset`, (req, res) => {
  const { phone, code, newPassword }: VerifyPasswordReset = req.body;
  const entry = db.passwordResets.find((r) => r.phone === phone && r.code === code);
  if (!entry) return res.status(400).json({ error: 'Invalid code' });
  if (new Date(entry.expiresAt) < new Date()) return res.status(400).json({ error: 'Code expired' });

  const user = db.users.find((u) => u.phone === phone);
  if (!user) return res.status(404).json({ error: 'User not found' });

  user.password = newPassword; // TODO: hash in production
  // Clean up used reset entry
  db.passwordResets = db.passwordResets.filter((r) => r !== entry);
  persistDatabase();

  res.json({ ok: true } as PasswordResetResponse);
});

  app.get(`${API_PREFIX}/stream/notifications`, requireAuth, (req: AuthedRequest, res) => {
    res.setHeader("Content-Type", "text/event-stream");
    res.setHeader("Cache-Control", "no-cache");
    res.setHeader("Connection", "keep-alive");
    res.flushHeaders();

    const userId = req.user!.id;
    const connectionSet = streams.get(userId) || new Set<Response>();
    connectionSet.add(res);
    streams.set(userId, connectionSet);

    sendUnreadCount(userId);

    req.on("close", () => {
      const connections = streams.get(userId);
      connections?.delete(res);
      if (!connections?.size) {
        streams.delete(userId);
      }
    });
  });

  app.get(`${API_PREFIX}/posts/feed`, requireAuth, (req: AuthedRequest, res) => {
    const cursor = typeof req.query.cursor === "string" ? req.query.cursor : null;
    const posts = getFeedPostsForUser(req.user!.id);
    const { slice, nextCursor } = paginate(posts, cursor, PAGE_SIZE);
    const payload: FeedResponse = makeListResponse(
      slice.map((post) => serializePost(post, req.user!.id)),
      nextCursor,
    );
    res.json(payload);
  });

  app.post(`${API_PREFIX}/posts`, requireAuth, (req: AuthedRequest, res) => {
    const content = String(req.body.content || "").trim();
    if (!content || content.length > 500) {
      res.status(400).json({ error: "Posts must contain between 1 and 500 characters." });
      return;
    }

    const now = new Date().toISOString();
    const post: DbPost = {
      id: newId("p"),
      userId: req.user!.id,
      content,
      createdAt: now,
      updatedAt: now,
      deleted: false,
    };

    db.posts.unshift(post);
    persistDatabase();
    res.status(201).json({ post: serializePost(post, req.user!.id) });
  });

  app.get(`${API_PREFIX}/posts/trending`, requireAuth, (req: AuthedRequest, res) => {
    const items = db.posts
      .filter((post) => !post.deleted)
      .map((post) => ({
        post,
        score: db.likes.filter((like) => like.postId === post.id).length,
      }))
      .sort((a, b) => b.score - a.score || +new Date(b.post.createdAt) - +new Date(a.post.createdAt))
      .slice(0, 6)
      .map((entry) => serializePost(entry.post, req.user!.id));

    const payload: TrendingResponse = { items };
    res.json(payload);
  });

  app.get(`${API_PREFIX}/posts/:id`, requireAuth, (req: AuthedRequest, res) => {
    const post = db.posts.find((entry) => entry.id === req.params.id && !entry.deleted);
    if (!post) {
      res.status(404).json({ error: "Post not found." });
      return;
    }

    const comments = db.comments
      .filter((comment) => comment.postId === post.id && !comment.deleted)
      .sort((a, b) => +new Date(a.createdAt) - +new Date(b.createdAt));

    const { slice, nextCursor } = paginate(comments, null, COMMENT_PAGE_SIZE);
    const payload: PostDetailsResponse = {
      post: serializePost(post, req.user!.id),
      comments: makeListResponse(
        slice.map((comment) => serializeComment(comment, req.user!.id)),
        nextCursor,
      ),
    };
    res.json(payload);
  });

  app.delete(`${API_PREFIX}/posts/:id`, requireAuth, (req: AuthedRequest, res) => {
    const post = db.posts.find((entry) => entry.id === req.params.id && !entry.deleted);
    if (!post || post.userId !== req.user!.id) {
      res.status(404).json({ error: "Post not found." });
      return;
    }

    post.deleted = true;
    db.comments.forEach((comment) => {
      if (comment.postId === post.id) {
        comment.deleted = true;
      }
    });
    db.likes = db.likes.filter((like) => like.postId !== post.id);
    persistDatabase();
    res.json({ ok: true });
  });

  app.post(`${API_PREFIX}/posts/:id/like`, requireAuth, (req: AuthedRequest, res) => {
    const post = db.posts.find((entry) => entry.id === req.params.id && !entry.deleted);
    if (!post) {
      res.status(404).json({ error: "Post not found." });
      return;
    }

    if (post.userId === req.user!.id) {
      res.status(400).json({ error: "You cannot like your own post." });
      return;
    }

    const existing = db.likes.find((like) => like.postId === post.id && like.userId === req.user!.id);
    if (existing) {
      db.likes = db.likes.filter((like) => like.id !== existing.id);
      persistDatabase();
      res.json({ post: serializePost(post, req.user!.id) });
      return;
    }

    db.likes.push({
      id: newId("l"),
      userId: req.user!.id,
      postId: post.id,
      createdAt: new Date().toISOString(),
    });
    persistDatabase();

    queueNotification({
      recipientId: post.userId,
      senderId: req.user!.id,
      type: "like",
      message: `${req.user!.displayName} liked your post`,
      postId: post.id,
    });

    res.json({ post: serializePost(post, req.user!.id) });
  });

  app.get(`${API_PREFIX}/posts/:id/comments`, requireAuth, (req: AuthedRequest, res) => {
    const post = db.posts.find((entry) => entry.id === req.params.id && !entry.deleted);
    if (!post) {
      res.status(404).json({ error: "Post not found." });
      return;
    }

    const cursor = typeof req.query.cursor === "string" ? req.query.cursor : null;
    const comments = db.comments
      .filter((comment) => comment.postId === post.id && !comment.deleted)
      .sort((a, b) => +new Date(a.createdAt) - +new Date(b.createdAt));
    const { slice, nextCursor } = paginate(comments, cursor, COMMENT_PAGE_SIZE);
    const payload: CommentsResponse = makeListResponse(
      slice.map((comment) => serializeComment(comment, req.user!.id)),
      nextCursor,
    );
    res.json(payload);
  });

  app.post(`${API_PREFIX}/posts/:id/comments`, requireAuth, (req: AuthedRequest, res) => {
    const post = db.posts.find((entry) => entry.id === req.params.id && !entry.deleted);
    const content = String(req.body.content || "").trim();
    if (!post) {
      res.status(404).json({ error: "Post not found." });
      return;
    }

    if (!content || content.length > 300) {
      res.status(400).json({ error: "Comments must contain between 1 and 300 characters." });
      return;
    }

    const comment: DbComment = {
      id: newId("c"),
      postId: post.id,
      userId: req.user!.id,
      content,
      createdAt: new Date().toISOString(),
      deleted: false,
    };

    db.comments.push(comment);
    persistDatabase();

    queueNotification({
      recipientId: post.userId,
      senderId: req.user!.id,
      type: "comment",
      message: `${req.user!.displayName} commented: "${content.slice(0, 48)}${content.length > 48 ? "..." : ""}"`,
      postId: post.id,
    });

    res.status(201).json({ comment: serializeComment(comment, req.user!.id) });
  });

  app.delete(`${API_PREFIX}/comments/:id`, requireAuth, (req: AuthedRequest, res) => {
    const comment = db.comments.find((entry) => entry.id === req.params.id && !entry.deleted);
    if (!comment || comment.userId !== req.user!.id) {
      res.status(404).json({ error: "Comment not found." });
      return;
    }

    comment.deleted = true;
    persistDatabase();
    res.json({ ok: true });
  });

  app.get(`${API_PREFIX}/users/me`, requireAuth, (req: AuthedRequest, res) => {
    const payload: MeResponse = { user: toUserSummary(req.user!, req.user!.id) };
    res.json(payload);
  });

  app.patch(`${API_PREFIX}/users/me`, requireAuth, (req: AuthedRequest, res) => {
    const displayName = String(req.body.displayName || "").trim();
    const bio = String(req.body.bio || "").trim();

    if (displayName.length < 2 || bio.length > 160) {
      res.status(400).json({ error: "Display name or bio is invalid." });
      return;
    }

    req.user!.displayName = displayName;
    req.user!.bio = bio;
    persistDatabase();
    res.json({ user: toUserSummary(req.user!, req.user!.id) });
  });

  app.get(`${API_PREFIX}/users/search`, requireAuth, (req: AuthedRequest, res) => {
    const query = String(req.query.q || "").trim().toLowerCase();
    const base = db.users.filter((user) => user.id !== req.user!.id);
    const items = (query.length >= 2
      ? base.filter(
          (user) =>
            user.username.toLowerCase().includes(query) ||
            user.displayName.toLowerCase().includes(query),
        )
      : base.filter((user) => !isFollowing(req.user!.id, user.id)))
      .slice(0, 8)
      .map((user) => toUserSummary(user, req.user!.id));

    const payload: SearchUsersResponse = { items };
    res.json(payload);
  });

  app.get(`${API_PREFIX}/users/:username`, requireAuth, (req: AuthedRequest, res) => {
    const profileUser = getUserByUsername(req.params.username);
    if (!profileUser) {
      res.status(404).json({ error: "User not found." });
      return;
    }

    const posts = db.posts
      .filter((post) => post.userId === profileUser.id && !post.deleted)
      .sort((a, b) => +new Date(b.createdAt) - +new Date(a.createdAt));
    const { slice, nextCursor } = paginate(posts, null, PAGE_SIZE);
    const payload: ProfileResponse = {
      profile: toUserSummary(profileUser, req.user!.id),
      posts: makeListResponse(
        slice.map((post) => serializePost(post, req.user!.id)),
        nextCursor,
      ),
    };
    res.json(payload);
  });

  app.get(`${API_PREFIX}/users/:username/posts`, requireAuth, (req: AuthedRequest, res) => {
    const profileUser = getUserByUsername(req.params.username);
    if (!profileUser) {
      res.status(404).json({ error: "User not found." });
      return;
    }

    const cursor = typeof req.query.cursor === "string" ? req.query.cursor : null;
    const posts = db.posts
      .filter((post) => post.userId === profileUser.id && !post.deleted)
      .sort((a, b) => +new Date(b.createdAt) - +new Date(a.createdAt));
    const { slice, nextCursor } = paginate(posts, cursor, PAGE_SIZE);
    const payload: FeedResponse = makeListResponse(
      slice.map((post) => serializePost(post, req.user!.id)),
      nextCursor,
    );
    res.json(payload);
  });

  app.post(`${API_PREFIX}/users/:username/follow`, requireAuth, (req: AuthedRequest, res) => {
    const targetUser = getUserByUsername(req.params.username);
    if (!targetUser || targetUser.id === req.user!.id) {
      res.status(400).json({ error: "Unable to follow this user." });
      return;
    }

    const existing = db.follows.find(
      (follow) => follow.followerId === req.user!.id && follow.followingId === targetUser.id,
    );

    if (existing) {
      db.follows = db.follows.filter((follow) => follow.id !== existing.id);
      persistDatabase();
      res.json({ profile: toUserSummary(targetUser, req.user!.id) });
      return;
    }

    db.follows.push({
      id: newId("f"),
      followerId: req.user!.id,
      followingId: targetUser.id,
      createdAt: new Date().toISOString(),
    });
    persistDatabase();

    queueNotification({
      recipientId: targetUser.id,
      senderId: req.user!.id,
      type: "follow",
      message: `${req.user!.displayName} started following you`,
      postId: null,
    });

    res.json({ profile: toUserSummary(targetUser, req.user!.id) });
  });

  app.get(`${API_PREFIX}/users/:username/followers`, requireAuth, (req: AuthedRequest, res) => {
    const targetUser = getUserByUsername(req.params.username);
    if (!targetUser) {
      res.status(404).json({ error: "User not found." });
      return;
    }

    const items = db.follows
      .filter((follow) => follow.followingId === targetUser.id)
      .map((follow) => db.users.find((user) => user.id === follow.followerId)!)
      .map((user) => toUserSummary(user, req.user!.id));
    res.json({ items });
  });

  app.get(`${API_PREFIX}/users/:username/following`, requireAuth, (req: AuthedRequest, res) => {
    const targetUser = getUserByUsername(req.params.username);
    if (!targetUser) {
      res.status(404).json({ error: "User not found." });
      return;
    }

    const items = db.follows
      .filter((follow) => follow.followerId === targetUser.id)
      .map((follow) => db.users.find((user) => user.id === follow.followingId)!)
      .map((user) => toUserSummary(user, req.user!.id));
    res.json({ items });
  });

  app.get(`${API_PREFIX}/notifications`, requireAuth, (req: AuthedRequest, res) => {
    const cursor = typeof req.query.cursor === "string" ? req.query.cursor : null;
    const filter = req.query.filter === "unread" ? "unread" : "all";
    const notifications = db.notifications
      .filter((notification) => notification.recipientId === req.user!.id)
      .filter((notification) => (filter === "unread" ? !notification.isRead : true))
      .sort((a, b) => +new Date(b.createdAt) - +new Date(a.createdAt));
    const { slice, nextCursor } = paginate(notifications, cursor, PAGE_SIZE);
    const payload: NotificationsResponse = makeListResponse(
      slice.map((notification) => serializeNotification(notification, req.user!.id)),
      nextCursor,
    );
    res.json(payload);
  });

  app.get(`${API_PREFIX}/notifications/unread-count`, requireAuth, (req: AuthedRequest, res) => {
    const payload: UnreadCountResponse = {
      unreadCount: db.notifications.filter(
        (notification) => notification.recipientId === req.user!.id && !notification.isRead,
      ).length,
    };
    res.json(payload);
  });

  app.patch(`${API_PREFIX}/notifications/:id/read`, requireAuth, (req: AuthedRequest, res) => {
    const notification = db.notifications.find(
      (entry) => entry.id === req.params.id && entry.recipientId === req.user!.id,
    );
    if (!notification) {
      res.status(404).json({ error: "Notification not found." });
      return;
    }

    notification.isRead = true;
    persistDatabase();
    sendUnreadCount(req.user!.id);
    res.json({ ok: true });
  });

  app.post(`${API_PREFIX}/notifications/mark-all-read`, requireAuth, (req: AuthedRequest, res) => {
    db.notifications.forEach((notification) => {
      if (notification.recipientId === req.user!.id) {
        notification.isRead = true;
      }
    });
    persistDatabase();
    sendUnreadCount(req.user!.id);
    res.json({ ok: true });
  });

  app.get(`${API_PREFIX}/notifications/preferences`, requireAuth, (req: AuthedRequest, res) => {
    const payload: PreferencesResponse = {
      preferences: db.preferences[req.user!.id],
    };
    res.json(payload);
  });

  app.put(`${API_PREFIX}/notifications/preferences`, requireAuth, (req: AuthedRequest, res) => {
    const incoming = req.body as NotificationPreferences;
    db.preferences[req.user!.id] = {
      notifyOnLike: Boolean(incoming.notifyOnLike),
      notifyOnComment: Boolean(incoming.notifyOnComment),
      notifyOnFollow: Boolean(incoming.notifyOnFollow),
      emailNotifications: Boolean(incoming.emailNotifications),
      realtimeNotifications: Boolean(incoming.realtimeNotifications),
    };
    persistDatabase();
    const payload: PreferencesResponse = { preferences: db.preferences[req.user!.id] };
    res.json(payload);
  });

  return app;
}
