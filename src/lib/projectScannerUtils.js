// Social media platform configuration
export const SOCIAL_PLATFORMS = {
  twitter: {
    name: 'Twitter',
    patterns: [
      /(?:https?:\/\/)?(?:www\.)?(?:twitter|x)\.com\/([a-zA-Z0-9_]+)/gi,
      /(?:@|twitter\.com\/)?([a-zA-Z0-9_]{1,15})(?:\s|$|[^\w])/gi
    ],
    color: '#1DA1F2',
    icon: 'twitter'
  },
  discord: {
    name: 'Discord',
    patterns: [
      /discord\.(?:gg|com)\/([a-zA-Z0-9-]+)/gi,
      /discord\.com\/invite\/([a-zA-Z0-9-]+)/gi
    ],
    color: '#5865F2',
    icon: 'discord'
  },
  telegram: {
    name: 'Telegram',
    patterns: [
      /(?:https?:\/\/)?(?:www\.)?t\.me\/([a-zA-Z0-9_]+)/gi,
      /(?:https?:\/\/)?telegram\.me\/([a-zA-Z0-9_]+)/gi
    ],
    color: '#0088cc',
    icon: 'telegram'
  },
  github: {
    name: 'GitHub',
    patterns: [
      /(?:https?:\/\/)?(?:www\.)?github\.com\/([a-zA-Z0-9_-]+)/gi
    ],
    color: '#333333',
    icon: 'github'
  },
  linkedin: {
    name: 'LinkedIn',
    patterns: [
      /(?:https?:\/\/)?(?:www\.)?linkedin\.com\/company\/([a-zA-Z0-9_-]+)/gi,
      /(?:https?:\/\/)?(?:www\.)?linkedin\.com\/in\/([a-zA-Z0-9_-]+)/gi
    ],
    color: '#0077B5',
    icon: 'linkedin'
  },
  youtube: {
    name: 'YouTube',
    patterns: [
      /(?:https?:\/\/)?(?:www\.)?youtube\.com\/@?([a-zA-Z0-9_-]+)/gi,
      /(?:https?:\/\/)?youtu\.be\/([a-zA-Z0-9_-]+)/gi
    ],
    color: '#FF0000',
    icon: 'youtube'
  }
};

// Extract social links from text with deduplication
export const extractSocialLinks = (text) => {
  const links = {};
  
  if (!text || typeof text !== 'string') {
    return links;
  }
  
  Object.entries(SOCIAL_PLATFORMS).forEach(([platform, config]) => {
    links[platform] = [];
    
    config.patterns.forEach(pattern => {
      let match;
      // Reset lastIndex untuk regex dengan global flag
      pattern.lastIndex = 0;
      
      while ((match = pattern.exec(text)) !== null) {
        const username = match[1];
        
        // Validate username format
        if (username && isValidUsername(platform, username)) {
          const url = getFullUrl(platform, username);
          if (url) {
            links[platform].push({
              username: username,
              url: url
            });
          }
        }
      }
    });
    
    // Remove duplicates by URL
    links[platform] = Array.from(
      new Map(links[platform].map(item => [item.url, item])).values()
    );
    
    // Filter empty arrays
    if (links[platform].length === 0) {
      delete links[platform];
    }
  });
  
  console.log('[v0] Extract Social Result:', links);
  return links;
};

// Validate username format untuk setiap platform
const isValidUsername = (platform, username) => {
  // Prevent obvious false positives
  const invalidPatterns = {
    twitter: /^\d+$/, // Hanya angka
    discord: /^\d+$/, // Hanya angka
    github: /^[a-zA-Z0-9]{1}$/, // Single char
    telegram: /^[a-zA-Z0-9]{1}$/ // Single char
  };
  
  const pattern = invalidPatterns[platform];
  if (pattern && pattern.test(username)) {
    return false;
  }
  
  // Username length check
  if (username.length < 2 || username.length > 32) {
    return false;
  }
  
  return true;
};

// Get full URL for social platform
export const getFullUrl = (platform, username) => {
  const urls = {
    twitter: 'https://twitter.com/' + encodeURIComponent(username),
    discord: 'https://discord.gg/' + encodeURIComponent(username),
    telegram: 'https://t.me/' + encodeURIComponent(username),
    github: 'https://github.com/' + encodeURIComponent(username),
    linkedin: 'https://linkedin.com/company/' + encodeURIComponent(username),
    youtube: 'https://youtube.com/@' + encodeURIComponent(username)
  };
  return urls[platform] || null;
};

// Analyze reputation score dengan findings detailed
export const analyzeReputationScore = (data) => {
  let score = 50;
  const findings = [];

  // Security check - HTTPS
  if (data.security && data.security.https) {
    score += 15;
    findings.push({
      type: 'positive',
      text: 'Website menggunakan HTTPS (terenkripsi & aman)'
    });
  } else {
    score -= 20;
    findings.push({
      type: 'critical',
      text: 'Website tidak menggunakan HTTPS - Koneksi tidak terenkripsi'
    });
  }

  // Social media check
  const socialPlatforms = Object.values(data.socialMedia || {}).filter(arr => arr && arr.length > 0);
  const socialCount = socialPlatforms.length;
  
  if (socialCount >= 4) {
    score += 15;
    findings.push({
      type: 'positive',
      text: 'Kehadiran media sosial kuat (' + socialCount + ' platform terdeteksi)'
    });
  } else if (socialCount >= 2) {
    score += 10;
    findings.push({
      type: 'positive',
      text: 'Memiliki ' + socialCount + ' channel media sosial'
    });
  } else if (socialCount === 1) {
    score += 5;
    findings.push({
      type: 'warning',
      text: 'Hanya 1 media sosial ditemukan'
    });
  } else {
    score -= 20;
    findings.push({
      type: 'critical',
      text: 'TIDAK ADA media sosial terdeteksi - Red flag utama'
    });
  }

  // Project info check - extract dari HTML
  if (data.projectInfo) {
    const projectInfo = data.projectInfo;
    
    if (projectInfo.hasWhitepaper) {
      score += 10;
      findings.push({
        type: 'positive',
        text: 'Whitepaper tersedia - Menunjukkan seriusitas proyek'
      });
    }
    
    if (projectInfo.hasFaq) {
      score += 5;
      findings.push({
        type: 'positive',
        text: 'FAQ/dokumentasi ditemukan'
      });
    } else if (projectInfo.hasRoadmap) {
      score += 5;
      findings.push({
        type: 'positive',
        text: 'Roadmap tersedia'
      });
    }
    
    if (projectInfo.hasTeamInfo) {
      score += 8;
      findings.push({
        type: 'positive',
        text: 'Informasi tim transparan'
      });
    } else {
      score -= 5;
      findings.push({
        type: 'warning',
        text: 'Tidak ada informasi tim yang jelas'
      });
    }
  }

  // Red flag checks untuk scam indicators
  const htmlContent = data.htmlContent || '';
  
  if (/guarantee.*profit|guaranteed.*return|100%.*profit|risk.?free/i.test(htmlContent)) {
    score -= 25;
    findings.push({
      type: 'critical',
      text: 'Klaim profit yang dijamin - SANGAT MENCURIGAKAN'
    });
  }

  if (/limited.*time|hurry|act.*now|urgent|last.*chance|offer.*ends/i.test(htmlContent)) {
    score -= 10;
    findings.push({
      type: 'warning',
      text: 'Taktik urgency/scarcity terdeteksi'
    });
  }

  if (/invest.*now|send.*money|buy.*token|purchase.*now/i.test(htmlContent)) {
    score -= 8;
    findings.push({
      type: 'warning',
      text: 'Permohonan investasi langsung'
    });
  }

  if (/referral.*bonus|referral.*reward|earn.*easy|get.*rich/i.test(htmlContent)) {
    score -= 10;
    findings.push({
      type: 'warning',
      text: 'MLM/referral scheme indicators'
    });
  }

  // Cap score between 0-100
  score = Math.max(0, Math.min(100, score));

  let riskLevel = 'LOW';
  if (score < 30) {
    riskLevel = 'HIGH';
  } else if (score < 60) {
    riskLevel = 'MEDIUM';
  }

  return {
    score: Math.round(score),
    riskLevel,
    findings: findings.length > 0 ? findings : [{ type: 'warning', text: 'Tidak ada data cukup untuk analisis detail' }]
  };
};

// Extract project information from HTML
export const extractProjectInfo = (html) => {
  const info = {
    title: '',
    description: '',
    hasWhitepaper: false,
    hasFaq: false,
    hasRoadmap: false,
    hasTeamInfo: false
  };

  if (!html || html.length === 0) {
    return info;
  }

  // Extract title
  const titleMatch = html.match(/<title[^>]*>([^<]+)<\/title>/i);
  if (titleMatch) {
    info.title = titleMatch[1].trim().substring(0, 100);
  }

  // Extract meta description
  const descMatch = html.match(/<meta\s+name=["\']description["\']\s+content=["\'](.*?)["\'][^>]*>/i);
  if (descMatch) {
    info.description = descMatch[1].trim().substring(0, 200);
  }

  // Check for common pages
  info.hasWhitepaper = /whitepaper|white\s?paper|litepaper|lite\s?paper/i.test(html);
  info.hasFaq = /faq|frequently\s+asked|help|support/i.test(html);
  info.hasRoadmap = /roadmap|milestones|development\s+plan/i.test(html);
  info.hasTeamInfo = /team|about\s+us|our\s+team|founder|ceo|leadership/i.test(html);

  return info;
};

// Analyze with Groq AI (if available)
export const analyzeWithGroqAI = async (groqApiKey, projectData) => {
  if (!groqApiKey) {
    throw new Error('Groq API Key tidak ditemukan. Silakan setup di bagian AI Provider.');
  }

  const socialMediaInfo = Object.entries(projectData.socialMedia || {})
    .filter(([, links]) => links && links.length > 0)
    .map(([platform, links]) => platform + ': ' + links.map(l => l.username).join(', '))
    .join('\n');

  const projectInfo = projectData.projectInfo || {};

  const prompt = `Anda adalah analis keamanan blockchain cryptocurrency berpengalaman. Analisis proyek berikut secara menyeluruh dalam Bahasa Indonesia:

WEBSITE: ${projectData.website}
SKOR REPUTASI: ${projectData.score}/100
TINGKAT RISIKO: ${projectData.riskLevel}
HTTPS: ${projectData.security?.https ? 'Ya' : 'Tidak'}

INFORMASI PROYEK:
- Judul: ${projectInfo.title || 'N/A'}
- Deskripsi: ${projectInfo.description || 'N/A'}
- Whitepaper: ${projectInfo.hasWhitepaper ? 'Ada' : 'Tidak'}
- FAQ: ${projectInfo.hasFaq ? 'Ada' : 'Tidak'}
- Roadmap: ${projectInfo.hasRoadmap ? 'Ada' : 'Tidak'}
- Tim: ${projectInfo.hasTeamInfo ? 'Ada' : 'Tidak'}

MEDIA SOSIAL:
${socialMediaInfo || 'Tidak ada media sosial ditemukan'}

RED FLAGS TERDETEKSI:
${projectData.findings?.filter(f => f.type === 'critical').map(f => '- ' + f.text).join('\n') || 'Tidak ada critical issues'}

Berikan analisis dengan format:

RINGKASAN:
[2-3 kalimat tentang keseluruhan proyek]

KEKUATAN:
[3 poin positif, atau "Minimal"]

KELEMAHAN:
[3 poin negatif, atau "Tidak signifikan"]

REKOMENDASI:
[3 langkah investigasi selanjutnya]

KESIMPULAN:
[1 paragraf final dengan risk assessment]`;

  try {
    const response = await fetch('https://api.groq.com/openai/v1/chat/completions', {
      method: 'POST',
      headers: {
        'Authorization': 'Bearer ' + groqApiKey,
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({
        model: 'mixtral-8x7b-32768',
        messages: [
          {
            role: 'system',
            content: 'Anda adalah analis keamanan cryptocurrency profesional. Berikan analisis jujur dan detail dalam Bahasa Indonesia.'
          },
          {
            role: 'user',
            content: prompt
          }
        ],
        max_tokens: 1500,
        temperature: 0.7
      })
    });

    if (!response.ok) {
      const errorData = await response.json();
      throw new Error(errorData.error?.message || 'API error');
    }

    const data = await response.json();
    return data.choices[0].message.content;
  } catch (error) {
    throw new Error('Gagal mendapatkan analisis AI: ' + error.message);
  }
};

export default {
  SOCIAL_PLATFORMS,
  extractSocialLinks,
  extractProjectInfo,
  analyzeReputationScore,
  analyzeWithGroqAI,
  getFullUrl
};
