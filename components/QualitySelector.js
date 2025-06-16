import { useState } from 'react';

export default function QualitySelector({ onQualityChange }) {
  const [selectedQuality, setSelectedQuality] = useState('best');
  
  const qualities = [
    { value: 'best', label: 'Best Quality', description: 'Highest available' },
    { value: '1080p', label: '1080p HD', description: 'Full HD' },
    { value: '720p', label: '720p HD', description: 'HD Ready' },
    { value: '480p', label: '480p', description: 'Standard' },
    { value: 'worst', label: 'Smallest File', description: 'Lowest quality' }
  ];
  
  const handleChange = (quality) => {
    setSelectedQuality(quality);
    onQualityChange(quality);
  };
  
  return (
    <div className="mt-4">
      <label className="block text-sm font-medium text-gray-700 mb-2">
        Select Quality
      </label>
      <div className="grid grid-cols-2 md:grid-cols-5 gap-2">
        {qualities.map((quality) => (
          <button
            key={quality.value}
            type="button"
            onClick={() => handleChange(quality.value)}
            className={`p-2 text-xs rounded-lg border transition-colors ${
              selectedQuality === quality.value
                ? 'bg-blue-500 text-white border-blue-500'
                : 'bg-white text-gray-700 border-gray-300 hover:bg-gray-50'
            }`}
          >
            <div className="font-medium">{quality.label}</div>
            <div className="text-xs opacity-75">{quality.description}</div>
          </button>
        ))}
      </div>
    </div>
  );
}
