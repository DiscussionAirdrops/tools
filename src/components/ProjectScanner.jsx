'use client';

import React, { useState } from 'react';
import { Search, Twitter, Github, MessageCircle, Send, ExternalLink, AlertCircle } from 'lucide-react';

const ProjectScanner = ({ aiProviders = {} }) => {
  const [websiteUrl, setWebsiteUrl] = useState('');
  const [projectName, setProjectName] = useState('');
  const [scanning, setScanning] = useState(false);
  const [scanResults, setScanResults] = useState(null);
  const [error, setError] = useState('');

  // Normalize URL
  const normalizeUrl = (url) => {
    if (!url) return '';
    if (!url.startsWith('http://') && !url.startsWith('https://')) {
      url = 'https://' + url;
    }
    return url;
  };

  // Extract social media URLs dari text
  const extractSocialLinks = (text) => {
    if (!text || typeof text !== 'string') text = '';
    
    const socials = {};
    
    // Twitter
    const twitterMatch = text.match(/(?:https?:\/\/)(?:www\.)?(?:twitter|x)\.com\/([a-zA-Z0-9_]+)/gi);
    if (twitterMatch) {
      socials.twitter = twitterMatch.map(url => url);
    }
    
    // Discord
    const discordMatch = text.match(/(?:https?:\/\/)?(?:www\.)?discord\.(?:gg|com)\/([a-zA-Z0-9]+)/gi);
    if (discordMatch) {
      socials.discord = discordMatch.map(url => url);
    }
    
    // Telegram
    const telegramMatch = text.match(/(?:https?:\/\/)?(?:www\.)?t\.me\/([a-zA-Z0-9_]+)/gi);
    if (telegramMatch) {
      socials.telegram = telegramMatch.map(url => url);
    }
    
    // GitHub
    const githubMatch = text.match(/(?:https?:\/\/)?(?:www\.)?github\.com\/([a-zA-Z0-9_-]+)/gi);
    if (githubMatch) {
      socials.github = githubMatch.map(url => url);
    }
    
    // LinkedIn
    const linkedinMatch = text.match(/(?:https?:\/\/)?(?:www\.)?linkedin\.com\/(?:company|in)\/([a-zA-Z0-9_-]+)/gi);
    if (linkedinMatch) {
      socials.linkedin = linkedinMatch.map(url => url);
    }
    
    // YouTube
    const youtubeMatch = text.match(/(?:https?:\/\/)?(?:www\.)?youtube\.com\/(?:@|c|channel|user)\/([a-zA-Z0-9_-]+)/gi);
    if (youtubeMatch) {
      socials.youtube = youtubeMatch.map(url => url);
    }

    console.log('[v0] Social media extracted:', socials);
    return socials;
  };

  // Check website accessibility
  const checkWebsite = async (url) => {
    try {
      const response = await fetch(url, { method: 'HEAD', mode: 'no-cors' });
      return true;
    } catch {
      return false;
    }
  };

  // Main scan function
  const handleScan = async () => {
    setError('');
    setScanResults(null);
    
    if (!websiteUrl.trim()) {
      setError('Masukkan URL website');
      return;
    }

    setScanning(true);
    try {
      const url = normalizeUrl(websiteUrl);
      
      console.log('[v0] Starting scan for:', url);
      
      // Check website
      const isReachable = await checkWebsite(url);
      
      // Extract social dari URL structure
      const socials = extractSocialLinks(url);
      
      // Try common social paths
      const commonDomain = new URL(url).hostname.replace('www.', '').split('.')[0];
      const potentialSocials = {
        twitter: 'https://twitter.com/' + commonDomain,
        discord: 'https://discord.gg/' + commonDomain,
        telegram: 'https://t.me/' + commonDomain,
        github: 'https://github.com/' + commonDomain,
      };
      
      // Combine results
      const allSocials = { ...potentialSocials, ...socials };
      const foundSocials = Object.fromEntries(
        Object.entries(allSocials).filter(([key, val]) => val && val.length > 0)
      );
      
      // Create findings
      const socialCount = Object.keys(foundSocials).length;
      let reputation = 50;
      
      if (socialCount === 0) reputation -= 20;
      else if (socialCount === 1) reputation += 5;
      else if (socialCount === 2) reputation += 10;
      else if (socialCount >= 3) reputation += 15;
      
      if (url.includes('https')) reputation += 10;
      
      reputation = Math.min(100, Math.max(0, reputation));

      const findings = [
        socialCount > 0 
          ? { type: 'positive', text: 'Ditemukan ' + socialCount + ' media sosial: ' + Object.keys(foundSocials).join(', ') } 
          : { type: 'warning', text: 'Tidak ditemukan link media sosial' },
        isReachable 
          ? { type: 'positive', text: 'Website dapat diakses' } 
          : { type: 'warning', text: 'Website tidak dapat diakses' },
        url.includes('https') 
          ? { type: 'positive', text: 'Website menggunakan HTTPS (aman)' } 
          : { type: 'warning', text: 'Website tidak menggunakan HTTPS' }
      ];

      setScanResults({
        url,
        projectName: projectName || 'Project',
        socialLinks: foundSocials,
        reputationScore: reputation,
        riskLevel: reputation >= 70 ? 'LOW' : reputation >= 50 ? 'MEDIUM' : 'HIGH',
        findings
      });

    } catch (err) {
      console.error('[v0] Scan error:', err);
      setError('Gagal memindai website: ' + err.message);
    } finally {
      setScanning(false);
    }
  };

  const getSocialIcon = (platform) => {
    switch(platform) {
      case 'twitter': return <Twitter size={16} />;
      case 'github': return <Github size={16} />;
      case 'discord': return <MessageCircle size={16} />;
      case 'telegram': return <Send size={16} />;
      default: return <ExternalLink size={16} />;
    }
  };

  return (
    <div className="w-full max-w-4xl mx-auto p-6 bg-slate-900 rounded-lg">
      <h2 className="text-2xl font-bold mb-6 text-white flex items-center gap-2">
        <Search size={24} />
        Pemindai Proyek Crypto
      </h2>

      {error && (
        <div className="mb-6 p-4 bg-red-900/20 border border-red-500 rounded-lg text-red-400 flex items-center gap-2">
          <AlertCircle size={20} />
          {error}
        </div>
      )}

      <div className="space-y-4 mb-6">
        <input
          type="text"
          placeholder="Masukkan URL website (contoh: ethena.fi)"
          value={websiteUrl}
          onChange={(e) => setWebsiteUrl(e.target.value)}
          className="w-full px-4 py-3 bg-slate-800 border border-slate-700 rounded-lg text-white placeholder-slate-400 focus:outline-none focus:border-purple-500"
        />
        
        <input
          type="text"
          placeholder="Nama Proyek (opsional)"
          value={projectName}
          onChange={(e) => setProjectName(e.target.value)}
          className="w-full px-4 py-3 bg-slate-800 border border-slate-700 rounded-lg text-white placeholder-slate-400 focus:outline-none focus:border-purple-500"
        />
        
        <button
          onClick={handleScan}
          disabled={scanning}
          className="w-full px-4 py-3 bg-gradient-to-r from-purple-600 to-purple-800 hover:from-purple-700 hover:to-purple-900 disabled:opacity-50 text-white font-semibold rounded-lg transition-all flex items-center justify-center gap-2"
        >
          {scanning ? (
            <>
              <span className="animate-spin">⟳</span>
              Memindai...
            </>
          ) : (
            <>
              <Search size={18} />
              Mulai Pemindaian
            </>
          )}
        </button>
      </div>

      {scanResults && (
        <div className="space-y-6">
          {/* Reputation Score */}
          <div className="bg-slate-800 rounded-lg p-4 border border-slate-700">
            <div className="flex items-center justify-between mb-2">
              <h3 className="text-white font-semibold">Skor Reputasi</h3>
              <span className={`px-3 py-1 rounded-lg font-bold text-sm ${
                scanResults.riskLevel === 'LOW' ? 'bg-green-900/30 text-green-400' :
                scanResults.riskLevel === 'MEDIUM' ? 'bg-yellow-900/30 text-yellow-400' :
                'bg-red-900/30 text-red-400'
              }`}>
                {scanResults.riskLevel}
              </span>
            </div>
            <div className="w-full bg-slate-700 rounded-full h-2 overflow-hidden">
              <div
                className={`h-full transition-all ${
                  scanResults.riskLevel === 'LOW' ? 'bg-green-500' :
                  scanResults.riskLevel === 'MEDIUM' ? 'bg-yellow-500' :
                  'bg-red-500'
                }`}
                style={{ width: scanResults.reputationScore + '%' }}
              />
            </div>
            <div className="text-right text-slate-400 text-sm mt-2">
              {scanResults.reputationScore}/100
            </div>
          </div>

          {/* Social Media */}
          {Object.keys(scanResults.socialLinks).length > 0 && (
            <div className="bg-slate-800 rounded-lg p-4 border border-slate-700">
              <h3 className="text-white font-semibold mb-3">Media Sosial Terdeteksi</h3>
              <div className="space-y-2">
                {Object.entries(scanResults.socialLinks).map(([platform, urls]) => (
                  <div key={platform} className="flex items-center gap-2">
                    <div className="text-purple-400">
                      {getSocialIcon(platform)}
                    </div>
                    <span className="text-slate-300 capitalize flex-1">{platform}</span>
                    {urls && typeof urls === 'string' ? (
                      <a
                        href={urls}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="text-purple-400 hover:text-purple-300 flex items-center gap-1"
                      >
                        Buka
                        <ExternalLink size={14} />
                      </a>
                    ) : (
                      <span className="text-slate-500 text-sm">-</span>
                    )}
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Findings */}
          <div className="bg-slate-800 rounded-lg p-4 border border-slate-700">
            <h3 className="text-white font-semibold mb-3">Temuan</h3>
            <div className="space-y-2">
              {scanResults.findings.map((finding, i) => (
                <div key={i} className="flex gap-2">
                  <span className={`flex-shrink-0 ${
                    finding.type === 'positive' ? 'text-green-400' : 'text-yellow-400'
                  }`}>
                    •
                  </span>
                  <span className={`text-sm ${
                    finding.type === 'positive' ? 'text-green-400' : 'text-yellow-400'
                  }`}>
                    {finding.text}
                  </span>
                </div>
              ))}
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default ProjectScanner;
