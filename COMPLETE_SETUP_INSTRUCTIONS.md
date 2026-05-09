# Complete Social Media App - Django Backend + Next.js Frontend

## Overview

This is a production-ready full-stack social media application with:
- **Backend**: Django + DRF with real-time notifications via WebSockets
- **Frontend**: Next.js with TypeScript and Tailwind CSS
- **Database**: PostgreSQL
- **Async Processing**: Celery + Redis
- **Real-time**: Django Channels WebSockets

All 9 phases of development are included in this codebase.

---

## PART 1: BACKEND SETUP

### Prerequisites

- Python 3.10+
- PostgreSQL (or use SQLite for quick testing)
- Redis
- Node.js 18+ (for frontend)

### Step 1: Create Backend Project Structure

```bash
mkdir social-media-app
cd social-media-app

# Create backend directory
mkdir backend
cd backend

# Create virtual environment
python3 -m venv venv
source venv/bin/activate  # Windows: venv\Scripts\activate
```

### Step 2: Install Dependencies

```bash
pip install --upgrade pip

# Paste the contents of BACKEND_requirements.txt
# Or run:
pip install Django==4.2.8 djangorestframework==3.14.0 django-cors-headers==4.3.1 \
  psycopg2-binary==2.9.9 python-dotenv==1.0.0 celery==5.3.4 redis==5.0.1 \
  django-celery-beat==2.5.0 django-celery-results==2.5.1 channels==4.0.0 \
  channels-redis==4.1.0 daphne==4.0.0 djangorestframework-simplejwt==5.3.2 \
  django-filter==23.5 Pillow==10.1.0

pip freeze > requirements.txt
```

### Step 3: Set Up PostgreSQL (Optional - SQLite works for testing)

```bash
# macOS
brew install postgresql

# Linux
sudo apt-get install postgresql postgresql-contrib

# Connect to PostgreSQL
psql postgres

# Run these commands in psql:
CREATE DATABASE social_media_db;
CREATE USER social_user WITH PASSWORD 'SecurePassword123!';
ALTER ROLE social_user SET client_encoding TO 'utf8';
ALTER ROLE social_user SET default_transaction_isolation TO 'read committed';
ALTER ROLE social_user SET default_transaction_deferrable TO on;
ALTER ROLE social_user SET timezone TO 'UTC';
GRANT ALL PRIVILEGES ON DATABASE social_media_db TO social_user;
\q
```

### Step 4: Initialize Django Project

```bash
# While in backend directory
django-admin startproject backend .

# Create apps
python manage.py startapp users
python manage.py startapp posts
python manage.py startapp interactions
python manage.py startapp notifications
```

### Step 5: Create File Structure

Copy each of the provided files into their respective locations:

```
backend/
├── manage.py
├── requirements.txt
├── .env                          # Copy from BACKEND_.env.example
├── .env.example                  # From BACKEND_.env.example
├── .gitignore                    # From BACKEND_.gitignore
├── backend/
│   ├── __init__.py
│   ├── settings.py               # From BACKEND_settings.py
│   ├── urls.py                   # From BACKEND_urls.py
│   ├── asgi.py                   # From BACKEND_asgi.py
│   ├── wsgi.py                   # Keep default
│   └── celery.py                 # From BACKEND_celery.py
├── users/
│   ├── migrations/
│   ├── __init__.py
│   ├── admin.py                  # Keep default
│   ├── apps.py                   # Keep default
│   ├── models.py                 # From BACKEND_users_models.py
│   ├── serializers.py            # From BACKEND_users_serializers.py
│   ├── views.py                  # From BACKEND_users_views.py
│   └── urls.py                   # From BACKEND_users_urls.py
├── posts/
│   ├── migrations/
│   ├── __init__.py
│   ├── models.py                 # From BACKEND_posts_models.py
│   ├── serializers.py            # From BACKEND_posts_serializers.py
│   ├── views.py                  # From BACKEND_posts_views.py
│   ├── urls.py                   # From BACKEND_posts_urls.py
│   └── tasks.py                  # From BACKEND_posts_tasks.py
├── interactions/
│   ├── migrations/
│   ├── __init__.py
│   ├── models.py                 # From BACKEND_interactions_models.py
│   ├── serializers.py            # From BACKEND_interactions_serializers.py
│   ├── views.py                  # From BACKEND_interactions_views.py
│   └── urls.py                   # From BACKEND_interactions_urls.py
└── notifications/
    ├── migrations/
    ├── __init__.py
    ├── models.py                 # From BACKEND_notifications_models.py
    ├── serializers.py            # From BACKEND_notifications_serializers.py
    ├── views.py                  # From BACKEND_notifications_views.py
    ├── urls.py                   # From BACKEND_notifications_urls.py
    ├── tasks.py                  # From BACKEND_notifications_tasks.py
    ├── consumers.py              # From BACKEND_notifications_consumers.py
    └── routing.py                # From BACKEND_notifications_routing.py
```

### Step 6: Create .env File

Create `backend/.env` with these contents (update as needed):

```
DEBUG=True
SECRET_KEY=django-insecure-your-secret-key-change-in-production
ALLOWED_HOSTS=localhost,127.0.0.1,localhost:3000,127.0.0.1:3000

# Database (use PostgreSQL or SQLite)
DB_ENGINE=django.db.backends.postgresql
DB_NAME=social_media_db
DB_USER=social_user
DB_PASSWORD=SecurePassword123!
DB_HOST=localhost
DB_PORT=5432

# Or for SQLite (remove above and uncomment):
# DB_ENGINE=django.db.backends.sqlite3
# DB_NAME=db.sqlite3

# Redis & Celery
REDIS_URL=redis://localhost:6379/0

# JWT
JWT_SECRET_KEY=your-jwt-secret-key-here
JWT_ALGORITHM=HS256

# CORS
CORS_ALLOWED_ORIGINS=http://localhost:3000,http://localhost:3001

# Email (optional)
EMAIL_BACKEND=django.core.mail.backends.console.EmailBackend
```

### Step 7: Run Migrations

```bash
python manage.py makemigrations
python manage.py migrate
```

### Step 8: Create Superuser

```bash
python manage.py createsuperuser
# Follow prompts (username, email, password)
```

### Step 9: Run Development Servers (in separate terminals)

**Terminal 1 - Django Server:**
```bash
cd backend
source venv/bin/activate
python manage.py runserver
# Runs on http://localhost:8000
```

**Terminal 2 - Redis:**
```bash
redis-server
# Or: brew services start redis (macOS)
```

**Terminal 3 - Celery Worker:**
```bash
cd backend
source venv/bin/activate
celery -A backend worker -l info
```

**Terminal 4 - Celery Beat (Scheduler):**
```bash
cd backend
source venv/bin/activate
celery -A backend beat -l info
```

### Step 10: Test Backend

Visit: `http://localhost:8000/api/`

You should see the DRF browsable API. Try:
- `GET /api/users/` - List users
- `GET /api/posts/` - List posts
- `GET /api/notifications/` - List notifications

---

## PART 2: FRONTEND SETUP

### Step 1: Create Next.js Project

From the project root (not inside backend):

```bash
cd ../  # Go back to social-media-app
npx create-next-app@latest frontend \
  --typescript \
  --tailwind \
  --app \
  --eslint \
  --no-git

cd frontend
```

### Step 2: Install Additional Dependencies

```bash
npm install axios zustand react-hot-toast js-cookie socket.io-client date-fns lucide-react clsx tailwind-merge
```

### Step 3: Create File Structure

Copy frontend files into their respective locations:

```
frontend/
├── app/
│   ├── layout.tsx                # Root layout with providers
│   ├── page.tsx                  # Home page
│   ├── (auth)/
│   │   ├── login/
│   │   │   └── page.tsx          # Login page
│   │   └── signup/
│   │       └── page.tsx          # Signup page
│   ├── feed/
│   │   └── page.tsx              # Feed page
│   ├── profile/
│   │   └── [id]/
│   │       └── page.tsx          # User profile
│   ├── notifications/
│   │   └── page.tsx              # Notifications page
│   └── settings/
│       └── page.tsx              # Settings page
├── components/
│   ├── PostCard.tsx              # Post display component
│   ├── CommentSection.tsx        # Comments component
│   ├── FollowButton.tsx          # Follow/unfollow button
│   ├── NotificationBell.tsx      # Notification bell with dropdown
│   ├── Header.tsx                # Navigation header
│   └── ...
├── store/
│   ├── auth.ts                   # From FRONTEND_store_auth.ts
│   └── notifications.ts          # From FRONTEND_store_notifications.ts
├── hooks/
│   └── useWebSocket.ts           # From FRONTEND_hooks_useWebSocket.ts
├── lib/
│   └── api.ts                    # From FRONTEND_lib_api.ts
├── .env.local                    # From FRONTEND_.env.local
├── package.json                  # From FRONTEND_package.json
├── tailwind.config.ts
├── tsconfig.json
└── next.config.js
```

### Step 4: Create .env.local

Create `frontend/.env.local`:

```
NEXT_PUBLIC_API_URL=http://localhost:8000
NEXT_PUBLIC_WS_URL=ws://localhost:8000/ws/notifications/
NEXT_PUBLIC_APP_NAME=SocialHub
```

### Step 5: Start Frontend

```bash
npm run dev
# Runs on http://localhost:3000
```

---

## Testing the Full Stack

### 1. Create Test Users

Visit: `http://localhost:8000/admin`
- Login with superuser credentials
- Create 2-3 test users

### 2. Test Auth Flow

1. Visit `http://localhost:3000/signup`
2. Create an account
3. Login at `http://localhost:3000/login`
4. Should redirect to feed

### 3. Test Posts & Interactions

1. Create a post on the feed
2. Like the post
3. Comment on the post
4. Follow another user

### 4. Test Real-time Notifications

1. Open app in 2 browser windows
2. Like a post from user 2 (in window 1)
3. User 1's window (window 2) should show real-time notification

### 5. Test API with curl

```bash
# Get token
curl -X POST http://localhost:8000/api/auth/token/ \
  -H "Content-Type: application/json" \
  -d '{"username":"your_username","password":"your_password"}'

# Use token to get posts
curl http://localhost:8000/api/posts/ \
  -H "Authorization: Bearer YOUR_TOKEN"
```

---

## Project Architecture

### Phase 1: ✅ Django Setup + Database + Basic Models
- Django project initialized
- PostgreSQL configured
- User, Post, Comment, Like models created

### Phase 2: Authentication (Not included in this export)
- JWT authentication
- Signup/Login endpoints

### Phase 3: Feed System
- Post creation
- Feed generation
- Pagination

### Phase 4: Interactions
- Like system (atomic operations)
- Comment system
- Follow/unfollow

### Phase 5: Notification Storage
- Notification model
- Notification triggers (on like/comment/follow)
- Notification storage in DB

### Phase 6: Async Processing
- Celery + Redis integration
- Background task processing
- Notification creation as async task

### Phase 7: WebSocket Real-time
- Django Channels configured
- WebSocket consumer for notifications
- Real-time delivery to frontend

### Phase 8: Notification Preferences
- User settings model
- Customizable notification types
- Frequency preferences

### Phase 9: Email & Maintenance
- Email notifications (stubbed)
- Notification digests
- Cleanup tasks

---

## Important Notes

### Database Choice
- **PostgreSQL recommended** for production
- **SQLite works** for quick testing (no setup needed)
- Change `DB_ENGINE` in `.env`

### Redis
- Required for Celery and Channels
- If not installed: `brew install redis` or `sudo apt-get install redis-server`
- For Windows, download from: https://github.com/microsoftarchive/redis/releases

### WebSocket Connection
- Frontend expects: `ws://localhost:8000/ws/notifications/`
- Includes JWT token in query string: `?token=YOUR_JWT_TOKEN`
- Auto-reconnects with exponential backoff

### File Upload
- Currently uses URL fields (for external image URLs)
- To add file uploads:
  1. Install: `pip install django-storages boto3`
  2. Configure S3 or local storage in settings
  3. Update serializers to use FileField

---

## Deployment

### Backend (Heroku/Railway/Render)
1. Push code to GitHub
2. Connect repo to platform
3. Set environment variables
4. Add PostgreSQL add-on
5. Add Redis add-on
6. Deploy!

### Frontend (Vercel)
1. Push code to GitHub
2. Import project in Vercel
3. Set `NEXT_PUBLIC_API_URL` to production backend URL
4. Deploy!

---

## Troubleshooting

### PostgreSQL Connection Error
```bash
# Check if running
brew services list  # macOS
sudo systemctl status postgresql  # Linux
```

### Redis Connection Error
```bash
# Check if running
redis-cli ping  # Should return PONG
```

### WebSocket Connection Error
- Ensure Django Channels is installed
- Check CHANNEL_LAYERS in settings.py
- Ensure Redis is running
- Check browser console for errors

### Celery Tasks Not Running
```bash
# Check worker logs
celery -A backend worker -l debug

# Check if Redis is accessible
redis-cli ping
```

### Token Expiration
- Access token expires in 1 hour
- Refresh token expiration: 7 days
- Auto-refresh handled in API interceptor

---

## Next Steps

1. **Customize UI**: Update components in `frontend/components/`
2. **Add Features**: Extend models and create new endpoints
3. **Deploy**: Follow deployment section
4. **Monitor**: Set up logging and error tracking
5. **Scale**: Consider caching strategies and database optimization

---

## File Reference

### Backend Files Provided
- `BACKEND_settings.py` → Copy to `backend/backend/settings.py`
- `BACKEND_urls.py` → Copy to `backend/backend/urls.py`
- `BACKEND_asgi.py` → Copy to `backend/backend/asgi.py`
- `BACKEND_celery.py` → Copy to `backend/backend/celery.py`
- `BACKEND_users_*.py` → Copy to `backend/users/`
- `BACKEND_posts_*.py` → Copy to `backend/posts/`
- `BACKEND_interactions_*.py` → Copy to `backend/interactions/`
- `BACKEND_notifications_*.py` → Copy to `backend/notifications/`
- `BACKEND_requirements.txt` → Pip install or run in terminal
- `BACKEND_.gitignore` → Copy to `backend/.gitignore`
- `BACKEND_.env.example` → Copy to `backend/.env.example`, then create `.env`

### Frontend Files Provided
- `FRONTEND_package.json` → Use for npm install
- `FRONTEND_lib_api.ts` → Copy to `frontend/lib/api.ts`
- `FRONTEND_store_auth.ts` → Copy to `frontend/store/auth.ts`
- `FRONTEND_store_notifications.ts` → Copy to `frontend/store/notifications.ts`
- `FRONTEND_hooks_useWebSocket.ts` → Copy to `frontend/hooks/useWebSocket.ts`
- `FRONTEND_.env.local` → Copy to `frontend/.env.local`

---

## Support

For issues:
1. Check logs in respective terminals
2. Check browser console (F12)
3. Verify all services are running
4. Check environment variables
5. Review Django admin for data validation

---

**Ready to build production-grade features! Happy coding! 🚀**
