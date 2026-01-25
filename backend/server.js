import 'dotenv/config';
import express from 'express';
import cors from 'cors';
import { postToTwitter } from './services/twitter.service.js';
import { postToLinkedIn } from './services/linkedin.service.js';

const app = express();
app.use(cors());
app.use(express.json());

app.post('/publish', async (req, res) => {
  const { content, platforms } = req.body;

  if (!content || !platforms || platforms.length === 0) {
    return res.status(400).json({ error: 'Content and at least one platform required' });
  }

  const results = {};

  for (const platform of platforms) {
    if (platform === 'twitter') {
      results.twitter = await postToTwitter(content);
    } else if (platform === 'linkedin') {
      results.linkedin = await postToLinkedIn(content);
    }
  }

  res.json({ results });
});

const PORT = 3001;
app.listen(PORT, () => {
  console.log(`Backend running on http://localhost:${PORT}`);
});
