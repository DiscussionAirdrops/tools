// Extract username from Twitter URL and fetch profile info
export const extractTwitterUsername = (url) => {
  try {
    // Handle various Twitter URL formats
    const patterns = [
      /twitter\.com\/(@?[\w]+)/,
      /x\.com\/(@?[\w]+)/,
      /^@?([\w]+)$/
    ];
    
    for (const pattern of patterns) {
      const match = url.match(pattern);
      if (match) {
        return match[1].replace('@', '');
      }
    }
    return null;
  } catch (err) {
    console.error('[v0] Error extracting Twitter username:', err);
    return null;
  }
};

// Fetch Twitter profile photo from public API
export const fetchTwitterProfileData = async (username) => {
  try {
    // Method 1: Try to fetch from Twitter's nitter (privacy-friendly mirror)
    const response = await fetch(`https://nitter.net/${username}/rss`, {
      headers: { 'Accept': 'application/json' }
    }).catch(() => null);
    
    if (response && response.ok) {
      const text = await response.text();
      // Extract image URL from RSS feed
      const imgMatch = text.match(/image url="([^"]+)"/);
      if (imgMatch) {
        return {
          username,
          photoUrl: imgMatch[1],
          source: 'nitter'
        };
      }
    }
  } catch (err) {
    console.log('[v0] Nitter fetch failed, trying alternative method');
  }
  
  // Method 2: Use Twitter's default avatar URL format
  // This generates a placeholder that shows the user exists
  const twitterUrl = `https://twitter.com/${username}`;
  const defaultAvatarUrl = `https://unavatar.io/twitter/${username}`;
  
  return {
    username,
    photoUrl: defaultAvatarUrl,
    source: 'unavatar',
    twitterUrl
  };
};

// Generate Twitter profile URL
export const getTwitterProfileUrl = (username) => {
  return `https://twitter.com/${username}`;
};
