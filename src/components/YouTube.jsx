import React from 'react';
import { Youtube, Play } from 'lucide-react';

const YouTubeComponent = ({ user }) => {
  const playlists = [
    {
      title: 'WEB3',
      url: 'https://www.youtube.com/watch?v=1DU3xO8vYX8&list=PL8rc7w7rwrVe0_allByCnObkcFX38ySqF',
      description: 'Materi pembelajaran Web3',
    },
    {
      title: 'Belajar Airdrops Crypto Web3',
      url: 'https://www.youtube.com/watch?v=o5JaI2CT-Bg&list=PL8rc7w7rwrVfhgXh2xSEP6XDLb2emi4jw',
      description: 'Tutorial lengkap belajar airdrops dan Web3',
    },
    {
      title: 'Airdrops',
      url: 'https://www.youtube.com/watch?v=OAiQN8vc4cY&list=PL8rc7w7rwrVfTLLBxpZBP7SLP9HARS8Vq',
      description: 'Strategi dan tips mendapatkan airdrops',
    },
    {
      title: 'Tutorial',
      url: 'https://www.youtube.com/watch?v=vlSRT4seBRE&list=PL8rc7w7rwrVfpNpOBr6iP6HIgdoVkYGUZ',
      description: 'Tutorial praktis dan panduan lengkap',
    },
  ];

  return (
    <div className="space-y-4 animate-in fade-in">
      {/* Header */}
      <div className="flex items-center justify-between">
        <h2 className="text-2xl font-bold text-white flex items-center gap-2">
          <Youtube size={24} className="text-red-500" /> Learning Playlists
        </h2>
        <a
          href="https://www.youtube.com/@DiscussionAirdrops"
          target="_blank"
          rel="noopener noreferrer"
          className="px-4 py-2 bg-red-600 hover:bg-red-500 text-white text-sm font-semibold rounded-lg transition-colors"
        >
          Subscribe
        </a>
      </div>

      {/* Playlists Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {playlists.map((playlist, index) => (
          <a
            key={index}
            href={playlist.url}
            target="_blank"
            rel="noopener noreferrer"
            className="group bg-slate-800 hover:bg-slate-700 border border-slate-700 hover:border-red-600 rounded-lg p-4 transition-all"
          >
            <div className="flex items-start gap-3">
              {/* Icon */}
              <div className="p-3 bg-red-600/20 group-hover:bg-red-600/40 rounded-lg transition-colors flex-shrink-0">
                <Play size={20} className="text-red-500" />
              </div>

              {/* Content */}
              <div className="flex-1 min-w-0">
                <h3 className="font-semibold text-white group-hover:text-red-400 transition-colors line-clamp-2">
                  {playlist.title}
                </h3>
                <p className="text-xs text-slate-400 mt-1">{playlist.description}</p>
              </div>

              {/* Arrow */}
              <svg
                className="w-5 h-5 text-slate-500 group-hover:text-red-400 transition-colors flex-shrink-0 mt-1"
                fill="none"
                stroke="currentColor"
                viewBox="0 0 24 24"
              >
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
              </svg>
            </div>
          </a>
        ))}
      </div>

      {/* Channel Link */}
      <div className="text-center pt-2">
        <a
          href="https://www.youtube.com/@DiscussionAirdrops"
          target="_blank"
          rel="noopener noreferrer"
          className="text-red-400 hover:text-red-300 text-sm font-semibold transition-colors"
        >
          Visit Discussion Airdrops Channel →
        </a>
      </div>
    </div>
  );
};

export default YouTubeComponent;
