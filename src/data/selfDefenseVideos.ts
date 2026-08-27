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
    title: 'Situational Awareness — Spotting Danger Early',
    description: 'Learn how to read your environment, spot warning signs, and position yourself safely in public.',
    youtubeId: 'dQw4w9WgXcQ', // Placeholder
    category: 'Situational Awareness',
    duration: '8 min',
    difficulty: 'Beginner',
    tags: ['awareness', 'prevention', 'public spaces', 'observation'],
    thumbnailUrl: 'https://images.unsplash.com/photo-1542880941-1971f11a7de6?q=80&w=800&auto=format&fit=crop',
    safetyNote: 'Always prioritize avoiding confrontation. If you feel unsafe, trust your instincts and leave the area immediately.'
  },
  {
    id: 'v2',
    title: 'Palm Strike & Wrist Release — Quick Escapes',
    description: 'Essential wrist-grab releases and palm strikes anyone can learn in minutes.',
    youtubeId: 'dQw4w9WgXcQ',
    category: 'Escape Techniques',
    duration: '12 min',
    difficulty: 'Beginner',
    tags: ['escape', 'strike', 'hands-on', 'wrist grab'],
    thumbnailUrl: 'https://images.unsplash.com/photo-1555597673-b21d5c935865?q=80&w=800&auto=format&fit=crop',
    safetyNote: 'These techniques are for creating an opportunity to run. Do not attempt to stay and fight.'
  },
  {
    id: 'v3',
    title: 'De-escalation: How to Talk Your Way to Safety',
    description: 'Verbal strategies and body language to diffuse confrontations before they become physical.',
    youtubeId: 'dQw4w9WgXcQ',
    category: 'De-escalation',
    duration: '10 min',
    difficulty: 'Beginner',
    tags: ['verbal', 'communication', 'conflict', 'psychology'],
    thumbnailUrl: 'https://images.unsplash.com/photo-1573497491208-6f16bfc4ac22?q=80&w=800&auto=format&fit=crop',
    safetyNote: 'Maintain a safe distance (at least two arms lengths) while attempting to de-escalate.'
  },
  {
    id: 'v4',
    title: 'Public Transport Safety: Cabs and Buses',
    description: 'Crucial checks before getting into a rideshare, and how to position yourself safely on public transit.',
    youtubeId: 'dQw4w9WgXcQ',
    category: 'Public Transport Safety',
    duration: '15 min',
    difficulty: 'Intermediate',
    tags: ['uber', 'taxi', 'bus', 'train', 'commute'],
    thumbnailUrl: 'https://images.unsplash.com/photo-1533596665452-f192b952fa8b?q=80&w=800&auto=format&fit=crop',
    safetyNote: 'Always share your ride details with a trusted contact before getting into any vehicle.'
  },
  {
    id: 'v5',
    title: 'Night Safety: Navigating Unlit Areas',
    description: 'Practical street-smart tactics for navigating poorly lit areas, parking lots, and walking home at night.',
    youtubeId: 'dQw4w9WgXcQ',
    category: 'Night Safety',
    duration: '9 min',
    difficulty: 'Beginner',
    tags: ['night', 'walking', 'parking lot', 'dark'],
    thumbnailUrl: 'https://images.unsplash.com/photo-1509115713430-b384ff74bb4d?q=80&w=800&auto=format&fit=crop',
    safetyNote: 'Keep your hands free (unplug headphones, put phone away) to stay fully aware of your surroundings.'
  },
  {
    id: 'v6',
    title: 'Ground Defense: What to Do if You Fall',
    description: 'Key defensive postures, how to protect your head, and escape moves if you are taken to the ground.',
    youtubeId: 'dQw4w9WgXcQ',
    category: 'Basic Self-Defense',
    duration: '14 min',
    difficulty: 'Advanced',
    tags: ['ground', 'defense', 'fall', 'advanced'],
    thumbnailUrl: 'https://images.unsplash.com/photo-1517838277536-f5f99be501cd?q=80&w=800&auto=format&fit=crop',
    safetyNote: 'Practicing ground maneuvers should only be done on soft surfaces in a controlled environment.'
  },
  {
    id: 'v7',
    title: 'Emergency Response & SOS Handling',
    description: 'How to effectively use your phone\'s SOS features and what exactly to say when calling emergency services.',
    youtubeId: 'dQw4w9WgXcQ',
    category: 'Emergency Response',
    duration: '11 min',
    difficulty: 'Beginner',
    tags: ['sos', 'police', 'calling 911', 'emergency'],
    thumbnailUrl: 'https://images.unsplash.com/photo-1584988775618-9366e4a6015b?q=80&w=800&auto=format&fit=crop',
    safetyNote: 'When calling for help, always state your exact location first, before explaining the emergency.'
  }
];

/**
 * Returns a list of recommended videos from the local catalogue based on a given topic/query.
 * @param topic The search term or topic (e.g. 'rideshare', 'night', 'escape')
 */
export function getRecommendedResources(topic: string): LearningVideo[] {
  const query = topic.toLowerCase();
  
  if (!query) {
    // Default to beginner fundamentals if no specific topic
    return SELF_DEFENSE_VIDEOS.filter(v => v.difficulty === 'Beginner').slice(0, 3);
  }

  // Score matches to rank them
  const scored = SELF_DEFENSE_VIDEOS.map(video => {
    let score = 0;
    
    // Direct match in tags (highest weight)
    if (video.tags.some(tag => tag.toLowerCase().includes(query) || query.includes(tag.toLowerCase()))) {
      score += 10;
    }
    
    // Direct match in category
    if (video.category.toLowerCase().includes(query) || query.includes(video.category.toLowerCase())) {
      score += 8;
    }
    
    // Match in title
    if (video.title.toLowerCase().includes(query)) {
      score += 5;
    }
    
    // Match in description
    if (video.description.toLowerCase().includes(query)) {
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
    
  return results.length > 0 ? results : getRecommendedResources(''); // fallback if no match
}
