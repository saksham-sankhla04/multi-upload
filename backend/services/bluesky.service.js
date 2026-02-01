// Bluesky Posting with media support
// Credentials passed as parameters (from database)

async function login(handle, appPassword) {
  const res = await fetch('https://bsky.social/xrpc/com.atproto.server.createSession', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ identifier: handle, password: appPassword }),
  });
  if (!res.ok) {
    const err = await res.json();
    throw new Error(`Login failed: ${err.message}`);
  }
  return res.json();
}

async function uploadBlob(session, file) {
  const res = await fetch('https://bsky.social/xrpc/com.atproto.repo.uploadBlob', {
    method: 'POST',
    headers: {
      'Authorization': `Bearer ${session.accessJwt}`,
      'Content-Type': file.mimetype,
    },
    body: file.buffer,
  });
  if (!res.ok) {
    const err = await res.json();
    throw new Error(`Blob upload failed: ${err.message}`);
  }
  const data = await res.json();
  return data.blob;
}

export async function postToBluesky(handle, appPassword, content, mediaFiles = []) {
  try {
    const session = await login(handle, appPassword);
    const images = mediaFiles.filter((f) => f.mimetype.startsWith('image/'));

    const record = {
      text: content,
      createdAt: new Date().toISOString(),
    };

    if (images.length > 0) {
      const uploadedImages = [];
      for (const img of images.slice(0, 4)) {
        const blob = await uploadBlob(session, img);
        uploadedImages.push({ alt: img.originalname || '', image: blob });
      }
      record.embed = {
        $type: 'app.bsky.embed.images',
        images: uploadedImages,
      };
    }

    const postRes = await fetch('https://bsky.social/xrpc/com.atproto.repo.createRecord', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${session.accessJwt}`,
      },
      body: JSON.stringify({
        repo: session.did,
        collection: 'app.bsky.feed.post',
        record,
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
