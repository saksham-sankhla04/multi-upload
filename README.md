# Multi-Post

A simple multi-platform social media posting app. Post to LinkedIn (and Twitter) in one click.

## Setup

### Backend
```bash
cd backend
npm install
```

Edit the service files with your API credentials:
- `services/twitter.service.js` - Twitter API keys
- `services/linkedin.service.js` - LinkedIn access token

```bash
npm start
```

### Frontend
```bash
cd frontend
npm install
npm run dev
```

Open http://localhost:5173

## Getting API Credentials

### LinkedIn
1. Create app at https://www.linkedin.com/developers/
2. Run `node linkedin-auth.js` to get access token
3. Paste token in `linkedin.service.js`

### Twitter
1. Create app at https://developer.twitter.com/
2. Get API Key, Secret, Access Token, Access Secret
3. Paste in `twitter.service.js`
