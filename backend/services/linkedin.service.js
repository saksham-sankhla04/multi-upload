// LinkedIn Personal Profile Posting with media support
// Credentials passed as parameters (from database)

async function getPersonUrn(accessToken) {
  const res = await fetch('https://api.linkedin.com/v2/userinfo', {
    headers: { 'Authorization': `Bearer ${accessToken}` },
  });
  if (!res.ok) throw new Error('Failed to fetch LinkedIn profile');
  const profile = await res.json();
  return `urn:li:person:${profile.sub}`;
}

async function uploadImage(accessToken, personUrn, file) {
  // Step 1: Register upload
  const registerRes = await fetch('https://api.linkedin.com/v2/assets?action=registerUpload', {
    method: 'POST',
    headers: {
      'Authorization': `Bearer ${accessToken}`,
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({
      registerUploadRequest: {
        recipes: ['urn:li:digitalmediaRecipe:feedshare-image'],
        owner: personUrn,
        serviceRelationships: [{
          relationshipType: 'OWNER',
          identifier: 'urn:li:userGeneratedContent',
        }],
      },
    }),
  });

  if (!registerRes.ok) {
    const err = await registerRes.json();
    throw new Error(`Register upload failed: ${JSON.stringify(err)}`);
  }

  const registerData = await registerRes.json();
  const uploadUrl = registerData.value.uploadMechanism['com.linkedin.digitalmedia.uploading.MediaUploadHttpRequest'].uploadUrl;
  const asset = registerData.value.asset;

  // Step 2: Upload the binary
  const uploadRes = await fetch(uploadUrl, {
    method: 'PUT',
    headers: {
      'Authorization': `Bearer ${accessToken}`,
      'Content-Type': file.mimetype,
    },
    body: file.buffer,
  });

  if (!uploadRes.ok) {
    throw new Error(`Image upload failed with status ${uploadRes.status}`);
  }

  return asset;
}

export async function postToLinkedIn(accessToken, content, mediaFiles = []) {
  try {
    const personUrn = await getPersonUrn(accessToken);
    const images = mediaFiles.filter((f) => f.mimetype.startsWith('image/'));

    const mediaAssets = [];
    for (const img of images) {
      const asset = await uploadImage(accessToken, personUrn, img);
      mediaAssets.push(asset);
    }

    const hasMedia = mediaAssets.length > 0;
    const shareContent = {
      shareCommentary: { text: content },
      shareMediaCategory: hasMedia ? 'IMAGE' : 'NONE',
    };

    if (hasMedia) {
      shareContent.media = mediaAssets.map((asset) => ({
        status: 'READY',
        media: asset,
      }));
    }

    const response = await fetch('https://api.linkedin.com/v2/ugcPosts', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${accessToken}`,
        'Content-Type': 'application/json',
        'X-Restli-Protocol-Version': '2.0.0',
      },
      body: JSON.stringify({
        author: personUrn,
        lifecycleState: 'PUBLISHED',
        specificContent: { 'com.linkedin.ugc.ShareContent': shareContent },
        visibility: { 'com.linkedin.ugc.MemberNetworkVisibility': 'PUBLIC' },
      }),
    });

    if (!response.ok) {
      const errorData = await response.json();
      return { success: false, error: JSON.stringify(errorData) };
    }

    const data = await response.json();
    return { success: true, id: data.id };
  } catch (error) {
    return { success: false, error: error.message };
  }
}
