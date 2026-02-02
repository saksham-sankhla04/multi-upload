# Multi-Post

A multi-platform social media posting app. Sign up, connect your social accounts, and post to multiple platforms in one click.

## Supported Platforms

| Platform | Auth Method | Media Support |
|----------|-------------|---------------|
| LinkedIn | OAuth 2.0 | Images |
| Bluesky | App Password | Images |

## Tech Stack

- **Frontend**: React + Vite + React Router
- **Backend**: Node.js + Express
- **Database**: SQLite (better-sqlite3)
- **Auth**: Session-based (express-session + bcryptjs)

## Setup

### 1. Backend

```bash
cd backend
cp .env.example .env
# Edit .env with your LinkedIn app credentials
npm install
npm start
```

Runs on http://localhost:3001

### 2. Frontend

```bash
cd frontend
npm install
npm run dev
```

Runs on http://localhost:5173

## Environment Variables

Create `backend/.env` from `.env.example`:

```env
LINKEDIN_CLIENT_ID=your_client_id
LINKEDIN_CLIENT_SECRET=your_client_secret
SESSION_SECRET=your-secret-here
```

## LinkedIn App Setup

1. Create app at https://www.linkedin.com/developers/
2. Add redirect URI: `http://localhost:3001/settings/linkedin/callback`
3. Request "Sign In with LinkedIn using OpenID Connect" and "Share on LinkedIn" products
4. Link a Company Page and verify

## How It Works

1. Sign up with email + password
2. Go to **Settings** to connect accounts:
   - **LinkedIn**: Click "Connect LinkedIn" (OAuth flow)
   - **Bluesky**: Enter handle + app password
3. Go to **Post** page, write content, attach images, select platforms
4. Click **Post Now** - content publishes to all selected platforms

## Project Structure

```
multi-upload/
├── backend/
│   ├── server.js              # Express server + /publish endpoint
│   ├── db.js                  # SQLite database init
│   ├── middleware/auth.js     # Auth middleware
│   ├── routes/
│   │   ├── auth.js            # Signup, login, logout
│   │   └── settings.js        # Account connection (OAuth + Bluesky)
│   └── services/
│       ├── linkedin.service.js
│       └── bluesky.service.js
└── frontend/
    └── src/
        ├── App.jsx            # Routing shell + auth state
        └── pages/
            ├── LoginPage.jsx
            ├── PostPage.jsx
            └── SettingsPage.jsx
```
