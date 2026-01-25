// LinkedIn Personal Profile Posting (w_member_social)
const ACCESS_TOKEN = process.env.LINKEDIN_ACCESS_TOKEN;

export async function postToLinkedIn(content) {
  try {
    // First get user's profile to get their URN
    const profileRes = await fetch('https://api.linkedin.com/v2/userinfo', {
      headers: { 'Authorization': `Bearer ${ACCESS_TOKEN}` },
    });

    if (!profileRes.ok) {
      const err = await profileRes.json();
      return { success: false, error: `Profile fetch failed: ${JSON.stringify(err)}` };
    }

    const profile = await profileRes.json();
    const personUrn = `urn:li:person:${profile.sub}`;

    // Post to personal profile
    const response = await fetch('https://api.linkedin.com/v2/ugcPosts', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${ACCESS_TOKEN}`,
        'Content-Type': 'application/json',
        'X-Restli-Protocol-Version': '2.0.0',
      },
      body: JSON.stringify({
        author: personUrn,
        lifecycleState: 'PUBLISHED',
        specificContent: {
          'com.linkedin.ugc.ShareContent': {
            shareCommentary: { text: content },
            shareMediaCategory: 'NONE',
          },
        },
        visibility: {
          'com.linkedin.ugc.MemberNetworkVisibility': 'PUBLIC',
        },
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
