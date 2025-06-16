import axios from 'axios';

export default async function handler(req, res) {
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  const { url, platform } = req.body;

  if (!url) {
    return res.status(400).json({ error: 'URL is required' });
  }

  try {
    // For Vercel deployment, we'll use external services or web scraping
    // since we can't install yt-dlp directly
    
    let downloadData;
    
    switch (platform) {
      case 'YouTube':
        downloadData = await handleYouTubeVercel(url);
        break;
      case 'Instagram':
        downloadData = await handleInstagramVercel(url);
        break;
      default:
        downloadData = await handleGenericVercel(url, platform);
    }
    
    res.status(200).json({
      success: true,
      platform,
      type: downloadData.type,
      quality: downloadData.quality,
      size: downloadData.size,
      title: downloadData.title,
      downloads: downloadData.downloads
    });

  } catch (error) {
    console.error('Download error:', error);
    res.status(500).json({ 
      error: error.message || 'Failed to process the URL. Please try again.' 
    });
  }
}

async function handleYouTubeVercel(url) {
  try {
    // Use a third-party API service for YouTube downloads
    // For demo purposes, returning mock data
    // In production, you'd integrate with services like:
    // - youtube-dl-api-server
    // - rapidapi.com YouTube downloaders
    // - Your own microservice with yt-dlp
    
    const videoId = extractYouTubeId(url);
    
    return {
      type: 'video',
      quality: 'HD',
      size: 'Variable',
      title: 'YouTube Video',
      downloads: [
        {
          label: 'Download via External Service',
          url: `https://your-external-service.com/download?url=${encodeURIComponent(url)}`,
          filename: 'youtube_video.mp4'
        }
      ]
    };
  } catch (error) {
    throw new Error('YouTube processing failed');
  }
}

async function handleInstagramVercel(url) {
  // Similar approach for Instagram
  return {
    type: 'image',
    quality: 'Original',
    size: 'Variable',
    title: 'Instagram Media',
    downloads: [
      {
        label: 'View Original',
        url: url,
        filename: 'instagram_media'
      }
    ]
  };
}

async function handleGenericVercel(url, platform) {
  return {
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
  };
}

function extractYouTubeId(url) {
  const match = url.match(/(?:youtube\.com\/watch\?v=|youtu\.be\/)([^&\n?#]+)/);
  return match ? match[1] : null;
}
