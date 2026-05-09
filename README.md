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

## 🚀 Getting Started

### Prerequisites

Ensure you have the following installed:
- Node.js (v18 or higher)
- pnpm (v8 or higher)
- Python 3.10+
- PostgreSQL
- Redis

### Quick Setup

#### 1. Backend Setup
1. Navigate to the backend directory and create a virtual environment:
   ```bash
   cd backend
   python -m venv venv
   source venv/bin/activate  # On Windows: venv\Scripts\activate
   ```
2. Install dependencies:
   ```bash
   pip install -r requirements.txt
   ```
3. Set up the PostgreSQL database and `.env` file (refer to `DJANGO_BACKEND_SETUP.md` for detailed instructions).
4. Run migrations and start the backend services (Django server, Redis, Celery worker, and Celery Beat).

#### 2. Frontend Setup
1. Navigate to the client directory:
   ```bash
   cd client
   ```
2. Install dependencies:
   ```bash
   pnpm install
   ```
3. Start the Vite development server:
   ```bash
   pnpm dev
   ```

*For complete end-to-end setup instructions, please see [DJANGO_BACKEND_SETUP.md](DJANGO_BACKEND_SETUP.md) and [COMPLETE_SETUP_INSTRUCTIONS.md](COMPLETE_SETUP_INSTRUCTIONS.md).*

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

## 🤝 Contributing

We welcome contributions! Please follow these steps:
1. Fork the project.
2. Create your feature branch (`git checkout -b feature/AmazingFeature`).
3. Commit your changes (`git commit -m 'Add some AmazingFeature'`).
4. Push to the branch (`git push origin feature/AmazingFeature`).
5. Open a Pull Request.

---
<p align="center">
  Built with ❤️ by the Pulse Engineering Team.
</p>
