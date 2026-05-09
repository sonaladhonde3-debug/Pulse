<h1 align="center">
  Pulse
</h1>

<p align="center">
  A modern, responsive, high-performance full-stack social community platform.
</p>

<p align="center">
  <a href="#features">Features</a> •
  <a href="#architecture">Architecture</a> •
  <a href="#getting-started">Getting Started</a> •
  <a href="#tech-stack">Tech Stack</a>
</p>

---

## 📖 Overview

**Pulse** is a comprehensive, full-stack social network application. It features a robust event-driven backend built with Django, Redis, and Celery, paired with a highly interactive, responsive frontend. Pulse is designed to handle complex social interactions like real-time notifications, dynamic feeds, and profile management smoothly and efficiently at scale.

## ✨ Features

- **Robust Authentication Flow**: Secure login and signup with JWT-based authentication.
- **Dynamic Social Feed**: Infinite-scroll style feed with progressive loading, allowing users to compose, interact with (like, comment), and delete posts.
- **Rich User Profiles**: Detailed profile views featuring follower/following metrics and user activity history.
- **Discovery & Search**: Explore page with a powerful user search capability and trending topics surface.
- **Real-Time Notifications**: Advanced event-driven notification pipeline using WebSockets, complete with unread badges, contextual filters, and toast-based delivery.
- **Scalable Asynchronous Processing**: Background task queuing via Celery and Redis to ensure the main application thread remains highly performant during heavy loads.

## 🛠 Tech Stack

### Frontend
- **Framework**: [React 18](https://react.dev/) / [Next.js](https://nextjs.org/)
- **Routing**: [React Router 6](https://reactrouter.com/) (SPA Mode)
- **Build Tool**: [Vite](https://vitejs.dev/)
- **Styling**: [TailwindCSS 3](https://tailwindcss.com/)
- **UI Primitives**: [Radix UI](https://www.radix-ui.com/)

### Backend
- **Framework**: [Django 4.2.8](https://www.djangoproject.com/) & [Django REST Framework](https://www.django-rest-framework.org/)
- **Database**: [PostgreSQL](https://www.postgresql.org/)
- **Caching & Message Broker**: [Redis](https://redis.io/)
- **Task Queue**: [Celery](https://docs.celeryq.dev/)
- **WebSockets**: [Django Channels](https://channels.readthedocs.io/) & [Daphne](https://github.com/django/daphne)

---

## 🚀 Getting Started

### Prerequisites
- Node.js (v18 or higher)
- pnpm (v8 or higher)
- Python 3.10+
- PostgreSQL (or SQLite for quick testing)
- Redis

### PART 1: Backend Setup

1. **Create and Activate Virtual Environment:**
   ```bash
   cd backend
   python -m venv venv
   source venv/bin/activate  # On Windows: venv\Scripts\activate
   ```

2. **Install Dependencies:**
   ```bash
   pip install -r requirements.txt
   ```

3. **Set Up PostgreSQL (Optional but Recommended):**
   ```sql
   CREATE DATABASE social_media_db;
   CREATE USER social_user WITH PASSWORD 'SecurePassword123!';
   ALTER ROLE social_user SET client_encoding TO 'utf8';
   ALTER ROLE social_user SET default_transaction_isolation TO 'read committed';
   ALTER ROLE social_user SET default_transaction_deferrable TO on;
   ALTER ROLE social_user SET timezone TO 'UTC';
   GRANT ALL PRIVILEGES ON DATABASE social_media_db TO social_user;
   ```
   *(If you prefer SQLite for quick testing, skip this and uncomment the SQLite DB config in `.env`)*

4. **Environment Variables:**
   Ensure your `backend/.env` file is set up correctly (see provided `.env.example`). Key configurations include `DB_ENGINE`, `DB_NAME`, `DB_USER`, `DB_PASSWORD`, `REDIS_URL`, and `JWT_SECRET_KEY`.

5. **Run Migrations & Create Superuser:**
   ```bash
   python manage.py makemigrations
   python manage.py migrate
   python manage.py createsuperuser
   ```

6. **Run Development Services (in separate terminals):**
   - **Terminal 1 - Django Server:** `python manage.py runserver`
   - **Terminal 2 - Redis:** `redis-server`
   - **Terminal 3 - Celery Worker:** `celery -A backend worker -l info`
   - **Terminal 4 - Celery Beat:** `celery -A backend beat -l info`

### PART 2: Frontend Setup

1. **Navigate to the frontend directory:**
   ```bash
   cd client
   ```

2. **Environment Variables:**
   Create a `.env.local` file in the frontend root:
   ```env
   NEXT_PUBLIC_API_URL=http://localhost:8000
   NEXT_PUBLIC_WS_URL=ws://localhost:8000/ws/notifications/
   ```

3. **Install Dependencies:**
   ```bash
   pnpm install
   ```

4. **Start the Development Server:**
   ```bash
   pnpm dev
   ```

---

## 🏗 Architecture & Data Flow

Pulse employs an event-driven, full-stack architecture optimized for high concurrency:

**Backend Flow:**
1. **API Layer**: User actions hit Django REST Framework endpoints.
2. **Task Queue**: Events are sent to the Redis queue.
3. **Asynchronous Processing**: Celery workers process these events in the background (e.g., generating notifications).
4. **Real-Time Delivery**: Django Channels broadcasts updates to connected clients via WebSockets.

**Frontend Flow:**
1. **State Management**: Local state is rapidly updated using client-side hooks to ensure a snappy user experience.
2. **Live Updates**: WebSocket listeners catch real-time events from the backend to update feeds and notification badges seamlessly.

---

## 📁 Project Structure

```text
Pulse/
├── client/              # React SPA frontend (Vite)
│   ├── components/      # Shared UI components
│   ├── pages/           # Route-level components
│   └── lib/             # API client & utilities
├── backend/             # Django backend
│   ├── users/           # Auth & Profiles
│   ├── posts/           # Feed & Posts
│   ├── interactions/    # Likes & Comments
│   └── notifications/   # Real-time WebSocket layer
├── shared/              # Shared definitions
└── package.json         # Root scripts & configuration
```
