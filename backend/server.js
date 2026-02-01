import 'dotenv/config';
import express from 'express';
import cors from 'cors';
import session from 'express-session';
import multer from 'multer';
import db from './db.js';
import authRoutes from './routes/auth.js';
import settingsRoutes from './routes/settings.js';
import { requireAuth } from './middleware/auth.js';
import { postToLinkedIn } from './services/linkedin.service.js';
import { postToBluesky } from './services/bluesky.service.js';

const upload = multer({ storage: multer.memoryStorage(), limits: { fileSize: 10 * 1024 * 1024 } });

const app = express();

app.use(cors({
  origin: 'http://localhost:5173',
  credentials: true,
}));
app.use(express.json());
app.use(session({
  secret: process.env.SESSION_SECRET || 'dev-secret-change-in-production',
  resave: false,
  saveUninitialized: false,
  cookie: {
    secure: false,
    httpOnly: true,
    maxAge: 7 * 24 * 60 * 60 * 1000,
    sameSite: 'lax',
  },
}));

// Routes
app.use('/auth', authRoutes);
app.use('/settings', settingsRoutes);

// Publish endpoint - reads credentials from DB per user
app.post('/publish', requireAuth, upload.array('media', 4), async (req, res) => {
  const content = req.body.content || '';
  const platforms = JSON.parse(req.body.platforms || '[]');
  const mediaFiles = (req.files || []).map((f) => ({
    buffer: f.buffer,
    mimetype: f.mimetype,
    originalname: f.originalname,
    size: f.size,
  }));

  if (!content.trim() && mediaFiles.length === 0) {
    return res.status(400).json({ error: 'Content or media required' });
  }
  if (platforms.length === 0) {
    return res.status(400).json({ error: 'At least one platform required' });
  }

  const userId = req.session.userId;
  const results = {};

  for (const platform of platforms) {
    const account = db.prepare(
      'SELECT * FROM connected_accounts WHERE user_id = ? AND platform = ?'
    ).get(userId, platform);

    if (!account) {
      results[platform] = { success: false, error: `${platform} not connected. Go to Settings.` };
      continue;
    }

    if (platform === 'linkedin') {
      results.linkedin = await postToLinkedIn(account.access_token, content, mediaFiles);
    } else if (platform === 'bluesky') {
      results.bluesky = await postToBluesky(account.handle, account.app_password, content, mediaFiles);
    }
  }

  res.json({ results });
});

const PORT = 3001;
app.listen(PORT, () => {
  console.log(`Backend running on http://localhost:${PORT}`);
});
