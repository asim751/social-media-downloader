import fs from 'fs';
import path from 'path';
import { exec } from 'child_process';
import { promisify } from 'util';

const execAsync = promisify(exec);

export default async function handler(req, res) {
  const { file, format } = req.query;

  if (!file) {
    return res.status(400).json({ error: 'File parameter is required' });
  }

  try {
    const tempDir = path.join(process.cwd(), 'tmp', 'downloads');
    const filePath = path.join(tempDir, decodeURIComponent(file));
    
    // Security check: ensure file is in temp directory
    if (!filePath.startsWith(tempDir)) {
      return res.status(403).json({ error: 'Access denied' });
    }
    
    // Check if file exists
    if (!fs.existsSync(filePath)) {
      return res.status(404).json({ error: 'File not found' });
    }
    
    // Handle format conversion (e.g., video to MP3)
    let finalFilePath = filePath;
    
    if (format === 'mp3' && !file.endsWith('.mp3')) {
      console.log('Converting to MP3...');
      const mp3Path = filePath.replace(/\.[^/.]+$/, '.mp3');
      
      try {
        // Convert to MP3 using ffmpeg
        const convertCommand = `ffmpeg -i "${filePath}" -acodec mp3 -ab 128k "${mp3Path}" -y`;
        await execAsync(convertCommand);
        finalFilePath = mp3Path;
      } catch (conversionError) {
        console.error('MP3 conversion failed:', conversionError);
        // Fall back to original file if conversion fails
        finalFilePath = filePath;
      }
    }
    
    // Get file stats
    const stats = fs.statSync(finalFilePath);
    const fileSize = stats.size;
    
    // Set appropriate headers
    const ext = path.extname(finalFilePath).toLowerCase();
    let mimeType = 'application/octet-stream';
    
    switch (ext) {
      case '.mp4':
        mimeType = 'video/mp4';
        break;
      case '.mp3':
        mimeType = 'audio/mpeg';
        break;
      case '.jpg':
      case '.jpeg':
        mimeType = 'image/jpeg';
        break;
      case '.png':
        mimeType = 'image/png';
        break;
      case '.webm':
        mimeType = 'video/webm';
        break;
      case '.avi':
        mimeType = 'video/x-msvideo';
        break;
    }
    
    // Clean filename for Content-Disposition header
    const originalFileName = path.basename(finalFilePath);
    const cleanFileName = sanitizeFilename(originalFileName);
    
    console.log('Original filename:', originalFileName);
    console.log('Cleaned filename:', cleanFileName);
    
    // Set headers with sanitized filename
    res.setHeader('Content-Type', mimeType);
    res.setHeader('Content-Length', fileSize);
    res.setHeader('Content-Disposition', `attachment; filename="${cleanFileName}"`);
    res.setHeader('Cache-Control', 'no-cache');
    res.setHeader('Accept-Ranges', 'bytes');
    
    // Handle range requests for large files
    const range = req.headers.range;
    if (range) {
      const parts = range.replace(/bytes=/, "").split("-");
      const start = parseInt(parts[0], 10);
      const end = parts[1] ? parseInt(parts[1], 10) : fileSize - 1;
      const chunksize = (end - start) + 1;
      
      res.setHeader('Content-Range', `bytes ${start}-${end}/${fileSize}`);
      res.setHeader('Content-Length', chunksize);
      res.status(206);
      
      const readStream = fs.createReadStream(finalFilePath, { start, end });
      readStream.pipe(res);
    } else {
      // Stream entire file
      const readStream = fs.createReadStream(finalFilePath);
      readStream.pipe(res);
    }
    
    // Clean up file after streaming
    const cleanup = () => {
      setTimeout(() => {
        try {
          if (fs.existsSync(finalFilePath)) {
            fs.unlinkSync(finalFilePath);
            console.log('Cleaned up:', cleanFileName);
          }
          // Also remove original if we converted it
          if (finalFilePath !== filePath && fs.existsSync(filePath)) {
            fs.unlinkSync(filePath);
            console.log('Cleaned up original:', path.basename(filePath));
          }
        } catch (err) {
          console.error('Cleanup error:', err);
        }
      }, 10000); // Wait 10 seconds before cleanup
    };
    
    res.on('finish', cleanup);
    res.on('close', cleanup);
    
  } catch (error) {
    console.error('Streaming error:', error);
    if (!res.headersSent) {
      res.status(500).json({ error: 'Failed to stream file' });
    }
  }
}

// Function to sanitize filename for HTTP headers
function sanitizeFilename(filename) {
  return filename
    // Replace full-width characters with half-width equivalents
    .replace(/？/g, '?')
    .replace(/｜/g, '|')
    .replace(/＃/g, '#')
    .replace(/：/g, ':')
    .replace(/；/g, ';')
    .replace(/，/g, ',')
    .replace(/。/g, '.')
    .replace(/（/g, '(')
    .replace(/）/g, ')')
    .replace(/【/g, '[')
    .replace(/】/g, ']')
    .replace(/「/g, '"')
    .replace(/」/g, '"')
    // Remove or replace problematic characters for HTTP headers
    .replace(/[？｜＃：；，。（）【】「」]/g, '')
    .replace(/[<>:"/\\|?*]/g, '_') // Replace Windows invalid chars
    .replace(/[^\x00-\x7F]/g, '_') // Replace any non-ASCII characters
    .replace(/_{2,}/g, '_') // Replace multiple underscores with single
    .replace(/^_+|_+$/g, '') // Remove leading/trailing underscores
    .substring(0, 200) // Limit length
    || 'download'; // Fallback name if everything gets stripped
}

export const config = {
  api: {
    responseLimit: false,
    bodyParser: {
      sizeLimit: '50mb',
    },
  },
};
