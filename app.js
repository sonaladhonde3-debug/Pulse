const STORAGE_KEY = "pulse-webapp-state-v2";
const FEED_PAGE_SIZE = 4;
const COMMENT_PAGE_SIZE = 5;

const seedData = {
  session: {
    currentUserId: null,
    route: "/login",
  },
  users: [
    {
      id: "u1",
      username: "maya",
      email: "maya@pulse.app",
      password: "Pulse123",
      displayName: "Maya Chen",
      bio: "Building thoughtful products and chasing fast feedback loops.",
      avatarColor: "#d85f3d",
      createdAt: "2026-04-10T08:20:00.000Z",
    },
    {
      id: "u2",
      username: "rio",
      email: "rio@pulse.app",
      password: "Pulse123",
      displayName: "Rio Alvarez",
      bio: "Design systems, motion studies, and deeply caffeinated mornings.",
      avatarColor: "#1f7a8c",
      createdAt: "2026-04-08T10:10:00.000Z",
    },
    {
      id: "u3",
      username: "nina",
      email: "nina@pulse.app",
      password: "Pulse123",
      displayName: "Nina Brooks",
      bio: "Ops-minded engineer who loves tidy pipelines and cleaner dashboards.",
      avatarColor: "#4e7d4c",
      createdAt: "2026-04-05T12:45:00.000Z",
    },
    {
      id: "u4",
      username: "saul",
      email: "saul@pulse.app",
      password: "Pulse123",
      displayName: "Saul Okafor",
      bio: "Turning product strategy into launch plans and storytelling.",
      avatarColor: "#7b5ea7",
      createdAt: "2026-04-03T16:00:00.000Z",
    },
  ],
  posts: [
    {
      id: "p1",
      userId: "u2",
      content:
        "Quick win from today: swapped a clunky notification drawer for a lighter inline stream and support tickets dropped almost instantly.",
      createdAt: "2026-04-18T12:00:00.000Z",
      deleted: false,
    },
    {
      id: "p2",
      userId: "u3",
      content:
        "A good feed feels obvious only after the hard work. Chronological, fast, mobile-friendly, and no mystery meat ranking.",
      createdAt: "2026-04-18T09:10:00.000Z",
      deleted: false,
    },
    {
      id: "p3",
      userId: "u4",
      content:
        "Planning note: when every interaction becomes an event, the UI starts feeling calm because the heavy lifting has somewhere else to go.",
      createdAt: "2026-04-17T17:55:00.000Z",
      deleted: false,
    },
    {
      id: "p4",
      userId: "u1",
      content:
        "Sketching a new profile layout tonight. Want the numbers to feel clear without making the page feel like an analytics dashboard.",
      createdAt: "2026-04-17T14:30:00.000Z",
      deleted: false,
    },
    {
      id: "p5",
      userId: "u2",
      content:
        "If a settings page saves the moment you click, it has to feel trustworthy. Microcopy matters more than people think.",
      createdAt: "2026-04-16T12:45:00.000Z",
      deleted: false,
    },
    {
      id: "p6",
      userId: "u3",
      content:
        "Redis and websockets are a classic combo, but the user only cares that the bell count changes before their coffee gets cold.",
      createdAt: "2026-04-16T08:15:00.000Z",
      deleted: false,
    },
  ],
  likes: [
    { id: "l1", userId: "u1", postId: "p1", createdAt: "2026-04-18T12:10:00.000Z" },
    { id: "l2", userId: "u3", postId: "p1", createdAt: "2026-04-18T12:20:00.000Z" },
    { id: "l3", userId: "u2", postId: "p2", createdAt: "2026-04-18T09:30:00.000Z" },
    { id: "l4", userId: "u4", postId: "p3", createdAt: "2026-04-17T18:00:00.000Z" },
  ],
  comments: [
    {
      id: "c1",
      postId: "p1",
      userId: "u3",
      content: "That trade-off makes total sense. Speed feels like a feature, not a benchmark.",
      createdAt: "2026-04-18T12:32:00.000Z",
      deleted: false,
    },
    {
      id: "c2",
      postId: "p4",
      userId: "u2",
      content: "Would love to see that layout once you land on a stat treatment.",
      createdAt: "2026-04-17T16:40:00.000Z",
      deleted: false,
    },
  ],
  follows: [
    { id: "f1", followerId: "u1", followingId: "u2", createdAt: "2026-04-12T10:00:00.000Z" },
    { id: "f2", followerId: "u1", followingId: "u3", createdAt: "2026-04-12T10:01:00.000Z" },
    { id: "f3", followerId: "u2", followingId: "u1", createdAt: "2026-04-12T10:30:00.000Z" },
    { id: "f4", followerId: "u4", followingId: "u1", createdAt: "2026-04-13T12:00:00.000Z" },
  ],
  notifications: [
    {
      id: "n1",
      recipientId: "u1",
      senderId: "u2",
      type: "comment",
      message: 'Rio commented: "Would love to see that layout once you land on a stat treatment."',
      postId: "p4",
      isRead: false,
      createdAt: "2026-04-17T16:40:00.000Z",
    },
    {
      id: "n2",
      recipientId: "u1",
      senderId: "u4",
      type: "follow",
      message: "Saul started following you",
      postId: null,
      isRead: false,
      createdAt: "2026-04-13T12:00:00.000Z",
    },
  ],
  preferences: {
    u1: {
      notifyOnLike: true,
      notifyOnComment: true,
      notifyOnFollow: true,
      emailNotifications: false,
      realtimeNotifications: true,
    },
  },
  ui: {
    feedVisible: FEED_PAGE_SIZE,
    notificationsFilter: "all",
    notificationsVisible: 8,
    searchQuery: "",
    commentsOpen: [],
  },
};

let state = loadState();
let simulationTimer = null;
let feedObserver = null;
let notificationsObserver = null;

const pageEl = document.getElementById("page");
const topbarEl = document.getElementById("topbar");
const toastStackEl = document.getElementById("toast-stack");

boot();

function boot() {
  ensureDefaultPreferences();
  bindWindowEvents();
  render();
  startRealtimeSimulation();
}

function bindWindowEvents() {
  window.addEventListener("hashchange", handleHashRoute);
}

function handleHashRoute() {
  const route = getRouteFromHash();
  state.session.route = route;
  saveState();
  render();
}

function loadState() {
  const stored = localStorage.getItem(STORAGE_KEY);
  if (!stored) {
    return structuredClone(seedData);
  }

  try {
    const parsed = JSON.parse(stored);
    return mergeState(structuredClone(seedData), parsed);
  } catch (error) {
    return structuredClone(seedData);
  }
}

function mergeState(base, incoming) {
  if (Array.isArray(base)) {
    return Array.isArray(incoming) ? incoming : base;
  }

  if (base && typeof base === "object") {
    const result = { ...base };
    Object.keys(incoming || {}).forEach((key) => {
      result[key] = key in base ? mergeState(base[key], incoming[key]) : incoming[key];
    });
    return result;
  }

  return incoming ?? base;
}

function saveState() {
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(state));
  } catch (error) {
    console.error("Failed to save state to localStorage:", error);
    if (error.name === 'QuotaExceededError') {
      notifyToast("Storage Full", "You have exceeded local storage limits. Please use smaller photos or clear browser data.");
    }
  }
}

function persistAndRender() {
  saveState();
  render();
}

function ensureDefaultPreferences() {
  state.users.forEach((user) => {
    if (!state.preferences[user.id]) {
      state.preferences[user.id] = {
        notifyOnLike: true,
        notifyOnComment: true,
        notifyOnFollow: true,
        emailNotifications: false,
        realtimeNotifications: true,
      };
    }
  });
  saveState();
}

function render() {
  if (!location.hash) {
    location.hash = state.session.route || "#/feed";
    return;
  }

  const route = getRouteFromHash();
  state.session.route = route;
  renderTopbar(route);
  renderPage(route);
  saveState();
}

function getRouteFromHash() {
  return location.hash.replace(/^#/, "") || state.session.route || "/feed";
}

function isAuthed() {
  return Boolean(state.session.currentUserId);
}

function currentUser() {
  return state.users.find((user) => user.id === state.session.currentUserId) || null;
}

function renderTopbar(route) {
  if (!isAuthed()) {
    topbarEl.innerHTML = `
      <div class="topbar-inner">
        <a class="brand" href="#/login">
          <div class="brand-badge">P</div>
          <div class="brand-copy">
            <h1>Pulse</h1>
            <p>Live social architecture</p>
          </div>
        </a>
      </div>
    `;
    return;
  }

  const me = currentUser();
  const unread = getUnreadNotifications(me.id).length;

  topbarEl.innerHTML = `
    <div class="topbar-inner">
      <a class="brand" href="#/feed">
        <div class="brand-badge">P</div>
        <div class="brand-copy">
          <h1>Pulse</h1>
          <p>Event-driven social flow</p>
        </div>
      </a>

      <nav class="nav-links" aria-label="Main navigation">
        ${navLink("/feed", "Feed", route)}
        ${navLink("/explore", "Explore", route)}
        ${navLink(`/profile/${me.username}`, "Profile", route)}
        ${navLink("/settings", "Settings", route)}
      </nav>

      <div class="nav-actions">
        <a href="#/notifications" class="nav-action ${route.startsWith('/notifications') ? 'active' : ''}" style="display: flex; align-items: center; justify-content: center; width: 42px; height: 42px; position: relative; padding: 0; border-radius: 50%;">
          <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M6 8a6 6 0 0 1 12 0c0 7 3 9 3 9H3s3-2 3-9"/><path d="M10.3 21a1.94 1.94 0 0 0 3.4 0"/></svg>
          ${unread ? `<span class="pill-count" style="position: absolute; top: -2px; right: -2px; padding: 0; width: 18px; height: 18px; font-size: 0.7rem; display: grid; place-items: center;">${unread}</span>` : ""}
        </a>
        <div class="nav-user" style="border: none; background: transparent; padding: 0;">
          ${avatarMarkup(me, "small")}
        </div>
        <button class="nav-action" id="logout-button" type="button">Logout</button>
      </div>
    </div>
  `;

  document.getElementById("logout-button").addEventListener("click", logout);
}

function navLink(path, label, route) {
  const active = route.startsWith(path) ? "active" : "";
  return `<a class="nav-link ${active}" href="#${path}">${label}</a>`;
}

function renderPage(route) {
  if (!isAuthed() && !["/login", "/signup"].some((publicRoute) => route.startsWith(publicRoute))) {
    location.hash = "#/login";
    return;
  }

  if (route.startsWith("/login")) {
    renderLogin();
    return;
  }

  if (route.startsWith("/signup")) {
    renderSignup();
    return;
  }

  if (route.startsWith("/feed")) {
    renderFeed();
    return;
  }

  if (route.startsWith("/profile/")) {
    renderProfile(route.split("/")[2]);
    return;
  }

  if (route.startsWith("/notifications")) {
    renderNotifications();
    return;
  }

  if (route.startsWith("/settings")) {
    renderSettings();
    return;
  }

  if (route.startsWith("/explore")) {
    renderExplore();
    return;
  }

  if (route.startsWith("/post/")) {
    renderPostDetail(route.split("/")[2]);
    return;
  }

  location.hash = "#/feed";
}

function renderLogin() {
  const shell = cloneAuthShell();
  shell.querySelector(".auth-card").innerHTML = `
    <section class="auth-panel" style="background: rgba(255,255,255,0.1); backdrop-filter: blur(24px); -webkit-backdrop-filter: blur(24px); border: 1px solid rgba(255,255,255,0.2); border-radius: 40px; color: white; box-shadow: 0 8px 32px 0 rgba(0,0,0,0.3); padding: 32px; text-align: center;">
      


      <h2 style="margin: 0; font-size: 28px; font-weight: bold; text-shadow: 0 2px 4px rgba(0,0,0,0.3); color: white;">Welcome Back</h2>
      <p style="color: rgba(255,255,255,0.8); margin: 6px 0 24px; font-size: 15px;">"Sign in to your Pulse feed"</p>
      
      <form class="form-grid" id="login-form" style="display: flex; flex-direction: column; gap: 14px; margin-top: 0;">
        <input id="login-email" name="email" type="email" placeholder="Email Address" value="maya@pulse.app" required style="width: 100%; height: 56px; border-radius: 20px; background: rgba(255,255,255,0.1); border: 1px solid rgba(255,255,255,0.2); color: white; padding: 0 16px; font-size: 16px; box-shadow: 0 4px 6px rgba(0,0,0,0.1);" />
        <input id="login-password" name="password" type="password" placeholder="Password" value="Pulse123" required style="width: 100%; height: 56px; border-radius: 20px; background: rgba(255,255,255,0.1); border: 1px solid rgba(255,255,255,0.2); color: white; padding: 0 16px; font-size: 16px; box-shadow: 0 4px 6px rgba(0,0,0,0.1);" />
        
        <div style="display: grid; grid-template-columns: 1fr 1fr; gap: 12px; margin-top: 4px;">
          <div style="height: 48px; border-radius: 20px; background: rgba(255,255,255,0.1); border: 1px solid rgba(255,255,255,0.2); color: white; display: flex; align-items: center; justify-content: center; font-size: 14px; cursor: pointer; transition: all 0.2s;">Forgot Password</div>
          <a href="#/signup" style="height: 48px; border-radius: 20px; background: rgba(255,255,255,0.1); border: 1px solid rgba(255,255,255,0.2); color: white; display: flex; align-items: center; justify-content: center; font-size: 14px; text-decoration: none; transition: all 0.2s;">Sign Up</a>
        </div>

        <button type="submit" style="margin-top: 16px; width: 100%; height: 56px; border-radius: 999px; background: white; color: #14213d; font-size: 16px; font-weight: bold; border: none; cursor: pointer; display: flex; align-items: center; justify-content: center; gap: 8px; box-shadow: 0 8px 16px rgba(0,0,0,0.15); transition: transform 0.2s;">
          <svg xmlns="http://www.w3.org/2000/svg" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><line x1="22" y1="2" x2="11" y2="13"></line><polygon points="22 2 15 22 11 13 2 9 22 2"></polygon></svg>
          Log in
        </button>
      </form>
    </section>
  `;
  pageEl.replaceChildren(shell);

  document.getElementById("login-form").addEventListener("submit", (event) => {
    event.preventDefault();
    const form = new FormData(event.currentTarget);
    const email = form.get("email").toString().trim().toLowerCase();
    
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(email)) {
      notifyToast("Invalid Email", "Please enter a legitimate email address with a domain (e.g. .com).");
      return;
    }

    const password = form.get("password").toString();
    const user = state.users.find((entry) => entry.email.toLowerCase() === email && entry.password === password);

    if (!user) {
      notifyToast("Login failed", "Try the seeded account `maya@pulse.app / Pulse123` or create a new user.");
      return;
    }

    state.session.currentUserId = user.id;
    state.ui.feedVisible = FEED_PAGE_SIZE;
    location.hash = "#/feed";
    persistAndRender();
  });
}

function renderSignup() {
  const shell = cloneAuthShell();
  shell.querySelector(".auth-card").innerHTML = `
    <section class="auth-panel" style="background: rgba(255,255,255,0.1); backdrop-filter: blur(24px); -webkit-backdrop-filter: blur(24px); border: 1px solid rgba(255,255,255,0.2); border-radius: 40px; color: white; box-shadow: 0 8px 32px 0 rgba(0,0,0,0.3); padding: 32px; text-align: center;">
      


      <h2 style="margin: 0; font-size: 28px; font-weight: bold; text-shadow: 0 2px 4px rgba(0,0,0,0.3); color: white;">Create Account</h2>
      <p style="color: rgba(255,255,255,0.8); margin: 6px 0 24px; font-size: 15px;">"Join Pulse to start your experience"</p>
      
      <form class="form-grid" id="signup-form" style="display: flex; flex-direction: column; gap: 14px; margin-top: 0;">
        <input id="signup-username" name="username" type="text" maxlength="18" placeholder="Username" required style="width: 100%; height: 56px; border-radius: 20px; background: rgba(255,255,255,0.1); border: 1px solid rgba(255,255,255,0.2); color: white; padding: 0 16px; font-size: 16px; box-shadow: 0 4px 6px rgba(0,0,0,0.1);" />
        <input id="signup-display-name" name="displayName" type="text" maxlength="40" placeholder="Display name" required style="width: 100%; height: 56px; border-radius: 20px; background: rgba(255,255,255,0.1); border: 1px solid rgba(255,255,255,0.2); color: white; padding: 0 16px; font-size: 16px; box-shadow: 0 4px 6px rgba(0,0,0,0.1);" />
        <input id="signup-email" name="email" type="email" placeholder="Email Address" required style="width: 100%; height: 56px; border-radius: 20px; background: rgba(255,255,255,0.1); border: 1px solid rgba(255,255,255,0.2); color: white; padding: 0 16px; font-size: 16px; box-shadow: 0 4px 6px rgba(0,0,0,0.1);" />
        <input id="signup-password" name="password" type="password" minlength="8" placeholder="Password" required style="width: 100%; height: 56px; border-radius: 20px; background: rgba(255,255,255,0.1); border: 1px solid rgba(255,255,255,0.2); color: white; padding: 0 16px; font-size: 16px; box-shadow: 0 4px 6px rgba(0,0,0,0.1);" />
        
        <button type="submit" style="margin-top: 16px; width: 100%; height: 56px; border-radius: 999px; background: white; color: #14213d; font-size: 16px; font-weight: bold; border: none; cursor: pointer; display: flex; align-items: center; justify-content: center; gap: 8px; box-shadow: 0 8px 16px rgba(0,0,0,0.15); transition: transform 0.2s;">
          <svg xmlns="http://www.w3.org/2000/svg" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><line x1="22" y1="2" x2="11" y2="13"></line><polygon points="22 2 15 22 11 13 2 9 22 2"></polygon></svg>
          Create account
        </button>
        
        <div style="padding-top: 8px; text-align: center;">
          <span style="font-size: 14px; font-weight: 500; color: rgba(255,255,255,0.8);">Already have an account? </span>
          <a href="#/login" style="font-size: 14px; font-weight: 600; color: white; text-decoration: none;">Log in</a>
        </div>
      </form>
    </section>
  `;
  pageEl.replaceChildren(shell);

  document.getElementById("signup-form").addEventListener("submit", (event) => {
    event.preventDefault();
    const form = new FormData(event.currentTarget);
    const username = sanitizeUsername(form.get("username").toString());
    const displayName = form.get("displayName").toString().trim();
    const email = form.get("email").toString().trim().toLowerCase();

    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(email)) {
      notifyToast("Invalid Email", "Please enter a legitimate email address with a domain (e.g. .com).");
      return;
    }

    const password = form.get("password").toString();

    if (username.length < 3) {
      notifyToast("Username too short", "Pick at least 3 lowercase letters or numbers.");
      return;
    }

    if (!/\d/.test(password) || password.length < 8) {
      notifyToast("Password too weak", "Use at least 8 characters and include one number.");
      return;
    }

    if (state.users.some((user) => user.username === username || user.email.toLowerCase() === email)) {
      notifyToast("Account already exists", "That username or email is already in use.");
      return;
    }

    const user = {
      id: createId("u"),
      username,
      email,
      password,
      displayName,
      bio: "New to Pulse and tuning my notification strategy.",
      avatarColor: pickAvatarColor(),
      createdAt: new Date().toISOString(),
    };

    state.users.unshift(user);
    state.preferences[user.id] = {
      notifyOnLike: true,
      notifyOnComment: true,
      notifyOnFollow: true,
      emailNotifications: false,
      realtimeNotifications: true,
    };
    state.session.currentUserId = user.id;
    persistAndRender();
    location.hash = "#/feed";
  });
}

function renderFeed() {
  const me = currentUser();
  const visiblePosts = getFeedPosts(me.id).slice(0, state.ui.feedVisible);
  const suggestions = getSuggestedUsers(me.id, 3);

  pageEl.innerHTML = `
    <section class="app-grid">
      <div class="stack">
        <section class="panel compose">
          <div class="section-heading">
            <div>
              <p class="eyebrow">Main feed</p>
              <h2>Share an update</h2>
            </div>
            <span class="helper">Text and photo posts. 500 chars max.</span>
          </div>
          <form id="compose-form">
            <textarea id="compose-content" name="content" placeholder="What are you building, learning, or shipping today?" maxlength="500"></textarea>
            <div id="compose-image-preview" class="compose-image-preview"></div>
            <div class="compose-footer" style="display: flex; align-items: center; justify-content: space-between; gap: 12px; margin-top: 12px;">
              <div style="display: flex; align-items: center; gap: 12px;">
                <input type="file" id="compose-photo-input" accept="image/*" multiple style="display: none;" />
                <button type="button" class="compose-photo-btn" id="compose-photo-btn" aria-label="Attach photos">
                  <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><rect width="18" height="18" x="3" y="3" rx="2" ry="2"/><circle cx="9" cy="9" r="2"/><path d="m21 15-3.086-3.086a2 2 0 0 0-2.828 0L6 21"/></svg>
                </button>
                <span class="char-counter" id="compose-counter">0 / 500</span>
              </div>
              <button class="primary-button" type="submit">Publish post</button>
            </div>
          </form>
        </section>

        <section class="stack" id="feed-list">
          ${visiblePosts.length ? visiblePosts.map((post) => renderPostCard(post, { allowExpand: true })).join("") : renderFeedEmptyState(suggestions)}
        </section>
        <div id="feed-sentinel"></div>
      </div>

      <aside class="stack">
        <section class="panel">
          <div class="section-heading">
            <div>
              <p class="eyebrow">Realtime overview</p>
              <h2>Your system pulse</h2>
            </div>
          </div>
          <div class="metric-row">
            <article class="metric">
              <span class="helper">Unread notifications</span>
              <strong>${getUnreadNotifications(me.id).length}</strong>
            </article>
            <article class="metric">
              <span class="helper">Posts in feed</span>
              <strong>${getFeedPosts(me.id).length}</strong>
            </article>
            <article class="metric">
              <span class="helper">Following</span>
              <strong>${getFollowing(me.id).length}</strong>
            </article>
          </div>
        </section>

        <section class="panel">
          <div class="section-heading">
            <div>
              <p class="eyebrow">Who to follow</p>
              <h2>Expand your timeline</h2>
            </div>
          </div>
          <div class="user-list">
            ${suggestions.map((user) => renderExploreUser(user)).join("") || `<div class="empty-state"><span>You're already following everyone in this demo.</span></div>`}
          </div>
        </section>

        <section class="panel">
          <div class="section-heading">
            <div>
              <p class="eyebrow">Simulation</p>
              <h2>Trigger inbound events</h2>
            </div>
          </div>
          <p class="muted">Fire a fake event to see the bell badge, toasts, and notification list update instantly.</p>
          <div class="action-row" style="margin-top:14px;">
            <button class="secondary-button" data-simulate="like" type="button">Simulate like</button>
            <button class="secondary-button" data-simulate="comment" type="button">Simulate comment</button>
            <button class="secondary-button" data-simulate="follow" type="button">Simulate follow</button>
          </div>
        </section>
      </aside>
    </section>
  `;

  bindComposeForm();
  bindPostInteractions();
  bindFollowButtons();
  bindSimulationButtons();
  bindInfiniteFeed();
}

function renderFeedEmptyState(suggestions) {
  return `
    <div class="empty-state">
      <div>
        <strong>Your feed is quiet right now.</strong>
        <div class="list-subtle">Follow a few people to start building your timeline.</div>
      </div>
      <div class="action-row">
        ${suggestions.slice(0, 2).map((user) => `<button class="secondary-button" data-follow-user="${user.username}" type="button">Follow @${escapeHtml(user.username)}</button>`).join("")}
      </div>
    </div>
  `;
}

function renderProfile(username) {
  const profile = state.users.find((user) => user.username === username);
  if (!profile) {
    pageEl.innerHTML = `<section class="panel"><h2>Profile not found</h2></section>`;
    return;
  }

  const me = currentUser();
  const ownProfile = me.id === profile.id;
  const posts = getUserPosts(profile.id);
  const followerCount = getFollowers(profile.id).length;
  const followingCount = getFollowing(profile.id).length;

  pageEl.innerHTML = `
    <section class="stack">
      <section class="profile-banner">
        <div class="profile-header">
          <div class="profile-identity">
            ${avatarMarkup(profile, "large")}
            <div class="profile-copy">
              <p class="eyebrow">${ownProfile ? "Your profile" : "Member profile"}</p>
              <h2>${escapeHtml(profile.displayName)}</h2>
              <p>@${escapeHtml(profile.username)}</p>
            </div>
          </div>
          <div class="action-row">
            ${ownProfile ? `<a class="secondary-button" href="#/settings">Edit profile</a>` : followButtonMarkup(profile)}
          </div>
        </div>
        <p class="muted">${escapeHtml(profile.bio || "No bio yet.")}</p>
        <div class="stats-strip">
          <article><span class="helper">Posts</span> <strong>${posts.length}</strong></article>
          <article><span class="helper">Followers</span> <strong>${followerCount}</strong></article>
          <article><span class="helper">Following</span> <strong>${followingCount}</strong></article>
          <article><span class="helper">Unread alerts</span> <strong>${getUnreadNotifications(profile.id).length}</strong></article>
        </div>
      </section>

      <section class="detail-grid">
        <div class="stack">
          <section class="panel">
            <div class="section-heading">
              <div>
                <p class="eyebrow">Posts</p>
                <h2>${ownProfile ? "Your recent notes" : `${escapeHtml(profile.displayName)}'s posts`}</h2>
              </div>
            </div>
            <div class="stack">
              ${posts.length ? posts.map((post) => renderPostCard(post, { allowExpand: true })).join("") : `<div class="empty-state">No posts published yet.</div>`}
            </div>
          </section>
        </div>

        <aside class="stack">
          <section class="panel">
            <div class="section-heading">
              <div>
                <p class="eyebrow">Network</p>
                <h2>Followers</h2>
              </div>
            </div>
            <div class="user-list">
              ${getFollowers(profile.id).slice(0, 4).map((user) => renderMiniPerson(user)).join("") || `<div class="empty-state">No followers yet.</div>`}
            </div>
          </section>

          <section class="panel">
            <div class="section-heading">
              <div>
                <p class="eyebrow">Following</p>
                <h2>Connections</h2>
              </div>
            </div>
            <div class="user-list">
              ${getFollowing(profile.id).slice(0, 4).map((user) => renderMiniPerson(user)).join("") || `<div class="empty-state">Not following anyone yet.</div>`}
            </div>
          </section>
        </aside>
      </section>
    </section>
  `;

  bindPostInteractions();
  bindFollowButtons();
}

function renderNotifications() {
  const me = currentUser();
  markNotificationsViewed(me.id);
  renderTopbar("/notifications");
  const filter = state.ui.notificationsFilter;
  const list = getNotifications(me.id).filter((entry) => (filter === "unread" ? !entry.isRead : true));
  const visible = list.slice(0, state.ui.notificationsVisible);

  pageEl.innerHTML = `
    <section class="stack">
      <section class="panel">
        <div class="notification-toolbar">
          <div>
            <p class="eyebrow">Notification center</p>
            <h2>Signals and follow-ups</h2>
          </div>
          <div class="action-row">
            <button class="ghost-button" id="mark-all-read" type="button">Mark all as read</button>
          </div>
        </div>
        <div class="filters" style="margin-top:16px;">
          <button class="chip ${filter === "all" ? "active" : ""}" data-filter="all" type="button">All</button>
          <button class="chip ${filter === "unread" ? "active" : ""}" data-filter="unread" type="button">Unread</button>
        </div>
      </section>

      <section class="notification-list" id="notification-list">
        ${visible.length ? visible.map(renderNotificationItem).join("") : `<div class="empty-state">Nothing here yet. Real-time activity will show up as soon as it lands.</div>`}
      </section>
      <div id="notifications-sentinel"></div>
    </section>
  `;

  bindNotificationActions();
  bindInfiniteNotifications();
}

function renderSettings() {
  const me = currentUser();
  const preferences = state.preferences[me.id];

  pageEl.innerHTML = `
    <section class="detail-grid">
      <div class="stack">
        <section class="panel">
          <div class="settings-header">
            <div>
              <p class="eyebrow">Account</p>
              <h2>Profile settings</h2>
            </div>
          </div>
          <form class="form-grid" id="profile-form">
            <div class="input-group">
              <label for="settings-display-name">Display name</label>
              <input id="settings-display-name" name="displayName" type="text" maxlength="40" value="${escapeHtml(me.displayName)}" required />
            </div>
            <div class="input-group">
              <label for="settings-bio">Bio</label>
              <textarea id="settings-bio" name="bio" maxlength="160">${escapeHtml(me.bio || "")}</textarea>
            </div>
            <button class="primary-button" type="submit">Save profile</button>
          </form>
        </section>

        <section class="panel">
          <div class="section-heading">
            <div>
              <p class="eyebrow">Security</p>
              <h2>Change password</h2>
            </div>
          </div>
          <form class="form-grid" id="password-form">
            <div class="input-group">
              <label for="current-password">Current password</label>
              <input id="current-password" name="currentPassword" type="password" required />
            </div>
            <div class="input-group">
              <label for="new-password">New password</label>
              <input id="new-password" name="newPassword" type="password" minlength="8" required />
            </div>
            <button class="secondary-button" type="submit">Update password</button>
          </form>
        </section>
      </div>

      <aside class="stack">
        <section class="panel">
          <div class="section-heading">
            <div>
              <p class="eyebrow">Notifications</p>
              <h2>Delivery preferences</h2>
            </div>
          </div>
          <div class="switch-list">
            ${renderSwitch("notifyOnLike", "Notify on likes", "Receive alerts when someone likes one of your posts.", preferences.notifyOnLike)}
            ${renderSwitch("notifyOnComment", "Notify on comments", "Get notified when someone joins the conversation on your post.", preferences.notifyOnComment)}
            ${renderSwitch("notifyOnFollow", "Notify on follows", "Keep track of new followers as they arrive.", preferences.notifyOnFollow)}
            ${renderSwitch("emailNotifications", "Email notifications", "Stored as a setting for the production-style workflow.", preferences.emailNotifications)}
            ${renderSwitch("realtimeNotifications", "Real-time notifications", "Controls toasts and instant delivery while you are online.", preferences.realtimeNotifications)}
          </div>
        </section>

        <section class="panel">
          <div class="section-heading">
            <div>
              <p class="eyebrow">Preview</p>
              <h2>Current delivery mode</h2>
            </div>
          </div>
          <div class="metric-row">
            <article class="metric">
              <span class="helper">Live toasts</span>
              <strong>${preferences.realtimeNotifications ? "On" : "Off"}</strong>
            </article>
            <article class="metric">
              <span class="helper">Email fallback</span>
              <strong>${preferences.emailNotifications ? "On" : "Off"}</strong>
            </article>
          </div>
        </section>
      </aside>
    </section>
  `;

  bindSettingsActions();
}

function renderExplore() {
  const me = currentUser();
  const query = state.ui.searchQuery.trim().toLowerCase();
  const users = query.length >= 1 ? searchUsers(query, me.id) : getSuggestedUsers(me.id, 10);
  const trending = getTrendingPosts().slice(0, 4);

  pageEl.innerHTML = `
    <section class="detail-grid">
      <div class="stack">
        <section class="panel">
          <div class="section-heading">
            <div>
              <p class="eyebrow">Explore</p>
              <h2>Find people and momentum</h2>
            </div>
          </div>
          <div class="search-row">
            <input class="search-input" id="search-input" type="search" placeholder="Search by username or display name" value="${escapeHtml(state.ui.searchQuery)}" />
            <span class="helper">Type to search the universe</span>
          </div>
        </section>

        <section class="panel">
          <div class="section-heading">
            <div>
              <p class="eyebrow">People</p>
              <h2>${query.length >= 1 ? "Search results" : "Suggested accounts"}</h2>
            </div>
          </div>
          <div class="user-list">
            ${users.length ? users.map((user) => renderExploreUser(user)).join("") : `<div class="empty-state">No people matched that query yet.</div>`}
          </div>
        </section>
      </div>

      <aside class="stack">
        <section class="panel">
          <div class="section-heading">
            <div>
              <p class="eyebrow">Trending</p>
              <h2>Most-liked posts</h2>
            </div>
          </div>
          <div class="stack">
            ${trending.map((post) => renderPostCard(post, { compact: true })).join("")}
          </div>
        </section>
      </aside>
    </section>
  `;

  bindExploreActions();
  bindFollowButtons();
  bindPostInteractions();
}

function renderPostDetail(postId) {
  const post = state.posts.find((entry) => entry.id === postId && !entry.deleted);
  if (!post) {
    pageEl.innerHTML = `<section class="panel"><h2>Post not found</h2></section>`;
    return;
  }

  if (!state.ui.commentsOpen.includes(post.id)) {
    state.ui.commentsOpen.push(post.id);
  }

  const author = getUser(post.userId);

  pageEl.innerHTML = `
    <section class="detail-grid">
      <div class="stack">
        ${renderPostCard(post, { allowExpand: true, fullComments: true })}
      </div>
      <aside class="stack">
        <section class="panel">
          <div class="section-heading">
            <div>
              <p class="eyebrow">Author</p>
              <h2>${escapeHtml(author.displayName)}</h2>
            </div>
          </div>
          <p class="muted">${escapeHtml(author.bio)}</p>
          <div class="action-row" style="margin-top:14px;">
            <a class="secondary-button" href="#/profile/${author.username}">View profile</a>
            ${author.id === currentUser().id ? "" : followButtonMarkup(author)}
          </div>
        </section>
      </aside>
    </section>
  `;

  bindPostInteractions();
  bindFollowButtons();
}

function renderPostCard(post, options = {}) {
  const author = getUser(post.userId);
  const likes = getLikesForPost(post.id);
  const comments = getCommentsForPost(post.id);
  const liked = likes.some((like) => like.userId === currentUser().id);
  const commentsOpen = state.ui.commentsOpen.includes(post.id);
  const displayedComments = options.fullComments ? comments : comments.slice(0, COMMENT_PAGE_SIZE);

  return `
    <article class="post-card" data-post-id="${post.id}">
      <div class="post-header">
        <div class="post-author">
          ${avatarMarkup(author)}
          <div class="post-copy">
            <a class="post-title" href="#/profile/${author.username}">${escapeHtml(author.displayName)}</a>
            <p>@${escapeHtml(author.username)} · <span title="${formatFullDate(post.createdAt)}">${timeAgo(post.createdAt)}</span></p>
          </div>
        </div>
        <a class="ghost-button" href="#/post/${post.id}">Open</a>
      </div>
      <p class="post-text">${escapeHtml(post.content)}</p>
      ${post.photos && post.photos.length > 0 ? `
        <div class="post-media-grid ${post.photos.length === 1 ? 'single' : 'multiple'}">
          ${post.photos.map(photo => `<img src="${photo}" alt="Attached media" loading="lazy" />`).join('')}
        </div>
      ` : ""}
      <div class="post-actions">
        <button class="action-button ${liked ? "active" : ""}" data-action="like" type="button">
          <span>${liked ? "Liked" : "Like"}</span>
          <strong>${likes.length}</strong>
        </button>
        <button class="action-button" data-action="comment-toggle" type="button">
          <span>${commentsOpen ? "Hide comments" : "Comments"}</span>
          <strong>${comments.length}</strong>
        </button>
        ${post.userId === currentUser().id ? `<button class="action-button" data-action="delete-post" type="button">Delete</button>` : ""}
      </div>
      ${commentsOpen ? renderCommentSection(post, displayedComments, comments.length > displayedComments.length) : ""}
    </article>
  `;
}

function renderCommentSection(post, comments, showRemainder) {
  const items = comments.map((comment) => {
    const author = getUser(comment.userId);
    return `
      <article class="comment-item" data-comment-id="${comment.id}">
        ${avatarMarkup(author, "small")}
        <div class="comment-content">
          <div class="comment-header">
            <div>
              <strong>${escapeHtml(author.displayName)}</strong>
              <div class="meta">@${escapeHtml(author.username)} · ${timeAgo(comment.createdAt)}</div>
            </div>
            ${comment.userId === currentUser().id ? `<button class="ghost-button" data-action="delete-comment" type="button">Delete</button>` : ""}
          </div>
          <p class="post-text">${escapeHtml(comment.content)}</p>
        </div>
      </article>
    `;
  });

  return `
    <section class="comment-wrap">
      <form class="comment-form" data-comment-form="${post.id}">
        <input type="text" name="content" maxlength="300" placeholder="Add a comment" required />
        <button class="secondary-button" type="submit">Reply</button>
      </form>
      ${items.join("") || `<div class="empty-state">No comments yet. Start the thread.</div>`}
      ${showRemainder ? `<a class="ghost-button" href="#/post/${post.id}">View all comments</a>` : ""}
    </section>
  `;
}

function renderNotificationItem(notification) {
  const sender = getUser(notification.senderId);
  const unreadDot = notification.isRead ? "" : `<span class="unread-dot" aria-hidden="true"></span>`;
  const href = notification.postId ? `#/post/${notification.postId}` : `#/profile/${sender.username}`;
  return `
    <a class="notification-item ${notification.isRead ? "" : "unread"}" data-notification-id="${notification.id}" href="${href}">
      ${unreadDot}
      ${avatarMarkup(sender)}
      <div class="notification-copy">
        <strong>${escapeHtml(notification.message)}</strong>
        <p>From @${escapeHtml(sender.username)} · ${timeAgo(notification.createdAt)}</p>
      </div>
    </a>
  `;
}

function renderExploreUser(user) {
  return `
    <article class="explore-user">
      ${avatarMarkup(user)}
      <div class="explore-copy">
        <strong>${escapeHtml(user.displayName)}</strong>
        <p>@${escapeHtml(user.username)}</p>
        <p>${escapeHtml(user.bio)}</p>
      </div>
      <div class="action-row">
        <a class="ghost-button" href="#/profile/${user.username}">View</a>
        ${followButtonMarkup(user)}
      </div>
    </article>
  `;
}

function renderMiniPerson(user) {
  return `
    <a class="explore-user" href="#/profile/${user.username}">
      ${avatarMarkup(user, "small")}
      <div class="explore-copy">
        <strong>${escapeHtml(user.displayName)}</strong>
        <p>@${escapeHtml(user.username)}</p>
      </div>
    </a>
  `;
}

function renderSwitch(key, title, description, enabled) {
  return `
    <div class="switch-row">
      <div>
        <strong>${title}</strong>
        <p>${description}</p>
      </div>
      <button class="toggle ${enabled ? "active" : ""}" data-toggle="${key}" type="button" aria-pressed="${enabled}"></button>
    </div>
  `;
}

function cloneAuthShell() {
  return document.getElementById("auth-card-template").content.firstElementChild.cloneNode(true);
}

function bindComposeForm() {
  const form = document.getElementById("compose-form");
  if (!form) return;

  const textarea = document.getElementById("compose-content");
  const counter = document.getElementById("compose-counter");
  const photoBtn = document.getElementById("compose-photo-btn");
  const photoInput = document.getElementById("compose-photo-input");
  const previewContainer = document.getElementById("compose-image-preview");
  let selectedPhotos = [];

  if (photoBtn && photoInput && previewContainer) {
    photoBtn.addEventListener("click", () => photoInput.click());
    
    photoInput.addEventListener("change", (e) => {
      const files = Array.from(e.target.files);
      if (!files.length) return;
      
      files.forEach(file => {
        if (selectedPhotos.length >= 4) return;
        const reader = new FileReader();
        reader.onload = (event) => {
          const img = new Image();
          img.onload = () => {
            const canvas = document.createElement("canvas");
            let width = img.width;
            let height = img.height;
            const MAX = 800;

            if (width > height && width > MAX) {
              height = Math.round(height * (MAX / width));
              width = MAX;
            } else if (height > MAX) {
              width = Math.round(width * (MAX / height));
              height = MAX;
            }

            canvas.width = width;
            canvas.height = height;
            const ctx = canvas.getContext("2d");
            ctx.drawImage(img, 0, 0, width, height);
            
            selectedPhotos.push(canvas.toDataURL("image/jpeg", 0.8));
            renderPreview();
          };
          img.src = event.target.result;
        };
        reader.readAsDataURL(file);
      });
      photoInput.value = "";
    });
    
    function renderPreview() {
      previewContainer.innerHTML = selectedPhotos.map((dataUrl, idx) => `
        <div style="position: relative; display: inline-block;">
          <img src="${dataUrl}" />
          <button type="button" class="remove-photo-btn" data-index="${idx}" aria-label="Remove photo" style="position: absolute; top: -6px; right: -6px; background: var(--error, #e53e3e); color: white; border: none; border-radius: 50%; width: 22px; height: 22px; display: flex; align-items: center; justify-content: center; cursor: pointer; font-size: 16px; font-weight: bold; line-height: 1;">&times;</button>
        </div>
      `).join("");
      
      previewContainer.querySelectorAll(".remove-photo-btn").forEach(btn => {
        btn.addEventListener("click", (e) => {
          const idx = parseInt(e.target.getAttribute("data-index"));
          selectedPhotos.splice(idx, 1);
          renderPreview();
        });
      });
    }
  }

  textarea.addEventListener("input", () => {
    const value = textarea.value.length;
    counter.textContent = `${value} / 500`;
    counter.classList.toggle("over", value > 500);
  });

  form.addEventListener("submit", (event) => {
    event.preventDefault();
    const content = textarea.value.trim();
    if (!content && selectedPhotos.length === 0) {
      notifyToast("Post is empty", "Write something or attach photos before you publish.");
      return;
    }

    const post = {
      id: createId("p"),
      userId: currentUser().id,
      content,
      photos: selectedPhotos.length > 0 ? [...selectedPhotos] : undefined,
      createdAt: new Date().toISOString(),
      deleted: false,
    };

    state.posts.unshift(post);
    state.ui.feedVisible = Math.max(state.ui.feedVisible, FEED_PAGE_SIZE);
    textarea.value = "";
    if (previewContainer) {
      selectedPhotos = [];
      previewContainer.innerHTML = "";
    }
    counter.textContent = "0 / 500";
    persistAndRender();
    notifyToast("Post published", "Your update is now at the top of the feed.");
  });
}

function bindPostInteractions() {
  pageEl.querySelectorAll("[data-action='like']").forEach((button) => {
    button.addEventListener("click", () => {
      const postId = button.closest("[data-post-id]").dataset.postId;
      toggleLike(postId);
    });
  });

  pageEl.querySelectorAll("[data-action='comment-toggle']").forEach((button) => {
    button.addEventListener("click", () => {
      const postId = button.closest("[data-post-id]").dataset.postId;
      toggleCommentSection(postId);
    });
  });

  pageEl.querySelectorAll("[data-comment-form]").forEach((form) => {
    form.addEventListener("submit", (event) => {
      event.preventDefault();
      const postId = form.dataset.commentForm;
      const input = form.querySelector("input[name='content']");
      const content = input.value.trim();
      if (!content) {
        return;
      }

      addComment(postId, content);
      input.value = "";
    });
  });

  pageEl.querySelectorAll("[data-action='delete-comment']").forEach((button) => {
    button.addEventListener("click", () => {
      const commentId = button.closest("[data-comment-id]").dataset.commentId;
      deleteComment(commentId);
    });
  });

  pageEl.querySelectorAll("[data-action='delete-post']").forEach((button) => {
    button.addEventListener("click", () => {
      const postId = button.closest("[data-post-id]").dataset.postId;
      deletePost(postId);
    });
  });
}

function bindNotificationActions() {
  document.querySelectorAll("[data-filter]").forEach((button) => {
    button.addEventListener("click", () => {
      state.ui.notificationsFilter = button.dataset.filter;
      state.ui.notificationsVisible = 8;
      persistAndRender();
    });
  });

  const markAll = document.getElementById("mark-all-read");
  if (markAll) {
    markAll.addEventListener("click", () => {
      getNotifications(currentUser().id).forEach((notification) => {
        notification.isRead = true;
      });
      persistAndRender();
      notifyToast("Notifications cleared", "Everything has been marked as read.");
    });
  }

  document.querySelectorAll("[data-notification-id]").forEach((link) => {
    link.addEventListener("click", () => {
      const notification = state.notifications.find((entry) => entry.id === link.dataset.notificationId);
      if (notification) {
        notification.isRead = true;
        saveState();
      }
    });
  });
}

function bindSettingsActions() {
  document.getElementById("profile-form").addEventListener("submit", (event) => {
    event.preventDefault();
    const form = new FormData(event.currentTarget);
    const me = currentUser();
    me.displayName = form.get("displayName").toString().trim();
    me.bio = form.get("bio").toString().trim();
    persistAndRender();
    notifyToast("Profile saved", "Your public profile has been updated.");
  });

  document.getElementById("password-form").addEventListener("submit", (event) => {
    event.preventDefault();
    const form = new FormData(event.currentTarget);
    const me = currentUser();
    const currentPassword = form.get("currentPassword").toString();
    const newPassword = form.get("newPassword").toString();

    if (currentPassword !== me.password) {
      notifyToast("Password mismatch", "Your current password did not match the stored value.");
      return;
    }

    if (!/\d/.test(newPassword) || newPassword.length < 8) {
      notifyToast("Weak password", "Use at least 8 characters and include one number.");
      return;
    }

    me.password = newPassword;
    event.currentTarget.reset();
    saveState();
    notifyToast("Password updated", "Your local demo credentials have been changed.");
  });

  document.querySelectorAll("[data-toggle]").forEach((button) => {
    button.addEventListener("click", () => {
      const key = button.dataset.toggle;
      const prefs = state.preferences[currentUser().id];
      prefs[key] = !prefs[key];
      persistAndRender();
      notifyToast("Preference updated", `${button.previousElementSibling?.querySelector("strong")?.textContent || "Setting"} is now ${prefs[key] ? "enabled" : "disabled"}.`);
    });
  });
}

function bindExploreActions() {
  const input = document.getElementById("search-input");
  input?.addEventListener("input", () => {
    state.ui.searchQuery = input.value;
    saveState();
    renderExplore();
  });
}

function bindFollowButtons() {
  pageEl.querySelectorAll("[data-follow-user]").forEach((button) => {
    button.addEventListener("click", () => {
      toggleFollow(button.dataset.followUser);
    });
  });
}

function bindSimulationButtons() {
  document.querySelectorAll("[data-simulate]").forEach((button) => {
    button.addEventListener("click", () => {
      createInboundNotification(button.dataset.simulate);
    });
  });
}

function bindInfiniteFeed() {
  if (feedObserver) {
    feedObserver.disconnect();
  }

  const sentinel = document.getElementById("feed-sentinel");
  const total = getFeedPosts(currentUser().id).length;
  if (!sentinel || state.ui.feedVisible >= total) return;

  feedObserver = new IntersectionObserver((entries) => {
    entries.forEach((entry) => {
      if (entry.isIntersecting) {
        state.ui.feedVisible += FEED_PAGE_SIZE;
        persistAndRender();
      }
    });
  });

  feedObserver.observe(sentinel);
}

function bindInfiniteNotifications() {
  if (notificationsObserver) {
    notificationsObserver.disconnect();
  }

  const sentinel = document.getElementById("notifications-sentinel");
  const total = getNotifications(currentUser().id).filter((entry) =>
    state.ui.notificationsFilter === "unread" ? !entry.isRead : true,
  ).length;
  if (!sentinel || state.ui.notificationsVisible >= total) return;

  notificationsObserver = new IntersectionObserver((entries) => {
    entries.forEach((entry) => {
      if (entry.isIntersecting) {
        state.ui.notificationsVisible += 8;
        persistAndRender();
      }
    });
  });

  notificationsObserver.observe(sentinel);
}

function logout() {
  state.session.currentUserId = null;
  saveState();
  location.hash = "#/login";
  render();
}

function toggleLike(postId) {
  const me = currentUser();
  const post = state.posts.find((entry) => entry.id === postId && !entry.deleted);
  if (!post || post.userId === me.id) {
    if (post?.userId === me.id) {
      notifyToast("Nice try", "Self-likes are disabled in this Pulse build.");
    }
    return;
  }

  const existing = state.likes.find((like) => like.postId === postId && like.userId === me.id);
  if (existing) {
    state.likes = state.likes.filter((like) => like.id !== existing.id);
    persistAndRender();
    return;
  }

  state.likes.push({
    id: createId("l"),
    postId,
    userId: me.id,
    createdAt: new Date().toISOString(),
  });

  maybeCreateNotification({
    recipientId: post.userId,
    senderId: me.id,
    type: "like",
    message: `${me.displayName} liked your post`,
    postId,
  });

  persistAndRender();
}

function addComment(postId, content) {
  const me = currentUser();
  const post = state.posts.find((entry) => entry.id === postId && !entry.deleted);
  if (!post) return;

  const comment = {
    id: createId("c"),
    postId,
    userId: me.id,
    content,
    createdAt: new Date().toISOString(),
    deleted: false,
  };

  state.comments.push(comment);

  if (post.userId !== me.id) {
    maybeCreateNotification({
      recipientId: post.userId,
      senderId: me.id,
      type: "comment",
      message: `${me.displayName} commented: "${truncate(content, 48)}"`,
      postId,
    });
  }

  persistAndRender();
}

function deleteComment(commentId) {
  const comment = state.comments.find((entry) => entry.id === commentId);
  if (!comment || comment.userId !== currentUser().id) return;
  comment.deleted = true;
  persistAndRender();
}

function deletePost(postId) {
  const post = state.posts.find((entry) => entry.id === postId);
  if (!post || post.userId !== currentUser().id) return;
  post.deleted = true;
  state.likes = state.likes.filter((like) => like.postId !== postId);
  state.comments = state.comments.filter((comment) => comment.postId !== postId);
  persistAndRender();
  notifyToast("Post deleted", "The post and its local interactions were removed.");
}

function toggleCommentSection(postId) {
  const set = new Set(state.ui.commentsOpen);
  if (set.has(postId)) {
    set.delete(postId);
  } else {
    set.add(postId);
  }
  state.ui.commentsOpen = [...set];
  persistAndRender();
}

function toggleFollow(username) {
  const target = state.users.find((user) => user.username === username);
  const me = currentUser();
  if (!target || target.id === me.id) {
    return;
  }

  const existing = state.follows.find((follow) => follow.followerId === me.id && follow.followingId === target.id);
  if (existing) {
    state.follows = state.follows.filter((follow) => follow.id !== existing.id);
    persistAndRender();
    return;
  }

  state.follows.push({
    id: createId("f"),
    followerId: me.id,
    followingId: target.id,
    createdAt: new Date().toISOString(),
  });

  maybeCreateNotification({
    recipientId: target.id,
    senderId: me.id,
    type: "follow",
    message: `${me.displayName} started following you`,
    postId: null,
  });

  persistAndRender();
}

function maybeCreateNotification({ recipientId, senderId, type, message, postId = null }) {
  if (recipientId === senderId) {
    return;
  }

  const prefs = state.preferences[recipientId] || {};
  if (
    (type === "like" && prefs.notifyOnLike === false) ||
    (type === "comment" && prefs.notifyOnComment === false) ||
    (type === "follow" && prefs.notifyOnFollow === false)
  ) {
    return;
  }

  const withinHour = state.notifications.find((notification) => {
    if (notification.recipientId !== recipientId || notification.senderId !== senderId || notification.type !== type) {
      return false;
    }

    if ((notification.postId || null) !== (postId || null)) {
      return false;
    }

    return Math.abs(new Date(notification.createdAt).getTime() - Date.now()) < 60 * 60 * 1000;
  });

  if (withinHour) {
    return;
  }

  const notification = {
    id: createId("n"),
    recipientId,
    senderId,
    type,
    message,
    postId,
    isRead: false,
    createdAt: new Date().toISOString(),
  };

  state.notifications.unshift(notification);

  if (recipientId === currentUser().id && state.preferences[recipientId]?.realtimeNotifications) {
    notifyToast(typeLabel(type), message);
  }
}

function createInboundNotification(type) {
  const me = currentUser();
  const actors = state.users.filter((user) => user.id !== me.id);
  const actor = actors[Math.floor(Math.random() * actors.length)];
  const myPosts = getUserPosts(me.id);
  const post = myPosts[0] || state.posts.find((entry) => !entry.deleted && entry.userId !== actor.id);

  const payload = {
    like: {
      message: `${actor.displayName} liked your post`,
      postId: post?.id || null,
    },
    comment: {
      message: `${actor.displayName} commented: "This shipped fast and still feels polished."`,
      postId: post?.id || null,
    },
    follow: {
      message: `${actor.displayName} started following you`,
      postId: null,
    },
  }[type];

  maybeCreateNotification({
    recipientId: me.id,
    senderId: actor.id,
    type,
    message: payload.message,
    postId: payload.postId,
  });

  persistAndRender();
}

function startRealtimeSimulation() {
  if (simulationTimer) {
    clearInterval(simulationTimer);
  }

  simulationTimer = setInterval(() => {
    if (!isAuthed()) return;
    if (Math.random() > 0.5) return;
    const types = ["like", "comment", "follow"];
    createInboundNotification(types[Math.floor(Math.random() * types.length)]);
  }, 18000);
}

function markNotificationsViewed(userId) {
  const list = getNotifications(userId);
  list.slice(0, 5).forEach((notification) => {
    notification.isRead = true;
  });
  saveState();
}

function getUser(userId) {
  return state.users.find((user) => user.id === userId);
}

function getFeedPosts(userId) {
  const followingIds = new Set(getFollowing(userId).map((user) => user.id));
  followingIds.add(userId);
  return state.posts
    .filter((post) => !post.deleted && followingIds.has(post.userId))
    .sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt));
}

function getUserPosts(userId) {
  return state.posts
    .filter((post) => !post.deleted && post.userId === userId)
    .sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt));
}

function getLikesForPost(postId) {
  return state.likes.filter((like) => like.postId === postId);
}

function getCommentsForPost(postId) {
  return state.comments
    .filter((comment) => comment.postId === postId && !comment.deleted)
    .sort((a, b) => new Date(a.createdAt) - new Date(b.createdAt));
}

function getFollowers(userId) {
  const ids = state.follows.filter((follow) => follow.followingId === userId).map((follow) => follow.followerId);
  return state.users.filter((user) => ids.includes(user.id));
}

function getFollowing(userId) {
  const ids = state.follows.filter((follow) => follow.followerId === userId).map((follow) => follow.followingId);
  return state.users.filter((user) => ids.includes(user.id));
}

function getNotifications(userId) {
  return state.notifications
    .filter((notification) => notification.recipientId === userId)
    .sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt));
}

function getUnreadNotifications(userId) {
  return getNotifications(userId).filter((notification) => !notification.isRead);
}

function getSuggestedUsers(userId, limit) {
  const followingIds = new Set(getFollowing(userId).map((user) => user.id));
  return state.users
    .filter((user) => user.id !== userId && !followingIds.has(user.id))
    .slice(0, limit);
}

function searchUsers(query, currentUserId) {
  return state.users.filter((user) => {
    if (user.id === currentUserId) return false;
    return (
      user.username.toLowerCase().includes(query) ||
      user.displayName.toLowerCase().includes(query)
    );
  });
}

function getTrendingPosts() {
  return state.posts
    .filter((post) => !post.deleted)
    .map((post) => ({ ...post, score: getLikesForPost(post.id).length }))
    .sort((a, b) => b.score - a.score || new Date(b.createdAt) - new Date(a.createdAt));
}

function followButtonMarkup(user) {
  const following = state.follows.some(
    (follow) => follow.followerId === currentUser().id && follow.followingId === user.id,
  );
  return `
    <button class="${following ? "ghost-button" : "primary-button"}" data-follow-user="${user.username}" type="button">
      ${following ? "Following" : "Follow"}
    </button>
  `;
}

function avatarMarkup(user, size = "") {
  const initials = user.displayName
    .split(" ")
    .map((part) => part[0])
    .join("")
    .slice(0, 2)
    .toUpperCase();

  return `<div class="avatar ${size}" style="background:${user.avatarColor}">${initials}</div>`;
}

function notifyToast(title, message) {
  try {
    const AudioContext = window.AudioContext || window.webkitAudioContext;
    if (AudioContext) {
      const ctx = new AudioContext();
      const osc = ctx.createOscillator();
      const gainNode = ctx.createGain();
      osc.type = "sine";
      osc.frequency.setValueAtTime(800, ctx.currentTime);
      osc.frequency.exponentialRampToValueAtTime(300, ctx.currentTime + 0.1);
      gainNode.gain.setValueAtTime(0, ctx.currentTime);
      gainNode.gain.linearRampToValueAtTime(0.2, ctx.currentTime + 0.02);
      gainNode.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + 0.1);
      osc.connect(gainNode);
      gainNode.connect(ctx.destination);
      osc.start(ctx.currentTime);
      osc.stop(ctx.currentTime + 0.1);
    }
  } catch (e) {}

  const toast = document.createElement("article");
  toast.className = "toast";
  toast.innerHTML = `<strong>${escapeHtml(title)}</strong><p>${escapeHtml(message)}</p>`;
  toastStackEl.appendChild(toast);
  setTimeout(() => {
    toast.remove();
  }, 3400);
}

function sanitizeUsername(value) {
  return value.trim().toLowerCase().replace(/[^a-z0-9_]/g, "");
}

function pickAvatarColor() {
  const colors = ["#d85f3d", "#1f7a8c", "#4e7d4c", "#7b5ea7", "#d19a2c"];
  return colors[Math.floor(Math.random() * colors.length)];
}

function createId(prefix) {
  return `${prefix}${Math.random().toString(36).slice(2, 10)}`;
}

function truncate(value, length) {
  return value.length <= length ? value : `${value.slice(0, length - 1)}...`;
}

function timeAgo(isoString) {
  const delta = Date.now() - new Date(isoString).getTime();
  const minute = 60 * 1000;
  const hour = 60 * minute;
  const day = 24 * hour;

  if (delta < hour) {
    return `${Math.max(1, Math.floor(delta / minute))}m ago`;
  }
  if (delta < day) {
    return `${Math.floor(delta / hour)}h ago`;
  }
  return `${Math.floor(delta / day)}d ago`;
}

function formatFullDate(isoString) {
  return new Date(isoString).toLocaleString();
}

function typeLabel(type) {
  return {
    like: "New like",
    comment: "New comment",
    follow: "New follower",
  }[type];
}

function escapeHtml(value) {
  return String(value)
    .replaceAll("&", "&amp;")
    .replaceAll("<", "&lt;")
    .replaceAll(">", "&gt;")
    .replaceAll('"', "&quot;")
    .replaceAll("'", "&#39;");
}
