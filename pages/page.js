"use client";

import { useState, useEffect } from 'react';
import Head from 'next/head';

const SUPPORTED_PLATFORMS = [
  'YouTube', 'Instagram', 'TikTok', 'Twitter/X', 'Facebook', 
  'LinkedIn', 'Pinterest', 'Snapchat', 'Reddit', 'Twitch'
];

export default function HomeApp() {
  const [url, setUrl] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [result, setResult] = useState(null);
  const [error, setError] = useState('');
  const [downloadProgress, setDownloadProgress] = useState(0);
  const [selectedQuality, setSelectedQuality] = useState('best');
  const [downloadHistory, setDownloadHistory] = useState([]);

  // Load download history on component mount
  useEffect(() => {
    loadDownloadHistory();
  }, []);

  const loadDownloadHistory = async () => {
    try {
      const response = await fetch('/api/download-production-history');
      const history = await response.json();
      setDownloadHistory(history);
    } catch (error) {
      console.error('Failed to load history:', error);
    }
  };

  const saveToHistory = async (downloadData) => {
    try {
      await fetch('/api/download-production-history', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          url,
          platform: downloadData.platform,
          title: downloadData.title,
          size: downloadData.size,
          timestamp: new Date().toISOString()
        })
      });
      loadDownloadHistory(); // Refresh history
    } catch (error) {
      console.error('Failed to save to history:', error);
    }
  };

  const detectPlatform = (url) => {
    const platforms = {
      'youtube.com': 'YouTube',
      'youtu.be': 'YouTube',
      'instagram.com': 'Instagram',
      'tiktok.com': 'TikTok',
      'twitter.com': 'Twitter',
      'x.com': 'Twitter',
      'facebook.com': 'Facebook',
    };

    for (const [domain, platform] of Object.entries(platforms)) {
      if (url.includes(domain)) return platform;
    }
    return 'Unknown';
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!url.trim()) return;

    setIsLoading(true);
    setError('');
    setResult(null);
    setDownloadProgress(0);

    try {
      const platform = detectPlatform(url);
      
      // Simulate progress
      const progressInterval = setInterval(() => {
        setDownloadProgress(prev => {
          if (prev >= 90) {
            clearInterval(progressInterval);
            return prev;
          }
          return prev + Math.random() * 10;
        });
      }, 1000);
      
      const response = await fetch('/api/download-production', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ url, platform, quality: selectedQuality }),
      });

      const data = await response.json();
      clearInterval(progressInterval);
      setDownloadProgress(100);

      if (!response.ok) {
        throw new Error(data.error || 'Failed to process URL');
      }

      setResult(data);
      await saveToHistory(data); // Save to history
    } catch (err) {
      setError(err.message);
      setDownloadProgress(0);
    } finally {
      setIsLoading(false);
    }
  };

  const downloadFile = async (downloadUrl, filename) => {
    try {
      const link = document.createElement('a');
      link.href = downloadUrl;
      link.download = filename;
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
    } catch (err) {
      setError('Failed to download file');
    }
  };

  const formatFileSize = (size) => {
    if (!size) return 'Unknown';
    const num = parseFloat(size);
    if (num >= 1024) {
      return `${(num / 1024).toFixed(1)} GB`;
    }
    return size;
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 via-white to-purple-50">
      <Head>
        <title>Universal Social Media Downloader</title>
        <meta name="description" content="Download videos, images, and audio from any social media platform" />
        <link rel="icon" href="/favicon.ico" />
      </Head>

      <div className="container mx-auto px-4 py-8">
        {/* Header */}
        <div className="text-center mb-12">
          <h1 className="text-4xl md:text-5xl font-bold text-gray-800 mb-4">
            Social Media Downloader
          </h1>
          <p className="text-lg text-gray-600 max-w-2xl mx-auto">
            Download videos, images, and audio from any social media platform. 
            Just paste the URL and we'll handle the rest!
          </p>
        </div>

        <div className="max-w-6xl mx-auto grid grid-cols-1 lg:grid-cols-3 gap-8">
          {/* Main Download Section */}
          <div className="lg:col-span-2">
            {/* Supported Platforms */}
            <div className="mb-8">
              <h2 className="text-xl font-semibold text-gray-700 mb-4 text-center">
                Supported Platforms
              </h2>
              <div className="flex flex-wrap justify-center gap-2">
                {SUPPORTED_PLATFORMS.map((platform) => (
                  <span
                    key={platform}
                    className="px-3 py-1 bg-blue-100 text-blue-800 rounded-full text-sm font-medium"
                  >
                    {platform}
                  </span>
                ))}
              </div>
            </div>

            {/* Main Form */}
            <div className="card">
              <form onSubmit={handleSubmit} className="space-y-6">
                <div>
                  <label htmlFor="url" className="block text-lg font-medium text-gray-700 mb-2">
                    Enter Social Media URL
                  </label>
                  <input
                    type="url"
                    id="url"
                    value={url}
                    onChange={(e) => setUrl(e.target.value)}
                    placeholder="https://www.youtube.com/watch?v=example..."
                    className="input text-lg"
                    required
                  />
                  {url && (
                    <p className="mt-2 text-sm text-gray-600">
                      Detected platform: <span className="font-semibold text-blue-600">
                        {detectPlatform(url)}
                      </span>
                    </p>
                  )}
                </div>

                {/* Quality Selector */}
                {url && detectPlatform(url) === 'YouTube' && (
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Select Quality
                    </label>
                    <select
                      value={selectedQuality}
                      onChange={(e) => setSelectedQuality(e.target.value)}
                      className="input"
                    >
                      <option value="best">Best Quality</option>
                      <option value="1080p">1080p HD</option>
                      <option value="720p">720p HD</option>
                      <option value="480p">480p</option>
                      <option value="worst">Smallest File</option>
                    </select>
                  </div>
                )}

                <button
                  type="submit"
                  disabled={isLoading || !url.trim()}
                  className="btn btn-primary w-full py-3 px-6 text-lg"
                >
                  {isLoading ? 'Processing...' : 'Download Media'}
                </button>
              </form>

              {/* Progress Bar */}
              {isLoading && downloadProgress > 0 && (
                <div className="mt-6">
                  <div className="flex justify-between mb-2">
                    <span className="text-sm text-gray-600">Processing...</span>
                    <span className="text-sm text-gray-600">{Math.round(downloadProgress)}%</span>
                  </div>
                  <div className="w-full bg-gray-200 rounded-full h-2">
                    <div
                      className="bg-gradient-to-r from-blue-600 to-purple-600 h-2 rounded-full transition-all duration-300"
                      style={{ width: `${downloadProgress}%` }}
                    ></div>
                  </div>
                </div>
              )}

              {/* Error Message */}
              {error && (
                <div className="mt-6 p-4 bg-red-50 border border-red-200 rounded-lg">
                  <p className="text-red-700">{error}</p>
                </div>
              )}

              {/* Success Result */}
              {result && (
                <div className="mt-6 p-6 bg-green-50 border border-green-200 rounded-lg">
                  <h3 className="text-lg font-semibold text-green-800 mb-4">
                    Media Found Successfully! 🎉
                  </h3>
                  
                  <div className="space-y-4">
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-sm">
                      <div>
                        <span className="font-medium text-gray-700">Platform:</span>
                        <span className="ml-2 text-gray-600">{result.platform}</span>
                      </div>
                      <div>
                        <span className="font-medium text-gray-700">Type:</span>
                        <span className="ml-2 text-gray-600">{result.type}</span>
                      </div>
                      <div>
                        <span className="font-medium text-gray-700">Quality:</span>
                        <span className="ml-2 text-gray-600">{result.quality}</span>
                      </div>
                      <div>
                        <span className="font-medium text-gray-700">Size:</span>
                        <span className="ml-2 text-gray-600">{formatFileSize(result.size)}</span>
                      </div>
                    </div>

                    {result.title && (
                      <div>
                        <span className="font-medium text-gray-700">Title:</span>
                        <p className="mt-1 text-gray-600">{result.title}</p>
                      </div>
                    )}

                    {result.thumbnail && result.thumbnail !== 'NA' && (
                      <div>
                        <img
                          src={result.thumbnail}
                          alt="Thumbnail"
                          className="w-full max-w-sm rounded-lg shadow-md"
                        />
                      </div>
                    )}

                    <div className="flex flex-wrap gap-3">
                      {result.downloads?.map((download, index) => (
                        <button
                          key={index}
                          onClick={() => downloadFile(download.url, download.filename)}
                          className="btn btn-primary flex items-center gap-2"
                        >
                          <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 10v6m0 0l-3-3m3 3l3-3m2 8H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                          </svg>
                          {download.label}
                        </button>
                      ))}
                    </div>
                  </div>
                </div>
              )}
            </div>
          </div>

          {/* Download History Sidebar */}
          <div className="lg:col-span-1">
            <div className="card">
              <h3 className="text-lg font-semibold text-gray-800 mb-4">
                Recent Downloads
              </h3>
              
              {downloadHistory.length === 0 ? (
                <p className="text-gray-500 text-sm">No downloads yet</p>
              ) : (
                <div className="space-y-3 max-h-96 overflow-y-auto">
                  {downloadHistory.slice().reverse().map((item) => (
                    <div key={item.id} className="p-3 bg-gray-50 rounded-lg">
                      <div className="text-sm font-medium text-gray-900 truncate">
                        {item.title}
                      </div>
                      <div className="text-xs text-gray-500 mt-1">
                        {item.platform} • {item.size}
                      </div>
                      <div className="text-xs text-gray-400 mt-1">
                        {new Date(item.timestamp).toLocaleDateString()}
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
