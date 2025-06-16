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
    const filePath = path.join(tempDir, file);
    
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
      
      // Convert to MP3 using ffmpeg
      const convertCommand = `ffmpeg -i "${filePath}" -acodec mp3 -ab 128k "${mp3Path}" -y`;
      await execAsync(convertCommand);
      
      finalFilePath = mp3Path;
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
    }
    
    const fileName = path.basename(finalFilePath);
    
    res.setHeader('Content-Type', mimeType);
    res.setHeader('Content-Length', fileSize);
    res.setHeader('Content-Disposition', `attachment; filename="${fileName}"`);
    res.setHeader('Cache-Control', 'no-cache');
    
    // Stream the file
    const readStream = fs.createReadStream(finalFilePath);
    readStream.pipe(res);
    
    // Clean up file after streaming (optional)
    readStream.on('end', () => {
      setTimeout(() => {
        try {
          fs.unlinkSync(finalFilePath);
          if (finalFilePath !== filePath) {
            fs.unlinkSync(filePath); // Also remove original if converted
          }
          console.log('Cleaned up:', fileName);
        } catch (err) {
          console.error('Cleanup error:', err);
        }
      }, 5000); // Wait 5 seconds before cleanup
    });
    
  } catch (error) {
    console.error('Streaming error:', error);
    res.status(500).json({ error: 'Failed to stream file' });
  }
}

export const config = {
  api: {
    responseLimit: false,
  },
};
