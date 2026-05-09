# Pulse 

This workspace now contains a self-contained browser app inspired by the `pulse_product_document.docx` product specification.

## What it includes

- Login and signup flows stored in local browser state
- Feed with post composer, likes, comments, delete, and progressive loading
- Profile pages with follower and following summaries
- Explore page with user search and trending posts
- Notifications page with unread badge, filter, and mark-all-read flow
- Settings page with profile editing, password change, and notification preferences
- Simulated real-time notification delivery with toasts and auto-generated events

## How to run

Open `index.html` in a browser.

## Demo login

- Email: `maya@pulse.app`
- Password: `Pulse123`

## Notes

- Data is stored in `localStorage`, so your changes persist in the browser.
- The live notification pipeline is simulated in the frontend to match the product behavior from the specification.
- This is a frontend MVP rather than the full Django, Redis, Celery, and WebSocket production stack described in the document.
