import fs from 'fs';
import path from 'path';

const historyFile = path.join(process.cwd(), 'tmp', 'download-history.json');

export default function handler(req, res) {
  if (req.method === 'GET') {
    // Get download history
    try {
      if (fs.existsSync(historyFile)) {
        const history = JSON.parse(fs.readFileSync(historyFile, 'utf8'));
        res.status(200).json(history.slice(-20)); // Last 20 downloads
      } else {
        res.status(200).json([]);
      }
    } catch (error) {
      res.status(500).json({ error: 'Failed to read history' });
    }
  } else if (req.method === 'POST') {
    // Add to download history
    try {
      const { url, platform, title, size, timestamp } = req.body;
      
      let history = [];
      if (fs.existsSync(historyFile)) {
        history = JSON.parse(fs.readFileSync(historyFile, 'utf8'));
      }
      
      history.push({
        id: Date.now(),
        url,
        platform,
        title,
        size,
        timestamp: timestamp || new Date().toISOString()
      });
      
      // Keep only last 100 downloads
      if (history.length > 100) {
        history = history.slice(-100);
      }
      
      fs.writeFileSync(historyFile, JSON.stringify(history, null, 2));
      res.status(200).json({ success: true });
    } catch (error) {
      res.status(500).json({ error: 'Failed to save history' });
    }
  } else {
    res.status(405).json({ error: 'Method not allowed' });
  }
}
