import fs from "node:fs";
import path from "node:path";
import { randomUUID } from "node:crypto";
import { NotificationPreferences, NotificationType, UserSummary } from "@shared/api";

export interface DbUser {
  id: string;
  username: string;
  email: string;
  password: string;
  displayName: string;
  bio: string;
  avatarColor: string;
  createdAt: string;
  // Optional phone number for password reset
  phone?: string;
}

export interface DbPost {
  id: string;
  userId: string;
  content: string;
  createdAt: string;
  updatedAt: string;
  deleted: boolean;
}

export interface DbComment {
  id: string;
  postId: string;
  userId: string;
  content: string;
  createdAt: string;
  deleted: boolean;
}

export interface DbLike {
  id: string;
  postId: string;
  userId: string;
  createdAt: string;
}

export interface DbFollow {
  id: string;
  followerId: string;
  followingId: string;
  createdAt: string;
}

export interface DbNotification {
  id: string;
  recipientId: string;
  senderId: string;
  type: NotificationType;
  message: string;
  postId: string | null;
  isRead: boolean;
  createdAt: string;
}

export interface DbSession {
  token: string;
  userId: string;
  createdAt: string;
}

export interface NotificationEventJob {
  id: string;
  recipientId: string;
  senderId: string;
  type: NotificationType;
  message: string;
  postId: string | null;
  createdAt: string;
}

// New: temporary password reset entry
export interface PasswordReset {
  phone: string;
  code: string;
  expiresAt: string;
}

export interface DatabaseShape {
  users: DbUser[];
  posts: DbPost[];
  comments: DbComment[];
  likes: DbLike[];
  follows: DbFollow[];
  notifications: DbNotification[];
  preferences: Record<string, NotificationPreferences>;
  sessions: DbSession[];
  queue: NotificationEventJob[];
  // Store temporary password reset codes
  passwordResets: PasswordReset[];
}

const DATA_DIR = path.resolve(process.cwd(), "server", "data");
const DB_PATH = path.join(DATA_DIR, "pulse-db.json");
const avatarPalette = ["#d85f3d", "#1f7a8c", "#52734d", "#b36932", "#7458a6", "#a63c52"];

function ensureDataDir() {
  if (!fs.existsSync(DATA_DIR)) {
    fs.mkdirSync(DATA_DIR, { recursive: true });
  }
}

function createDefaultPreferences(): NotificationPreferences {
  return {
    notifyOnLike: true,
    notifyOnComment: true,
    notifyOnFollow: true,
    emailNotifications: false,
    realtimeNotifications: true,
  };
}

function createSeedDatabase(): DatabaseShape {
  const now = new Date();
  const iso = (hoursAgo: number) =>
    new Date(now.getTime() - hoursAgo * 60 * 60 * 1000).toISOString();

  const users: DbUser[] = [
    {
      id: "u1",
      username: "maya",
      email: "maya@pulse.app",
      password: "Pulse123",
      displayName: "Maya Chen",
      bio: "Building thoughtful products and chasing fast feedback loops.",
      avatarColor: "#d85f3d",
      createdAt: iso(120),
    },
    {
      id: "u2",
      username: "rio",
      email: "rio@pulse.app",
      password: "Pulse123",
      displayName: "Rio Alvarez",
      bio: "Design systems, motion studies, and deeply caffeinated mornings.",
      avatarColor: "#1f7a8c",
      createdAt: iso(140),
    },
    {
      id: "u3",
      username: "nina",
      email: "nina@pulse.app",
      password: "Pulse123",
      displayName: "Nina Brooks",
      bio: "Ops-minded engineer who loves tidy pipelines and cleaner dashboards.",
      avatarColor: "#52734d",
      createdAt: iso(168),
    },
    {
      id: "u4",
      username: "saul",
      email: "saul@pulse.app",
      password: "Pulse123",
      displayName: "Saul Okafor",
      bio: "Turning product strategy into launch plans and storytelling.",
      avatarColor: "#7458a6",
      createdAt: iso(200),
    },
  ];

  const posts: DbPost[] = [
    {
      id: "p1",
      userId: "u2",
      content:
        "Quick win from today: swapped a clunky notification drawer for a lighter inline stream and support tickets dropped almost instantly.",
      createdAt: iso(3),
      updatedAt: iso(3),
      deleted: false,
    },
    {
      id: "p2",
      userId: "u3",
      content:
        "A good feed feels obvious only after the hard work. Chronological, fast, mobile-friendly, and no mystery meat ranking.",
      createdAt: iso(6),
      updatedAt: iso(6),
      deleted: false,
    },
    {
      id: "p3",
      userId: "u4",
      content:
        "Planning note: when every interaction becomes an event, the UI starts feeling calm because the heavy lifting has somewhere else to go.",
      createdAt: iso(18),
      updatedAt: iso(18),
      deleted: false,
    },
    {
      id: "p4",
      userId: "u1",
      content:
        "Sketching a new profile layout tonight. Want the numbers to feel clear without making the page feel like an analytics dashboard.",
      createdAt: iso(22),
      updatedAt: iso(22),
      deleted: false,
    },
    {
      id: "p5",
      userId: "u2",
      content:
        "If a settings page saves the moment you click, it has to feel trustworthy. Microcopy matters more than people think.",
      createdAt: iso(32),
      updatedAt: iso(32),
      deleted: false,
    },
  ];

  const comments: DbComment[] = [
    {
      id: "c1",
      postId: "p1",
      userId: "u3",
      content: "That trade-off makes total sense. Speed feels like a feature, not a benchmark.",
      createdAt: iso(2.6),
      deleted: false,
    },
    {
      id: "c2",
      postId: "p4",
      userId: "u2",
      content: "Would love to see that layout once you land on a stat treatment.",
      createdAt: iso(21),
      deleted: false,
    },
  ];

  const likes: DbLike[] = [
    { id: "l1", userId: "u1", postId: "p1", createdAt: iso(2.9) },
    { id: "l2", userId: "u3", postId: "p1", createdAt: iso(2.8) },
    { id: "l3", userId: "u2", postId: "p2", createdAt: iso(5.5) },
    { id: "l4", userId: "u4", postId: "p3", createdAt: iso(17.5) },
  ];

  const follows: DbFollow[] = [
    { id: "f1", followerId: "u1", followingId: "u2", createdAt: iso(96) },
    { id: "f2", followerId: "u1", followingId: "u3", createdAt: iso(96) },
    { id: "f3", followerId: "u2", followingId: "u1", createdAt: iso(90) },
    { id: "f4", followerId: "u4", followingId: "u1", createdAt: iso(82) },
  ];

  const notifications: DbNotification[] = [
    {
      id: "n1",
      recipientId: "u1",
      senderId: "u2",
      type: "comment",
      message: 'Rio commented: "Would love to see that layout once you land on a stat treatment."',
      postId: "p4",
      isRead: false,
      createdAt: iso(21),
    },
    {
      id: "n2",
      recipientId: "u1",
      senderId: "u4",
      type: "follow",
      message: "Saul started following you",
      postId: null,
      isRead: false,
      createdAt: iso(82),
    },
  ];

  const preferences: Record<string, NotificationPreferences> = {};
  users.forEach((user) => {
    preferences[user.id] = createDefaultPreferences();
  });

  return {
    users,
    posts,
    comments,
    likes,
    follows,
    notifications,
    preferences,
    passwordResets: [],
    queue: [],
  };
}

function readDatabase(): DatabaseShape {
  ensureDataDir();

  if (!fs.existsSync(DB_PATH)) {
    const initial = createSeedDatabase();
    fs.writeFileSync(DB_PATH, JSON.stringify(initial, null, 2));
    return initial;
  }

  const raw = fs.readFileSync(DB_PATH, "utf8");
  const parsed = JSON.parse(raw) as DatabaseShape;
  parsed.preferences ||= {};
  parsed.sessions ||= [];
  parsed.queue ||= [];
  parsed.users.forEach((user) => {
    parsed.preferences[user.id] ||= createDefaultPreferences();
  });
  return parsed;
}

export const db = readDatabase();

export function persistDatabase() {
  ensureDataDir();
  fs.writeFileSync(DB_PATH, JSON.stringify(db, null, 2));
}

export function newId(prefix: string) {
  return `${prefix}_${randomUUID().slice(0, 10)}`;
}

export function makeToken() {
  return randomUUID().replace(/-/g, "");
}

export function findUserByToken(token?: string | null) {
  if (!token) return null;
  const session = db.sessions.find((entry) => entry.token === token);
  if (!session) return null;
  return db.users.find((user) => user.id === session.userId) || null;
}

export function getFollowersCount(userId: string) {
  return db.follows.filter((follow) => follow.followingId === userId).length;
}

export function getFollowingCount(userId: string) {
  return db.follows.filter((follow) => follow.followerId === userId).length;
}

export function isFollowing(viewerId: string | null, userId: string) {
  if (!viewerId || viewerId === userId) return false;
  return db.follows.some(
    (follow) => follow.followerId === viewerId && follow.followingId === userId,
  );
}

export function toUserSummary(user: DbUser, viewerId: string | null): UserSummary {
  return {
    id: user.id,
    username: user.username,
    displayName: user.displayName,
    bio: user.bio,
    avatarColor: user.avatarColor,
    createdAt: user.createdAt,
    followersCount: getFollowersCount(user.id),
    followingCount: getFollowingCount(user.id),
    isFollowing: isFollowing(viewerId, user.id),
  };
}

export function pickAvatarColor() {
  return avatarPalette[Math.floor(Math.random() * avatarPalette.length)];
}
