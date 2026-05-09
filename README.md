<h1 align="center">
  Pulse
</h1>

<p align="center">
  A modern, responsive, high-performance social community platform MVP built with React and Vite.
</p>

<p align="center">
  <a href="#features">Features</a> •
  <a href="#architecture">Architecture</a> •
  <a href="#getting-started">Getting Started</a> •
  <a href="#tech-stack">Tech Stack</a>
</p>

---

## 📖 Overview

**Pulse** is a lightweight, frontend-focused Minimum Viable Product (MVP) of a comprehensive social network. It is built to simulate complex interactions like real-time notifications, dynamic feeds, and profile management entirely within the browser. Data persistence is elegantly handled via `localStorage`, allowing for immediate testing and iteration without the overhead of a backend infrastructure.

## ✨ Features

- **Robust Authentication Flow**: Simulated secure login and signup with client-side state management.
- **Dynamic Social Feed**: Infinite-scroll style feed with progressive loading, allowing users to compose, interact with (like, comment), and delete posts.
- **Rich User Profiles**: Detailed profile views featuring follower/following metrics and user activity history.
- **Discovery & Search**: Explore page with a powerful user search capability and trending topics surface.
- **Simulated Real-Time Notifications**: Advanced notification pipeline with unread badges, contextual filters, and toast-based delivery.
- **User Preferences**: Comprehensive settings interface for profile customization and security.

## 🛠 Tech Stack

- **Framework**: [React 18](https://react.dev/)
- **Routing**: [React Router 6](https://reactrouter.com/) (SPA Mode)
- **Build Tool**: [Vite](https://vitejs.dev/)
- **Styling**: [TailwindCSS 3](https://tailwindcss.com/)
- **UI Primitives**: [Radix UI](https://www.radix-ui.com/)
- **Icons**: [Lucide React](https://lucide.dev/)
- **Language**: [TypeScript](https://www.typescriptlang.org/)

## 🚀 Getting Started

### Prerequisites

Ensure you have the following installed:
- Node.js (v18 or higher)
- pnpm (v8 or higher)

### Installation

1. Clone the repository:
   ```bash
   git clone https://github.com/sonaladhonde3-debug/Pulse.git
   cd Pulse
   ```

2. Install dependencies:
   ```bash
   pnpm install
   ```

3. Start the development server:
   ```bash
   pnpm dev
   ```

### Demo Credentials

To bypass registration and test the app immediately, use the following credentials:
- **Email**: `maya@pulse.app`
- **Password**: `Pulse123`

## 🏗 Architecture & Data Flow

While Pulse is currently an MVP, it is designed with scalability in mind. State is managed centrally and synced to the browser's `localStorage` to emulate database transactions. The frontend architecture cleanly separates:
- **UI Components** (`/client/components/ui`): Reusable, accessible Radix UI wrappers.
- **Views/Pages** (`/client/pages`): Composed feature modules mapped to routes.
- **State Management**: Encapsulated hooks simulating CRUD operations and real-time events.

*Note: The production roadmap includes migrating to a Django backend with Redis/Celery for distributed task queuing and WebSockets for real-time delivery.*

## 📁 Project Structure

```text
Pulse/
├── client/              # React SPA frontend
│   ├── components/      # Shared UI components and layout elements
│   ├── pages/           # Route-level components
│   ├── App.tsx          # Application entry point and router configuration
│   └── global.css       # Tailwind configuration and CSS variables
├── server/              # Local Express API backend (Dev integration)
├── shared/              # Shared TypeScript definitions
└── package.json         # Project metadata and scripts
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
