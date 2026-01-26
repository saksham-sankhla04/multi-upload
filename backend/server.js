import 'dotenv/config';
import express from 'express';
import cors from 'cors';
import { postToLinkedIn } from './services/linkedin.service.js';
import { postToBluesky } from './services/bluesky.service.js';

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
    if (platform === 'linkedin') {
      results.linkedin = await postToLinkedIn(content);
    } else if (platform === 'bluesky') {
      results.bluesky = await postToBluesky(content);
    }
  }

  res.json({ results });
});

const PORT = 3001;
app.listen(PORT, () => {
  console.log(`Backend running on http://localhost:${PORT}`);
});
