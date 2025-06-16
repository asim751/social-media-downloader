import { exec } from 'child_process';
import { promisify } from 'util';

const execAsync = promisify(exec);

export async function getYouTubeInfo(url) {
  try {
    // Get detailed info including thumbnail
    const infoCommand = `yt-dlp --print "%(title)s|%(duration)s|%(filesize)s|%(thumbnail)s|%(uploader)s|%(view_count)s" "${url}"`;
    const { stdout } = await execAsync(infoCommand);
    const [title, duration, filesize, thumbnail, uploader, viewCount] = stdout.trim().split('|');
    
    return {
      title: title || 'YouTube Video',
      duration,
      filesize,
      thumbnail: thumbnail !== 'NA' ? thumbnail : null,
      uploader,
      viewCount
    };
  } catch (error) {
    console.error('YouTube info error:', error);
    return {
      title: 'YouTube Video',
      thumbnail: null
    };
  }
}
