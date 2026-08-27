// ─── Self-Defence Learning Catalogue ─────────────────────────────────────────

export interface LearningVideo {
  id: string;
  title: string;
  description: string;
  youtubeId: string;
  category: VideoCategory;
  duration: string;
  difficulty: 'Beginner' | 'Intermediate' | 'Advanced';
  tags: string[];
  thumbnailUrl: string;
  sourceUrl: string;
  safetyNote: string;
}

export type VideoCategory =
  | 'Basic Self-Defense'
  | 'Escape Techniques'
  | 'Situational Awareness'
  | 'Public Transport Safety'
  | 'Night Safety'
  | 'De-escalation'
  | 'Emergency Response';

export const VIDEO_CATEGORIES: VideoCategory[] = [
  'Basic Self-Defense',
  'Escape Techniques',
  'Situational Awareness',
  'Public Transport Safety',
  'Night Safety',
  'De-escalation',
  'Emergency Response',
];

export const SELF_DEFENSE_VIDEOS: LearningVideo[] = [
  {
    id: 'v1',
    title: '5 Self-Defense Moves Every Woman Should Know | HER Network',
    description: 'Practical step-by-step self-defense moves for women when grabbed, pinned, or approached, emphasizing leverage and escape over raw strength.',
    youtubeId: 'KVpxP3ZZtAc',
    category: 'Basic Self-Defense',
    duration: '10 min',
    difficulty: 'Beginner',
    tags: ['basic moves', 'strikes', 'leverage', 'women self defense', 'escape'],
    thumbnailUrl: 'https://i.ytimg.com/vi/KVpxP3ZZtAc/hqdefault.jpg',
    sourceUrl: 'https://www.youtube.com/watch?v=KVpxP3ZZtAc',
    safetyNote: 'Always prioritize creating an immediate opening to escape to safety rather than staying in a physical confrontation.'
  },
  {
    id: 'v2',
    title: 'How to Escape a Wrist Hold | Self-Defense',
    description: 'Essential technique to break out of single and opposite-hand wrist grabs using hip rotation and targeting the attacker\'s weak grip point.',
    youtubeId: 'sY-P5GBwggU',
    category: 'Escape Techniques',
    duration: '3 min',
    difficulty: 'Beginner',
    tags: ['wrist grab', 'release', 'escape', 'grip break', 'technique'],
    thumbnailUrl: 'https://i.ytimg.com/vi/sY-P5GBwggU/hqdefault.jpg',
    sourceUrl: 'https://www.youtube.com/watch?v=sY-P5GBwggU',
    safetyNote: 'Use your entire body momentum and core rotation rather than relying purely on arm strength.'
  },
  {
    id: 'v3',
    title: 'Situational Intelligence: The Hidden Skill That Will Transform Your Life',
    description: 'Former Federal Air Marshal Ashley Glinka breaks down how to read environments, detect danger early, and establish situational awareness in public spaces.',
    youtubeId: '1UwJ02VaL2s',
    category: 'Situational Awareness',
    duration: '14 min',
    difficulty: 'Beginner',
    tags: ['awareness', 'prevention', 'observation', 'tedx', 'mindset'],
    thumbnailUrl: 'https://i.ytimg.com/vi/1UwJ02VaL2s/hqdefault.jpg',
    sourceUrl: 'https://www.youtube.com/watch?v=1UwJ02VaL2s',
    safetyNote: 'Trust your intuition immediately. If someone or an area feels suspicious, change direction and seek a populated safe haven.'
  },
  {
    id: 'v4',
    title: 'Rideshare Safety Tips: How to Stay Safe Using Uber & Lyft',
    description: 'Crucial verification habits before entering rideshares, including checking license plates, confirming driver identity, and sitting in the back seat.',
    youtubeId: 'Vp1AUPAp9oo',
    category: 'Public Transport Safety',
    duration: '4 min',
    difficulty: 'Beginner',
    tags: ['uber', 'lyft', 'rideshare', 'taxi', 'commute', 'transit'],
    thumbnailUrl: 'https://i.ytimg.com/vi/Vp1AUPAp9oo/hqdefault.jpg',
    sourceUrl: 'https://www.youtube.com/watch?v=Vp1AUPAp9oo',
    safetyNote: 'Always ask "Who are you picking up?" and verify license plates before unlocking or entering the vehicle.'
  },
  {
    id: 'v5',
    title: 'How Women Walk Alone Safely At Night',
    description: 'Tactical advice for night travel: choosing illuminated paths, active body language, managing headphones, and what to do if you suspect you are being followed.',
    youtubeId: 's2yGExEQl5Y',
    category: 'Night Safety',
    duration: '6 min',
    difficulty: 'Beginner',
    tags: ['night', 'walking alone', 'dark streets', 'body language', 'safety'],
    thumbnailUrl: 'https://i.ytimg.com/vi/s2yGExEQl5Y/hqdefault.jpg',
    sourceUrl: 'https://www.youtube.com/watch?v=s2yGExEQl5Y',
    safetyNote: 'Keep your hands free and stay alert. Avoid walking with noise-canceling headphones in isolated or poorly lit areas.'
  },
  {
    id: 'v6',
    title: 'CPI De-escalation Basics Training',
    description: 'Proven non-violent communication and verbal de-escalation models from the Crisis Prevention Institute to defuse hostility and prevent conflict.',
    youtubeId: '7uKGNWEkxvc',
    category: 'De-escalation',
    duration: '5 min',
    difficulty: 'Intermediate',
    tags: ['de-escalation', 'verbal', 'conflict resolution', 'calm', 'communication'],
    thumbnailUrl: 'https://i.ytimg.com/vi/7uKGNWEkxvc/hqdefault.jpg',
    sourceUrl: 'https://www.youtube.com/watch?v=7uKGNWEkxvc',
    safetyNote: 'Maintain a safe distance of at least two arm lengths and avoid cornering or escalating voice volume.'
  },
  {
    id: 'v7',
    title: 'How to do Compression-Only CPR & Emergency Response',
    description: 'American Red Cross official tutorial on immediate crisis intervention, dialing emergency services, and performing compression-only CPR.',
    youtubeId: 'VZqG-tcZvfE',
    category: 'Emergency Response',
    duration: '3 min',
    difficulty: 'Beginner',
    tags: ['emergency', 'cpr', 'calling 911', 'first aid', 'crisis'],
    thumbnailUrl: 'https://i.ytimg.com/vi/VZqG-tcZvfE/hqdefault.jpg',
    sourceUrl: 'https://www.youtube.com/watch?v=VZqG-tcZvfE',
    safetyNote: 'In any emergency, always call emergency services first and state your location before taking further action.'
  }
];

export function getRecommendedResources(topic: string): LearningVideo[] {
  const query = topic.toLowerCase().trim();
  
  if (!query) {
    // Default to beginner fundamentals if no specific topic
    return SELF_DEFENSE_VIDEOS.filter(v => v.difficulty === 'Beginner').slice(0, 3);
  }

  const tokens = query.split(/\s+/).filter(t => t.length > 2);

  // Score matches to rank them
  const scored = SELF_DEFENSE_VIDEOS.map(video => {
    let score = 0;
    
    // Direct match in tags (highest weight)
    for (const tag of video.tags) {
      const lowerTag = tag.toLowerCase();
      if (lowerTag === query || query.includes(lowerTag)) {
        score += 20;
      } else if (tokens.some(t => lowerTag.includes(t))) {
        score += 10;
      }
    }
    
    // Direct match in category
    const lowerCategory = video.category.toLowerCase();
    if (lowerCategory === query || query.includes(lowerCategory)) {
      score += 15;
    } else if (tokens.some(t => lowerCategory.includes(t))) {
      score += 8;
    }
    
    // Match in title
    const lowerTitle = video.title.toLowerCase();
    if (lowerTitle.includes(query)) {
      score += 12;
    } else if (tokens.some(t => lowerTitle.includes(t))) {
      score += 6;
    }
    
    // Match in description
    const lowerDesc = video.description.toLowerCase();
    if (lowerDesc.includes(query)) {
      score += 5;
    } else if (tokens.some(t => lowerDesc.includes(t))) {
      score += 2;
    }
    
    return { video, score };
  });

  // Filter out zero scores, sort by score descending, and return top 3
  const results = scored
    .filter(item => item.score > 0)
    .sort((a, b) => b.score - a.score)
    .map(item => item.video)
    .slice(0, 3);
    
  return results;
}
