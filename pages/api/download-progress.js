export default function handler(req, res) {
  if (req.method !== 'GET') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  const { downloadId } = req.query;
  
  // Set up Server-Sent Events for real-time progress
  res.writeHead(200, {
    'Content-Type': 'text/event-stream',
    'Cache-Control': 'no-cache',
    'Connection': 'keep-alive',
    'Access-Control-Allow-Origin': '*',
  });

  // Send progress updates
  const sendProgress = (progress) => {
    res.write(`data: ${JSON.stringify({ progress, downloadId })}\n\n`);
  };

  // Simulate progress (in real implementation, this would track actual yt-dlp progress)
  let progress = 0;
  const interval = setInterval(() => {
    progress += Math.random() * 15;
    if (progress >= 100) {
      progress = 100;
      sendProgress(progress);
      res.write(`data: ${JSON.stringify({ complete: true, downloadId })}\n\n`);
      clearInterval(interval);
      res.end();
    } else {
      sendProgress(progress);
    }
  }, 500);

  // Clean up on client disconnect
  req.on('close', () => {
    clearInterval(interval);
  });
}
