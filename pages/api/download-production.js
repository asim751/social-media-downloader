export default async function handler(req, res) {
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  const { url, platform } = req.body;

  try {
    // In production on Vercel, we'll use different strategies:
    
    if (platform === 'YouTube') {
      // Option 1: Use YouTube API to get video info
      const videoInfo = await getYouTubeInfo(url);
      
      return res.status(200).json({
        success: true,
        platform: 'YouTube',
        type: 'video',
        quality: 'HD',
        size: 'Variable',
        title: videoInfo.title,
        thumbnail: videoInfo.thumbnail,
        downloads: [
          {
            label: 'Watch on YouTube',
            url: url,
            filename: 'youtube_video.mp4'
          },
          {
            label: 'Download via ytdl.org',
            url: `https://ytdl.org/download?url=${encodeURIComponent(url)}`,
            filename: 'youtube_video.mp4'
          }
        ]
      });
    }
    
    // For other platforms, provide direct links or external services
    return res.status(200).json({
      success: true,
      platform,
      type: 'media',
      quality: 'Original',
      size: 'Unknown',
      title: `${platform} Media`,
      downloads: [
        {
          label: 'View Original',
          url: url,
          filename: `${platform}_media`
        }
      ]
    });

  } catch (error) {
    console.error('Production download error:', error);
    res.status(500).json({ 
      error: 'Unable to process URL in production environment' 
    });
  }
}

async function getYouTubeInfo(url) {
  const videoId = extractYouTubeId(url);
  
  if (process.env.YOUTUBE_API_KEY) {
    try {
      const response = await fetch(
        `https://www.googleapis.com/youtube/v3/videos?id=${videoId}&key=${process.env.YOUTUBE_API_KEY}&part=snippet`
      );
      const data = await response.json();
      
      if (data.items && data.items[0]) {
        return {
          title: data.items[0].snippet.title,
          thumbnail: data.items[0].snippet.thumbnails?.medium?.url
        };
      }
    } catch (error) {
      console.error('YouTube API error:', error);
    }
  }
  
  return {
    title: 'YouTube Video',
    thumbnail: null
  };
}

function extractYouTubeId(url) {
  const match = url.match(/(?:youtube\.com\/watch\?v=|youtu\.be\/)([^&\n?#]+)/);
  return match ? match[1] : null;
}
