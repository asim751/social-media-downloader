import { exec } from 'child_process';
import { promisify } from 'util';
import fs from 'fs';
import path from 'path';
import { v4 as uuidv4 } from 'uuid';
import { sanitizeFilename, generateCleanFilename } from '../../lib/filename-utils.js';

const execAsync = promisify(exec);

export default async function handler(req, res) {
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  const { url, platform } = req.body;

  if (!url) {
    return res.status(400).json({ error: 'URL is required' });
  }

  try {
    // Validate URL format
    new URL(url);
    
    console.log(`Processing ${platform} URL: ${url}`);
    
    // Create unique filename
    const uniqueId = uuidv4();
    const tempDir = path.join(process.cwd(), 'tmp', 'downloads');
    
    // Ensure temp directory exists
    if (!fs.existsSync(tempDir)) {
      fs.mkdirSync(tempDir, { recursive: true });
    }
    
    let downloadData;
    
    // Route to appropriate platform handler
    switch (platform) {
      case 'YouTube':
        downloadData = await handleYouTube(url, tempDir, uniqueId);
        break;
      case 'Instagram':
        downloadData = await handleInstagram(url, tempDir, uniqueId);
        break;
      case 'TikTok':
        downloadData = await handleTikTok(url, tempDir, uniqueId);
        break;
      case 'Twitter':
        downloadData = await handleTwitter(url, tempDir, uniqueId);
        break;
      case 'Facebook':
        downloadData = await handleFacebook(url, tempDir, uniqueId);
        break;
      default:
        downloadData = await handleGeneric(url, tempDir, uniqueId);
    }
    
    // Return actual download data
    res.status(200).json({
      success: true,
      platform,
      type: downloadData.type,
      quality: downloadData.quality,
      size: downloadData.size,
      title: downloadData.title,
      thumbnail: downloadData.thumbnail,
      downloads: downloadData.downloads
    });

  } catch (error) {
    console.error('Download error:', error);
    
    if (error.message.includes('URL')) {
      return res.status(400).json({ error: 'Invalid URL format' });
    }
    
    res.status(500).json({ 
      error: error.message || 'Failed to process the URL. Please try again.' 
    });
  }
}

// YouTube handler using yt-dlp with clean filenames
async function handleYouTube(url, tempDir, uniqueId) {
  try {
    console.log('Processing YouTube URL with yt-dlp...');
    
    // Get video info first
    const infoCommand = `yt-dlp --print "%(title)s|%(duration)s|%(filesize)s|%(thumbnail)s" "${url}"`;
    const { stdout: info } = await execAsync(infoCommand);
    const [title, duration, filesize, thumbnail] = info.trim().split('|');
    
    // Create clean filename template
    const cleanTitle = sanitizeFilename(title || 'YouTube_Video');
    const outputTemplate = path.join(tempDir, `${uniqueId}_${cleanTitle}.%(ext)s`);
    
    // Download video with clean filename
    const downloadCommand = `yt-dlp -f "best[ext=mp4]/best" -o "${outputTemplate}" "${url}"`;
    
    console.log('Executing:', downloadCommand);
    await execAsync(downloadCommand);
    
    // Find the downloaded file
    const files = fs.readdirSync(tempDir).filter(f => f.startsWith(uniqueId));
    const downloadedFile = files[0];
    
    if (!downloadedFile) {
      throw new Error('Downloaded file not found');
    }
    
    console.log('Downloaded file:', downloadedFile);
    
    const fileSize = fs.statSync(path.join(tempDir, downloadedFile)).size;
    const fileSizeMB = (fileSize / (1024 * 1024)).toFixed(1);
    
    // Generate clean display filename
    const cleanDisplayName = sanitizeFilename(title || 'YouTube Video');
    
    return {
      type: 'video',
      quality: 'HD',
      size: `${fileSizeMB} MB`,
      title: title || 'YouTube Video',
      thumbnail: thumbnail !== 'NA' ? thumbnail : null,
      downloads: [
        {
          label: 'MP4 Video',
          url: `/api/stream?file=${encodeURIComponent(downloadedFile)}`,
          filename: `${cleanDisplayName}.mp4`
        },
        {
          label: 'Audio Only (MP3)',
          url: `/api/stream?file=${encodeURIComponent(downloadedFile)}&format=mp3`,
          filename: `${cleanDisplayName}.mp3`
        }
      ]
    };
    
  } catch (error) {
    console.error('YouTube download error:', error);
    throw new Error(`YouTube download failed: ${error.message}`);
  }
}

// Instagram handler with clean filenames
async function handleInstagram(url, tempDir, uniqueId) {
  try {
    console.log('Processing Instagram URL...');
    
    const cleanFilename = `${uniqueId}_instagram.%(ext)s`;
    const outputPath = path.join(tempDir, cleanFilename);
    const command = `yt-dlp -o "${outputPath}" "${url}"`;
    
    await execAsync(command);
    
    const files = fs.readdirSync(tempDir).filter(f => f.startsWith(`${uniqueId}_instagram`));
    const downloadedFile = files[0];
    
    if (!downloadedFile) {
      throw new Error('Instagram download failed');
    }
    
    const fileSize = fs.statSync(path.join(tempDir, downloadedFile)).size;
    const fileSizeMB = (fileSize / (1024 * 1024)).toFixed(1);
    
    return {
      type: downloadedFile.includes('.mp4') ? 'video' : 'image',
      quality: 'Original',
      size: `${fileSizeMB} MB`,
      title: 'Instagram Media',
      downloads: [
        {
          label: downloadedFile.includes('.mp4') ? 'MP4 Video' : 'Image',
          url: `/api/stream?file=${encodeURIComponent(downloadedFile)}`,
          filename: `instagram_media.${downloadedFile.split('.').pop()}`
        }
      ]
    };
    
  } catch (error) {
    console.error('Instagram download error:', error);
    throw new Error(`Instagram download failed: ${error.message}`);
  }
}

// Placeholder handlers
async function handleTikTok(url, tempDir, uniqueId) {
  return handleGeneric(url, tempDir, uniqueId, 'tiktok');
}

async function handleTwitter(url, tempDir, uniqueId) {
  return handleGeneric(url, tempDir, uniqueId, 'twitter');
}

async function handleFacebook(url, tempDir, uniqueId) {
  return handleGeneric(url, tempDir, uniqueId, 'facebook');
}

async function handleGeneric(url, tempDir, uniqueId, platform = 'generic') {
  try {
    console.log(`Processing ${platform} URL...`);
    
    const cleanFilename = `${uniqueId}_${platform}.%(ext)s`;
    const outputPath = path.join(tempDir, cleanFilename);
    const command = `yt-dlp -o "${outputPath}" "${url}"`;
    
    await execAsync(command);
    
    const files = fs.readdirSync(tempDir).filter(f => f.startsWith(`${uniqueId}_${platform}`));
    const downloadedFile = files[0];
    
    if (!downloadedFile) {
      throw new Error(`${platform} download failed`);
    }
    
    const fileSize = fs.statSync(path.join(tempDir, downloadedFile)).size;
    const fileSizeMB = (fileSize / (1024 * 1024)).toFixed(1);
    
    return {
      type: 'media',
      quality: 'Original',
      size: `${fileSizeMB} MB`,
      title: `${platform.charAt(0).toUpperCase() + platform.slice(1)} Media`,
      downloads: [
        {
          label: 'Download File',
          url: `/api/stream?file=${encodeURIComponent(downloadedFile)}`,
          filename: `${platform}_media.${downloadedFile.split('.').pop()}`
        }
      ]
    };
    
  } catch (error) {
    console.error(`${platform} download error:`, error);
    throw new Error(`${platform} download failed: ${error.message}`);
  }
}
