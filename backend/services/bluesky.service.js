// Bluesky Posting - Simple auth with username + app password

const BLUESKY_HANDLE = process.env.BLUESKY_HANDLE;       // e.g., "yourname.bsky.social"
const BLUESKY_APP_PASSWORD = process.env.BLUESKY_APP_PASSWORD; // Generate at Settings > App Passwords

export async function postToBluesky(content) {
  try {
    // Login to get session
    const loginRes = await fetch('https://bsky.social/xrpc/com.atproto.server.createSession', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        identifier: BLUESKY_HANDLE,
        password: BLUESKY_APP_PASSWORD,
      }),
    });

    if (!loginRes.ok) {
      const err = await loginRes.json();
      return { success: false, error: `Login failed: ${err.message}` };
    }

    const session = await loginRes.json();

    // Create post
    const postRes = await fetch('https://bsky.social/xrpc/com.atproto.repo.createRecord', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${session.accessJwt}`,
      },
      body: JSON.stringify({
        repo: session.did,
        collection: 'app.bsky.feed.post',
        record: {
          text: content,
          createdAt: new Date().toISOString(),
        },
      }),
    });

    if (!postRes.ok) {
      const err = await postRes.json();
      return { success: false, error: err.message };
    }

    const data = await postRes.json();
    return { success: true, id: data.uri };
  } catch (error) {
    return { success: false, error: error.message };
  }
}
