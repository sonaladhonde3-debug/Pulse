# Full-Stack Social Media App - Django + Next.js

## Project Setup Guide

This package contains complete source code for a production-ready social media application with real-time notifications.

---

## PART 1: DJANGO BACKEND SETUP

### Prerequisites
- Python 3.10+
- PostgreSQL
- Redis
- Node.js (for frontend)

### Step 1: Create project structure

```bash
mkdir social-media-app
cd social-media-app

# Create backend folder
mkdir backend
cd backend

# Create virtual environment
python3 -m venv venv
source venv/bin/activate  # On Windows: venv\Scripts\activate
```

### Step 2: Install dependencies

```bash
pip install --upgrade pip

# Django core
pip install django==4.2.8
pip install djangorestframework==3.14.0
pip install django-cors-headers==4.3.1
pip install psycopg2-binary==2.9.9
pip install python-dotenv==1.0.0

# Async & Real-time
pip install celery==5.3.4
pip install redis==5.0.1
pip install django-celery-beat==2.5.0
pip install django-celery-results==2.5.1
pip install channels==4.0.0
pip install channels-redis==4.1.0
pip install daphne==4.0.0

# Auth
pip install djangorestframework-simplejwt==5.3.2

# Utils
pip install django-filter==23.5
pip install Pillow==10.1.0

# Create requirements.txt
pip freeze > requirements.txt
```

### Step 3: Initialize Django project

```bash
django-admin startproject backend .

# Create apps
python manage.py startapp users
python manage.py startapp posts
python manage.py startapp interactions
python manage.py startapp notifications
```

### Step 4: Configure PostgreSQL

```bash
# Connect to PostgreSQL
psql postgres

# In psql:
CREATE DATABASE social_media_db;
CREATE USER social_user WITH PASSWORD 'SecurePassword123!';
ALTER ROLE social_user SET client_encoding TO 'utf8';
ALTER ROLE social_user SET default_transaction_isolation TO 'read committed';
ALTER ROLE social_user SET default_transaction_deferrable TO on;
ALTER ROLE social_user SET timezone TO 'UTC';
GRANT ALL PRIVILEGES ON DATABASE social_media_db TO social_user;
ALTER USER social_user CREATEDB;
\q
```

### Step 5: Create .env file

Create `backend/.env`:

```
DEBUG=True
SECRET_KEY=django-insecure-your-secret-key-change-in-production
ALLOWED_HOSTS=localhost,127.0.0.1,localhost:3000,127.0.0.1:3000

# Database
DB_ENGINE=django.db.backends.postgresql
DB_NAME=social_media_db
DB_USER=social_user
DB_PASSWORD=SecurePassword123!
DB_HOST=localhost
DB_PORT=5432

# Redis & Celery
REDIS_URL=redis://localhost:6379/0
CELERY_BROKER_URL=redis://localhost:6379/0

# JWT
JWT_SECRET_KEY=your-jwt-secret-key-here
JWT_ALGORITHM=HS256

# Email (optional, for Phase 9)
EMAIL_BACKEND=django.core.mail.backends.console.EmailBackend
EMAIL_HOST=smtp.gmail.com
EMAIL_PORT=587
EMAIL_USE_TLS=True
EMAIL_HOST_USER=your-email@gmail.com
EMAIL_HOST_PASSWORD=your-app-password
```

### Step 6: Copy all backend files

Copy the provided Django app files into their respective directories.

### Step 7: Run migrations

```bash
python manage.py makemigrations
python manage.py migrate
```

### Step 8: Create superuser

```bash
python manage.py createsuperuser
# Follow prompts
```

### Step 9: Start Redis (in another terminal)

```bash
redis-server
```

### Step 10: Start Celery worker (in another terminal)

```bash
cd backend
source venv/bin/activate
celery -A backend worker -l info
```

### Step 11: Start Celery Beat (in another terminal)

```bash
cd backend
source venv/bin/activate
celery -A backend beat -l info
```

### Step 12: Start Django development server

```bash
cd backend
source venv/bin/activate
python manage.py runserver
```

Visit: `http://localhost:8000/api/`

---

## PART 2: NEXT.JS FRONTEND SETUP

### Step 1: Create Next.js project (from project root)

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

### Step 2: Install additional dependencies

```bash
npm install axios
npm install react-hot-toast
npm install zustand
npm install js-cookie
npm install next-auth
npm install socket.io-client
npm install date-fns
npm install lucide-react
npm install clsx
npm install tailwind-merge
```

### Step 3: Copy all frontend files

Copy the provided Next.js app files into the appropriate directories.

### Step 4: Create .env.local

Create `frontend/.env.local`:

```
NEXT_PUBLIC_API_URL=http://localhost:8000
NEXT_PUBLIC_WS_URL=ws://localhost:8000
```

### Step 5: Start Next.js development server

```bash
npm run dev
```

Visit: `http://localhost:3000`

---

## Testing the Full Stack

### Create test data:

1. Visit `http://localhost:8000/admin`
2. Login with superuser credentials
3. Create test users
4. Create test posts

### Test API endpoints:

```bash
# Get all users
curl http://localhost:8000/api/users/

# Get all posts
curl http://localhost:8000/api/posts/

# Get notifications for user
curl http://localhost:8000/api/notifications/ \
  -H "Authorization: Bearer <your-jwt-token>"
```

### Test frontend:

1. Visit `http://localhost:3000`
2. Sign up / Login
3. Create posts
4. Like/comment posts
5. Follow users
6. Check real-time notifications

---

## Project Architecture

### Backend Flow (Event-Driven)

```
User Action → API Endpoint
    ↓
Validate & Save to Database
    ↓
Send Event to Redis Queue
    ↓
Celery Worker Processes Event
    ↓
Create Notification in Database
    ↓
WebSocket broadcasts to connected clients
    ↓
Frontend receives real-time update
```

### Frontend Flow

```
User Action (Like, Comment, Follow)
    ↓
Axios API Call to Backend
    ↓
Update Local State (Zustand)
    ↓
WebSocket listens for real-time updates
    ↓
UI Updates
```

---

## File Structure Reference

### Backend Files Included:

1. **backend/settings.py** - Complete Django configuration
2. **backend/asgi.py** - Django Channels ASGI config
3. **backend/celery.py** - Celery configuration
4. **backend/urls.py** - Main URL routing
5. **users/** - User authentication & profile management
6. **posts/** - Post creation & retrieval
7. **interactions/** - Likes & comments
8. **notifications/** - Real-time notifications

### Frontend Files Included:

1. **app/layout.tsx** - Root layout with providers
2. **app/(auth)/login** - Login page
3. **app/(auth)/signup** - Signup page
4. **app/feed** - Main feed page
5. **app/profile/[id]** - User profile page
6. **app/notifications** - Notifications page
7. **components/** - Reusable components
8. **lib/** - Utilities & API client
9. **store/** - Zustand state management
10. **hooks/** - Custom React hooks

---

## Deployment Notes

### Backend Deployment (Heroku/Railway/Render):
1. Push to GitHub
2. Connect to Heroku/Railway
3. Set environment variables
4. Add PostgreSQL add-on
5. Add Redis add-on
6. Ensure `Procfile` is configured for workers

### Frontend Deployment (Vercel):
1. Push to GitHub
2. Import project in Vercel
3. Set `NEXT_PUBLIC_API_URL` to production backend URL
4. Deploy

---

## Troubleshooting

### PostgreSQL Connection Error
```bash
# Check if PostgreSQL is running
brew services list  # macOS
sudo systemctl status postgresql  # Linux
```

### Redis Connection Error
```bash
# Check if Redis is running
redis-cli ping  # Should return PONG
```

### Celery Tasks Not Processing
```bash
# Check Celery worker logs for errors
celery -A backend worker -l debug
```

### WebSocket Connection Error
```bash
# Ensure Django Channels is properly configured
# Check CHANNEL_LAYERS in settings.py
# Ensure Redis is running
```

---

## Next Steps After Setup

1. Test all endpoints with Postman/Insomnia
2. Test real-time notifications with WebSocket client
3. Deploy to staging
4. Load testing with Locust
5. Monitor with tools like New Relic or Datadog

---

**Ready to build production-grade features!**
