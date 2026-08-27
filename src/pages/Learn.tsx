import { useState, useMemo, useEffect } from 'react';
import { BookOpen, Play, Search, Clock, X, ExternalLink, ShieldAlert, CheckCircle2, MessageSquareText } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { Badge } from '../components/ui/Badge';
import { Button } from '../components/ui/Button';
import { SELF_DEFENSE_VIDEOS, VIDEO_CATEGORIES, type VideoCategory } from '../data/selfDefenseVideos';
import { learningService } from '../services/learningService';
import { useAuth } from '../context/AuthContext';
import { cn } from '../utils/formatters';

type Difficulty = 'All' | 'Beginner' | 'Intermediate' | 'Advanced';

const DIFFICULTY_OPTIONS: Difficulty[] = ['All', 'Beginner', 'Intermediate', 'Advanced'];

const DIFF_COLORS: Record<string, string> = {
  Beginner:     'bg-safe-500/15 text-safe-300 border-safe-500/30',
  Intermediate: 'bg-caution-500/15 text-caution-300 border-caution-500/30',
  Advanced:     'bg-danger-500/15 text-danger-300 border-danger-500/30',
};

export default function Learn() {
  const navigate = useNavigate();
  const { user } = useAuth();
  
  const [searchQuery, setSearchQuery] = useState('');
  const [activeCategory, setActiveCategory] = useState<VideoCategory | 'All'>('All');
  const [activeDifficulty, setActiveDifficulty] = useState<Difficulty>('All');
  const [selectedVideo, setSelectedVideo] = useState<typeof SELF_DEFENSE_VIDEOS[0] | null>(null);
  
  const [watchedIds, setWatchedIds] = useState<Set<string>>(new Set());

  // Load progress
  useEffect(() => {
    if (user?.id) {
      learningService.getProgress(user.id).then(({ data }) => {
        if (data) {
          const completed = new Set(data.filter((p: any) => p.completed).map((p: any) => p.video_id));
          setWatchedIds(completed);
        }
      });
    }
  }, [user?.id]);

  const handleMarkWatched = async (videoId: string) => {
    if (!user?.id) return;
    const newWatched = new Set(watchedIds);
    newWatched.add(videoId);
    setWatchedIds(newWatched);
    await learningService.updateProgress(user.id, videoId, 100, true);
  };

  const handleAskSaheli = (videoTitle: string) => {
    navigate(`/companion?prompt=${encodeURIComponent(`I'm learning about "${videoTitle}". Can you give me some extra tips?`)}`);
  };

  const filtered = useMemo(() => SELF_DEFENSE_VIDEOS.filter(v => {
    const matchSearch = v.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
                        v.description.toLowerCase().includes(searchQuery.toLowerCase()) ||
                        v.tags.some(t => t.toLowerCase().includes(searchQuery.toLowerCase()));
    const matchCat  = activeCategory === 'All' || v.category === activeCategory;
    const matchDiff = activeDifficulty === 'All' || v.difficulty === activeDifficulty;
    return matchSearch && matchCat && matchDiff;
  }), [searchQuery, activeCategory, activeDifficulty]);

  const recommended   = SELF_DEFENSE_VIDEOS.filter(v => v.category === 'Situational Awareness').slice(0, 2);
  const beginners     = SELF_DEFENSE_VIDEOS.filter(v => v.difficulty === 'Beginner' && !recommended.includes(v)).slice(0, 3);
  const popular       = SELF_DEFENSE_VIDEOS.filter(v => v.category === 'Escape Techniques' || v.category === 'Basic Self-Defense').slice(0, 3);
  
  const hasFilters    = searchQuery || activeCategory !== 'All' || activeDifficulty !== 'All';

  return (
    <div className="page-wrapper space-y-6 max-w-5xl">

      {/* ── Header & Disclaimer ── */}
      <div>
        <h1 className="text-2xl font-bold text-white">Learn practical safety skills</h1>
        <p className="text-slate-400 text-sm mt-1">Curated self-defense and situational awareness resources</p>
      </div>

      <div className="bg-amber-500/10 border border-amber-500/20 rounded-2xl p-4 flex gap-3 items-start">
        <ShieldAlert className="w-5 h-5 text-amber-500 flex-shrink-0 mt-0.5" />
        <p className="text-sm text-amber-200/80 leading-relaxed">
          <strong className="text-amber-400">Educational content only.</strong> Prioritize escaping danger and seeking help. Do not attempt to engage an attacker unless absolutely necessary.
        </p>
      </div>

      {/* ── Search & Filters ── */}
      <div className="space-y-3">
        <div className="relative">
          <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-500" />
          <input
            id="learn-search"
            type="text"
            value={searchQuery}
            onChange={e => setSearchQuery(e.target.value)}
            placeholder="Search by title, category, or tags..."
            className="w-full pl-11 pr-4 py-3 bg-surface-800/80 border border-white/10 rounded-2xl text-sm text-slate-200 placeholder-slate-500 focus:outline-none focus:border-primary-500/50 focus:ring-1 focus:ring-primary-500/30 transition-all"
          />
          {searchQuery && (
            <button onClick={() => setSearchQuery('')} className="absolute right-4 top-1/2 -translate-y-1/2 text-slate-500 hover:text-slate-300">
              <X className="w-4 h-4" />
            </button>
          )}
        </div>

        <div className="flex flex-wrap gap-3">
          <div className="flex gap-2 flex-wrap">
            {(['All', ...VIDEO_CATEGORIES] as const).map(cat => (
              <button
                key={cat}
                onClick={() => setActiveCategory(cat as VideoCategory | 'All')}
                className={cn(
                  'px-3.5 py-1.5 rounded-xl text-xs font-semibold transition-all border',
                  activeCategory === cat
                    ? 'bg-primary-600/30 border-primary-500/50 text-primary-200'
                    : 'bg-surface-700/40 border-transparent text-slate-500 hover:text-slate-300',
                )}
              >
                {cat}
              </button>
            ))}
          </div>
          <div className="w-px h-6 self-center bg-white/10 hidden sm:block" />
          <div className="flex gap-2">
            {DIFFICULTY_OPTIONS.map(d => (
              <button
                key={d}
                onClick={() => setActiveDifficulty(d)}
                className={cn(
                  'px-3.5 py-1.5 rounded-xl text-xs font-semibold transition-all border',
                  activeDifficulty === d
                    ? 'bg-surface-600 border-white/20 text-white'
                    : 'bg-surface-700/40 border-transparent text-slate-500 hover:text-slate-300',
                )}
              >
                {d}
              </button>
            ))}
          </div>
        </div>
      </div>

      {/* ── Sections (Only show if not searching/filtering) ── */}
      {!hasFilters ? (
        <div className="space-y-8">
          <section>
            <div className="flex items-center gap-2 mb-3">
              <BookOpen className="w-4 h-4 text-primary-400" />
              <h2 className="section-title text-base">Recommended</h2>
            </div>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              {recommended.map(video => (
                <VideoCard key={video.id} video={video} featured onClick={() => setSelectedVideo(video)} isWatched={watchedIds.has(video.id)} />
              ))}
            </div>
          </section>

          <section>
            <div className="flex items-center gap-2 mb-3">
              <BookOpen className="w-4 h-4 text-safe-400" />
              <h2 className="section-title text-base">Beginner Friendly</h2>
            </div>
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
              {beginners.map(video => (
                <VideoCard key={video.id} video={video} onClick={() => setSelectedVideo(video)} isWatched={watchedIds.has(video.id)} />
              ))}
            </div>
          </section>

          <section>
            <div className="flex items-center gap-2 mb-3">
              <BookOpen className="w-4 h-4 text-accent-400" />
              <h2 className="section-title text-base">Popular Skills</h2>
            </div>
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
              {popular.map(video => (
                <VideoCard key={video.id} video={video} onClick={() => setSelectedVideo(video)} isWatched={watchedIds.has(video.id)} />
              ))}
            </div>
          </section>
        </div>
      ) : (
        /* ── Filtered Results ── */
        <section>
          <div className="flex items-center justify-between mb-3">
            <h2 className="section-title text-base">
              Results ({filtered.length})
            </h2>
            <button
              onClick={() => { setSearchQuery(''); setActiveCategory('All'); setActiveDifficulty('All'); }}
              className="text-xs text-slate-500 hover:text-slate-300 flex items-center gap-1 transition-colors"
            >
              <X className="w-3.5 h-3.5" /> Clear filters
            </button>
          </div>

          {filtered.length === 0 ? (
            <div className="text-center py-14 text-slate-500">
              <Search className="w-10 h-10 mx-auto mb-3 opacity-40" />
              <p className="font-medium">No videos found</p>
              <p className="text-sm mt-1">Try adjusting your search or filters</p>
            </div>
          ) : (
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
              {filtered.map(video => (
                <VideoCard key={video.id} video={video} onClick={() => setSelectedVideo(video)} isWatched={watchedIds.has(video.id)} />
              ))}
            </div>
          )}
        </section>
      )}

      {/* ── Video Modal ── */}
      {selectedVideo && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/70 backdrop-blur-sm animate-fade-in"
          onClick={e => e.target === e.currentTarget && setSelectedVideo(null)}
        >
          <div className="bg-surface-800 border border-white/10 rounded-3xl shadow-glass w-full max-w-2xl overflow-hidden animate-slide-up flex flex-col max-h-[90vh]">
            
            {/* Header */}
            <div className="flex items-center justify-between p-4 border-b border-white/5">
              <h3 className="font-bold text-white truncate pr-4">{selectedVideo.title}</h3>
              <button
                onClick={() => setSelectedVideo(null)}
                className="flex-shrink-0 w-8 h-8 rounded-xl bg-surface-700 hover:bg-surface-600 flex items-center justify-center text-slate-400 hover:text-white transition-all"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <div className="overflow-y-auto">
              {/* Embed Area */}
              <div className="relative aspect-video bg-black">
                <iframe 
                  className="w-full h-full"
                  src={`https://www.youtube.com/embed/${selectedVideo.youtubeId}?rel=0`} 
                  title={selectedVideo.title}
                  frameBorder="0" 
                  allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture" 
                  allowFullScreen
                ></iframe>
              </div>

              {/* Content */}
              <div className="p-6 space-y-5">
                <div className="flex flex-wrap items-center gap-2">
                  <span className={cn('px-2.5 py-1 rounded-lg text-xs font-semibold border', DIFF_COLORS[selectedVideo.difficulty])}>
                    {selectedVideo.difficulty}
                  </span>
                  <Badge variant="muted">{selectedVideo.category}</Badge>
                  <span className="flex items-center gap-1 text-xs text-slate-500 ml-auto">
                    <Clock className="w-3.5 h-3.5" /> {selectedVideo.duration}
                  </span>
                </div>

                <p className="text-sm text-slate-300 leading-relaxed">
                  {selectedVideo.description}
                </p>

                {/* Safety Note */}
                <div className="bg-surface-700/50 rounded-xl p-4 border border-white/5">
                  <h4 className="text-xs font-bold text-slate-400 uppercase tracking-wider mb-2 flex items-center gap-1.5">
                    <ShieldAlert className="w-3.5 h-3.5" /> Safety Note
                  </h4>
                  <p className="text-sm text-slate-200">
                    {selectedVideo.safetyNote}
                  </p>
                </div>

                {/* Actions */}
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 pt-2">
                  <Button
                    variant="secondary"
                    onClick={() => handleAskSaheli(selectedVideo.title)}
                    className="flex items-center justify-center gap-2"
                  >
                    <MessageSquareText className="w-4 h-4" /> Ask Saheli
                  </Button>
                  
                  {watchedIds.has(selectedVideo.id) ? (
                    <Button variant="safe" className="cursor-default flex items-center justify-center gap-2">
                      <CheckCircle2 className="w-4 h-4" /> Completed
                    </Button>
                  ) : (
                    <Button
                      variant="primary"
                      onClick={() => handleMarkWatched(selectedVideo.id)}
                      className="flex items-center justify-center gap-2"
                    >
                      <CheckCircle2 className="w-4 h-4" /> Mark as Watched
                    </Button>
                  )}
                </div>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

// ─── Video Card ───────────────────────────────────────────────────────────────

function VideoCard({ video, featured = false, isWatched = false, onClick }: {
  video: typeof SELF_DEFENSE_VIDEOS[0];
  featured?: boolean;
  isWatched?: boolean;
  onClick: () => void;
}) {
  return (
    <button
      id={`video-card-${video.id}`}
      onClick={onClick}
      className={cn(
        'text-left rounded-2xl border border-white/10 bg-surface-800/60 overflow-hidden relative',
        'hover:border-primary-500/30 hover:bg-surface-700/60 transition-all duration-200 group',
        featured && 'ring-1 ring-primary-500/20',
      )}
    >
      {/* Thumbnail */}
      <div className="relative aspect-video bg-surface-700 overflow-hidden">
        <img
          src={video.thumbnailUrl}
          alt={video.title}
          className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
          onError={e => { (e.currentTarget as HTMLImageElement).src = `https://picsum.photos/seed/${video.id}/400/225`; }}
        />
        <div className="absolute inset-0 bg-black/30 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity">
          <div className="w-11 h-11 rounded-full bg-white/20 backdrop-blur-sm border border-white/30 flex items-center justify-center">
            <Play className="w-5 h-5 text-white translate-x-0.5" />
          </div>
        </div>
        
        {/* Watched Badge */}
        {isWatched && (
          <div className="absolute top-2 right-2 w-6 h-6 rounded-full bg-safe-500 flex items-center justify-center shadow-lg">
            <CheckCircle2 className="w-3.5 h-3.5 text-white" />
          </div>
        )}

        {/* Duration badge */}
        <div className="absolute bottom-2 right-2 px-2 py-0.5 rounded-lg bg-black/70 text-white text-[10px] font-semibold flex items-center gap-1">
          <Clock className="w-2.5 h-2.5" /> {video.duration}
        </div>
      </div>

      {/* Info */}
      <div className="p-3.5">
        <div className="flex items-center gap-2 mb-2">
          <span className={cn('px-2 py-0.5 rounded-md text-[10px] font-bold border', DIFF_COLORS[video.difficulty])}>
            {video.difficulty}
          </span>
          <span className="text-[10px] text-slate-500 line-clamp-1">{video.category}</span>
        </div>
        <p className="text-sm font-semibold text-slate-200 leading-snug group-hover:text-white transition-colors line-clamp-2">
          {video.title}
        </p>
      </div>
    </button>
  );
}
