// Facebook Page Posting
// Requires: Page Access Token with pages_manage_posts permission

const PAGE_ACCESS_TOKEN = process.env.FACEBOOK_PAGE_ACCESS_TOKEN;
const PAGE_ID = process.env.FACEBOOK_PAGE_ID;

export async function postToFacebook(content) {
  try {
    const response = await fetch(
      `https://graph.facebook.com/v18.0/${PAGE_ID}/feed`,
      {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          message: content,
          access_token: PAGE_ACCESS_TOKEN,
        }),
      }
    );

    if (!response.ok) {
      const errorData = await response.json();
      return { success: false, error: JSON.stringify(errorData.error) };
    }

    const data = await response.json();
    return { success: true, id: data.id };
  } catch (error) {
    return { success: false, error: error.message };
  }
}
