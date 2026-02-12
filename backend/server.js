import "dotenv/config";
import express from "express";
import cors from "cors";
import session from "express-session";
import multer from "multer";
import db from "./db.js";
import authRoutes from "./routes/auth.js";
import settingsRoutes from "./routes/settings.js";
import { requireAuth } from "./middleware/auth.js";
import { postToLinkedIn } from "./services/linkedin.service.js";
import { postToBluesky } from "./services/bluesky.service.js";
import { getValidLinkedInToken } from "./services/linkedin-token.service.js";

const upload = multer({
  storage: multer.memoryStorage(),
  limits: { fileSize: 10 * 1024 * 1024 },
});

const app = express();
const isProduction = process.env.NODE_ENV === "production";

// Trust proxy for HTTPS behind Render/Railway
if (isProduction) {
  app.set("trust proxy", 1);
}

// CORS configuration
const allowedOrigins = [
  process.env.FRONTEND_URL,
  "http://localhost:5173",
].filter(Boolean);

app.use(
  cors({
    origin: (origin, callback) => {
      // Allow requests with no origin (mobile apps, curl, etc.)
      if (!origin) return callback(null, true);
      if (allowedOrigins.includes(origin)) {
        return callback(null, true);
      }
      return callback(new Error("Restricted by CORS"));
    },
    credentials: true,
  })
);

app.use(express.json());

// Session configuration
app.use(
  session({
    secret: process.env.SESSION_SECRET || "dev-secret-change-in-production",
    resave: false,
    saveUninitialized: false,
    cookie: {
      secure: isProduction, // HTTPS only in production
      httpOnly: true,
      maxAge: 7 * 24 * 60 * 60 * 1000,
      sameSite: isProduction ? "none" : "lax", // 'none' required for cross-site cookies
    },
  })
);

// Health check endpoint for Render
app.get("/health", (req, res) => {
  res.json({ status: "ok", timestamp: new Date().toISOString() });
});

// Routes
app.use("/auth", authRoutes);
app.use("/settings", settingsRoutes);

// Publish endpoint - reads credentials from DB per user
app.post(
  "/publish",
  requireAuth,
  upload.array("media", 4),
  async (req, res) => {
    const content = req.body.content || "";
    const platforms = JSON.parse(req.body.platforms || "[]");
    const mediaFiles = (req.files || []).map((f) => ({
      buffer: f.buffer,
      mimetype: f.mimetype,
      originalname: f.originalname,
      size: f.size,
    }));

    if (!content.trim() && mediaFiles.length === 0) {
      return res.status(400).json({ error: "Content or media required" });
    }
    if (platforms.length === 0) {
      return res.status(400).json({ error: "At least one platform required" });
    }

    const userId = req.session.userId;
    const results = {};

    for (const platform of platforms) {
      const account = db
        .prepare(
          "SELECT * FROM connected_accounts WHERE user_id = ? AND platform = ?"
        )
        .get(userId, platform);

      if (!account) {
        results[platform] = {
          success: false,
          error: `${platform} not connected. Go to Settings.`,
        };
        continue;
      }

      if (platform === "linkedin") {
        try {
          // Get valid token (automatically refreshes if expired)
          const { accessToken, refreshed } = await getValidLinkedInToken(
            userId
          );
          if (refreshed) {
            console.log(`LinkedIn token refreshed for user ${userId}`);
          }
          results.linkedin = await postToLinkedIn(
            accessToken,
            content,
            mediaFiles
          );
        } catch (tokenError) {
          results.linkedin = { success: false, error: tokenError.message };
        }
      } else if (platform === "bluesky") {
        results.bluesky = await postToBluesky(
          account.handle,
          account.app_password,
          content,
          mediaFiles
        );
      }
    }

    res.json({ results });
  }
);

const PORT = process.env.PORT || 3001;
app.listen(PORT, () => {
  console.log(
    `Backend running on port ${PORT} (${
      isProduction ? "production" : "development"
    })`
  );
});
