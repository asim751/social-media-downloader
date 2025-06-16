'use client';

import { useState } from 'react';


import Head from 'next/head';



const SUPPORTED_PLATFORMS = [
  'YouTube', 'Instagram', 'TikTok', 'Twitter/X', 'Facebook', 
  'LinkedIn', 'Pinterest', 'Snapchat', 'Reddit', 'Twitch'
];



export default function Home() {
  const [url, setUrl] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [result, setResult] = useState(null);
  const [error, setError] = useState('');
  const [downloadProgress, setDownloadProgress] = useState(0);



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
      
      const response = await fetch('/api/download', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ url, platform }),
      });



      const data = await response.json();
      clearInterval(progressInterval);
      setDownloadProgress(100);



      if (!response.ok) {
        throw new Error(data.error || 'Failed to process URL');
      }



      setResult(data);
    } catch (err) {
      setError(err.message);
      setDownloadProgress(0);
    } finally {
      setIsLoading(false);
    }
  };



  const downloadFile = async (downloadUrl, filename) => {
    try {
      // Create a link element and trigger download
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
        <div className="max-w-4xl mx-auto">
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
                      <span className="ml-2 text-gray-600">{result.size}</span>
                    </div>
                  </div>



                  {result.title && (
                    <div>
                      <span className="font-medium text-gray-700">Title:</span>
                      <p className="mt-1 text-gray-600">{result.title}</p>
                    </div>
                  )}



                  {result.thumbnail && (
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
      </div>
    </div>
  );
}
