import { useState, useMemo, useEffect } from 'react';
import { createPortal } from 'react-dom';
import { BookOpen, Play, Search, Clock, X, ExternalLink, ShieldAlert, CheckCircle2, MessageSquareText, AlertCircle, Loader2, Sparkles } from 'lucide-react';
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
  Beginner:     'bg-emerald-50 text-emerald-700 border-emerald-200',
  Intermediate: 'bg-amber-50 text-amber-800 border-amber-200',
  Advanced:     'bg-rose-50 text-rose-700 border-rose-200',
};

export default function Learn() {
  const navigate = useNavigate();
  const { user } = useAuth();
  
  const [searchQuery, setSearchQuery] = useState('');
  const [activeCategory, setActiveCategory] = useState<VideoCategory | 'All'>('All');
  const [activeDifficulty, setActiveDifficulty] = useState<Difficulty>('All');
  const [selectedVideo, setSelectedVideo] = useState<typeof SELF_DEFENSE_VIDEOS[0] | null>(null);
  
  const [watchedIds, setWatchedIds] = useState<Set<string>>(new Set());
  const [isVideoLoading, setIsVideoLoading] = useState(true);
  const [embedError, setEmbedError] = useState(false);

  useEffect(() => {
    if (selectedVideo) {
      setIsVideoLoading(true);
      setEmbedError(false);
    }
  }, [selectedVideo]);

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

  const heroVideo      = SELF_DEFENSE_VIDEOS[0];
  const recommended    = SELF_DEFENSE_VIDEOS.filter(v => v.category === 'Situational Awareness').slice(0, 2);
  const beginners      = SELF_DEFENSE_VIDEOS.filter(v => v.difficulty === 'Beginner' && !recommended.includes(v)).slice(0, 3);
  const popular        = SELF_DEFENSE_VIDEOS.filter(v => v.category === 'Escape Techniques' || v.category === 'Basic Self-Defense').slice(0, 3);
  
  const hasFilters     = searchQuery || activeCategory !== 'All' || activeDifficulty !== 'All';

  return (
    <div className="page-wrapper space-y-6 max-w-5xl">

      {/* ── Header ── */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-primary-50 border border-primary-200/60 text-primary-700 text-xs font-bold mb-2 shadow-sm">
            <Sparkles className="w-3.5 h-3.5" />
            <span>Practical Safety Academy</span>
          </div>
          <h1 className="text-2xl sm:text-3xl font-extrabold text-slate-900 tracking-tight">Learn Self-Defense & Safety</h1>
          <p className="text-slate-500 text-xs sm:text-sm mt-0.5">Curated situational awareness, escape techniques, and personal safety lessons.</p>
        </div>
      </div>

      {/* ── Safety Disclaimer ── */}
      <div className="bg-amber-50/80 border border-amber-200 rounded-3xl p-4 sm:p-5 flex gap-3.5 items-start shadow-sm">
        <ShieldAlert className="w-5 h-5 text-amber-600 flex-shrink-0 mt-0.5" />
        <p className="text-xs sm:text-sm text-amber-900 leading-relaxed font-medium">
          <strong className="font-extrabold text-amber-950">Educational content only: </strong>
          Always prioritize de-escalating and escaping danger. Use physical defense techniques only as a last resort when your safety is directly threatened.
        </p>
      </div>

      {/* ── Featured Hero Video Banner (when no active filter) ── */}
      {!hasFilters && heroVideo && (
        <div
          onClick={() => setSelectedVideo(heroVideo)}
          className="relative overflow-hidden rounded-3xl border border-pink-200/80 bg-white p-6 sm:p-8 shadow-card hover:shadow-card-hover cursor-pointer transition-all duration-300 group"
        >
          <div className="absolute top-0 right-0 w-96 h-96 bg-gradient-to-br from-pink-200/40 via-rose-100/30 to-transparent rounded-full blur-3xl pointer-events-none" />

          <div className="relative z-10 flex flex-col md:flex-row items-center gap-6">
            {/* 16:9 Thumbnail with Glowing Play Button */}
            <div className="relative w-full md:w-72 aspect-video rounded-2xl overflow-hidden bg-slate-100 flex-shrink-0 shadow-sm">
              <img
                src={heroVideo.thumbnailUrl}
                alt={heroVideo.title}
                className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
              />
              <div className="absolute inset-0 bg-slate-900/25 flex items-center justify-center group-hover:bg-slate-900/15 transition-colors">
                <div className="w-12 h-12 rounded-full bg-white text-primary-600 flex items-center justify-center shadow-glow-primary group-hover:scale-110 transition-transform">
                  <Play className="w-5 h-5 ml-0.5 fill-current" />
                </div>
              </div>
              <div className="absolute bottom-2 right-2 px-2 py-0.5 rounded-lg bg-slate-900/80 text-white text-[10px] font-bold flex items-center gap-1">
                <Clock className="w-2.5 h-2.5" /> {heroVideo.duration}
              </div>
            </div>

            {/* Video Details */}
            <div className="flex-1 space-y-2 text-left">
              <div className="flex items-center gap-2">
                <span className="px-2.5 py-0.5 rounded-full bg-primary-50 border border-primary-200 text-primary-700 text-[10px] font-bold uppercase tracking-wider">
                  FEATURED SKILL
                </span>
                <span className={cn('px-2.5 py-0.5 rounded-full text-[10px] font-bold border', DIFF_COLORS[heroVideo.difficulty])}>
                  {heroVideo.difficulty}
                </span>
              </div>
              <h2 className="text-lg sm:text-xl font-extrabold text-slate-900 tracking-tight group-hover:text-primary-600 transition-colors">
                {heroVideo.title}
              </h2>
              <p className="text-xs sm:text-sm text-slate-600 line-clamp-2 leading-relaxed">
                {heroVideo.description}
              </p>
              <div className="pt-2">
                <span className="inline-flex items-center gap-1.5 text-xs font-bold text-primary-600 group-hover:text-primary-700">
                  <Play className="w-3.5 h-3.5 fill-current" /> Watch Featured Lesson
                </span>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* ── Search & Filters ── */}
      <div className="space-y-3.5">
        <div className="relative">
          <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-primary-500" />
          <input
            id="learn-search"
            type="text"
            value={searchQuery}
            onChange={e => setSearchQuery(e.target.value)}
            placeholder="Search lessons, categories, or keywords..."
            className="w-full pl-11 pr-10 py-3.5 bg-white border border-pink-200 rounded-2xl text-sm font-medium text-slate-800 placeholder-slate-400 focus:outline-none focus:border-primary-400 focus:ring-2 focus:ring-primary-200/50 shadow-card transition-all"
          />
          {searchQuery && (
            <button onClick={() => setSearchQuery('')} className="absolute right-4 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600">
              <X className="w-4 h-4" />
            </button>
          )}
        </div>

        {/* Category & Difficulty Pills */}
        <div className="flex flex-wrap items-center gap-3">
          <div className="flex gap-2 flex-wrap">
            {(['All', ...VIDEO_CATEGORIES] as const).map(cat => (
              <button
                key={cat}
                onClick={() => setActiveCategory(cat as VideoCategory | 'All')}
                className={cn(
                  'px-3.5 py-1.5 rounded-xl text-xs font-bold transition-all border shadow-sm',
                  activeCategory === cat
                    ? 'bg-primary-500 border-primary-500 text-white shadow-soft-pink'
                    : 'bg-white border-pink-200/80 text-slate-600 hover:text-primary-700 hover:bg-blush-50',
                )}
              >
                {cat}
              </button>
            ))}
          </div>

          <div className="w-px h-5 bg-pink-200 hidden sm:block" />

          <div className="flex gap-2">
            {DIFFICULTY_OPTIONS.map(d => (
              <button
                key={d}
                onClick={() => setActiveDifficulty(d)}
                className={cn(
                  'px-3 py-1.5 rounded-xl text-xs font-bold transition-all border shadow-sm',
                  activeDifficulty === d
                    ? 'bg-slate-800 border-slate-800 text-white'
                    : 'bg-white border-pink-200/80 text-slate-600 hover:text-slate-900 hover:bg-blush-50',
                )}
              >
                {d}
              </button>
            ))}
          </div>
        </div>
      </div>

      {/* ── Video Sections (when not filtering) ── */}
      {!hasFilters ? (
        <div className="space-y-8">
          <section>
            <div className="flex items-center gap-2 mb-3.5">
              <div className="w-7 h-7 rounded-xl bg-primary-100 text-primary-600 flex items-center justify-center">
                <BookOpen className="w-4 h-4" />
              </div>
              <h2 className="text-base font-extrabold text-slate-900 tracking-tight">Recommended Awareness</h2>
            </div>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              {recommended.map(video => (
                <VideoCard key={video.id} video={video} featured onClick={() => setSelectedVideo(video)} isWatched={watchedIds.has(video.id)} />
              ))}
            </div>
          </section>

          <section>
            <div className="flex items-center gap-2 mb-3.5">
              <div className="w-7 h-7 rounded-xl bg-emerald-100 text-emerald-700 flex items-center justify-center">
                <BookOpen className="w-4 h-4" />
              </div>
              <h2 className="text-base font-extrabold text-slate-900 tracking-tight">Beginner Friendly Essentials</h2>
            </div>
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
              {beginners.map(video => (
                <VideoCard key={video.id} video={video} onClick={() => setSelectedVideo(video)} isWatched={watchedIds.has(video.id)} />
              ))}
            </div>
          </section>

          <section>
            <div className="flex items-center gap-2 mb-3.5">
              <div className="w-7 h-7 rounded-xl bg-rose-100 text-rose-600 flex items-center justify-center">
                <BookOpen className="w-4 h-4" />
              </div>
              <h2 className="text-base font-extrabold text-slate-900 tracking-tight">Escape & Practical Techniques</h2>
            </div>
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
              {popular.map(video => (
                <VideoCard key={video.id} video={video} onClick={() => setSelectedVideo(video)} isWatched={watchedIds.has(video.id)} />
              ))}
            </div>
          </section>
        </div>
      ) : (
        /* ── Filtered Results ── */
        <section>
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-base font-extrabold text-slate-900">
              Results ({filtered.length})
            </h2>
            <button
              onClick={() => { setSearchQuery(''); setActiveCategory('All'); setActiveDifficulty('All'); }}
              className="text-xs text-primary-600 hover:text-primary-700 font-bold flex items-center gap-1 transition-colors"
            >
              <X className="w-3.5 h-3.5" /> Clear all filters
            </button>
          </div>

          {filtered.length === 0 ? (
            <div className="text-center py-16 text-slate-500 glass-card">
              <Search className="w-10 h-10 mx-auto mb-3 opacity-40 text-primary-400" />
              <p className="font-bold text-slate-800">No lessons matched your search</p>
              <p className="text-xs text-slate-500 mt-1">Try adjusting your filters or search keywords</p>
            </div>
          ) : (
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
              {filtered.map(video => (
                <VideoCard key={video.id} video={video} onClick={() => setSelectedVideo(video)} isWatched={watchedIds.has(video.id)} />
              ))}
            </div>
          )}
        </section>
      )}

      {/* ── Video Player Modal ── */}
      {selectedVideo && createPortal(
        <div
          className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/40 backdrop-blur-md animate-fade-in"
          onClick={e => e.target === e.currentTarget && setSelectedVideo(null)}
        >
          <div className="bg-white border border-pink-200 rounded-3xl shadow-2xl w-full max-w-2xl overflow-hidden animate-slide-up flex flex-col max-h-[90vh]">
            
            {/* Header */}
            <div className="flex items-center justify-between p-4 sm:p-5 border-b border-pink-100 gap-3">
              <h3 className="font-extrabold text-slate-900 truncate flex-1 text-sm sm:text-base tracking-tight">{selectedVideo.title}</h3>
              <div className="flex items-center gap-2 flex-shrink-0">
                <a
                  href={selectedVideo.sourceUrl || `https://www.youtube.com/watch?v=${selectedVideo.youtubeId}`}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="px-3 py-1.5 rounded-xl bg-blush-50 hover:bg-blush-100 border border-pink-200 flex items-center gap-1.5 text-xs text-slate-700 hover:text-slate-900 transition-all font-bold"
                  title="Open on YouTube"
                >
                  <ExternalLink className="w-3.5 h-3.5 text-rose-600" />
                  <span className="hidden sm:inline">YouTube</span>
                </a>
                <button
                  onClick={() => setSelectedVideo(null)}
                  className="w-8 h-8 rounded-full bg-blush-50 hover:bg-blush-100 border border-pink-200 flex items-center justify-center text-slate-500 hover:text-slate-800 transition-all"
                  aria-label="Close video player"
                >
                  <X className="w-4 h-4" />
                </button>
              </div>
            </div>

            <div className="overflow-y-auto">
              {/* Embed Area */}
              <div className="relative aspect-video bg-black overflow-hidden flex items-center justify-center">
                {isVideoLoading && !embedError && (
                  <div className="absolute inset-0 z-10 flex flex-col items-center justify-center bg-slate-900/90 text-slate-300 gap-2">
                    <Loader2 className="w-8 h-8 animate-spin text-primary-400" />
                    <span className="text-xs font-semibold">Loading lesson...</span>
                  </div>
                )}

                {embedError ? (
                  <div className="absolute inset-0 z-20 flex flex-col items-center justify-center p-6 text-center bg-slate-900/95 gap-3">
                    <div className="w-12 h-12 rounded-2xl bg-rose-500/10 border border-rose-500/20 flex items-center justify-center text-rose-400">
                      <AlertCircle className="w-6 h-6" />
                    </div>
                    <div>
                      <p className="text-sm font-bold text-white">Video unavailable in player</p>
                      <p className="text-xs text-slate-400 mt-1 max-w-sm">Embedding is restricted by YouTube. Please open directly.</p>
                    </div>
                    <a
                      href={selectedVideo.sourceUrl || `https://www.youtube.com/watch?v=${selectedVideo.youtubeId}`}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="inline-flex items-center gap-2 px-4 py-2 bg-rose-600 hover:bg-rose-500 text-white rounded-xl text-xs font-bold shadow-lg transition-colors mt-1"
                    >
                      <ExternalLink className="w-3.5 h-3.5" /> Watch on YouTube
                    </a>
                  </div>
                ) : (
                  <iframe
                    className="w-full h-full"
                    src={`https://www.youtube.com/embed/${selectedVideo.youtubeId}?rel=0&enablejsapi=1`}
                    title={selectedVideo.title}
                    frameBorder="0"
                    allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture; web-share"
                    allowFullScreen
                    onLoad={() => setIsVideoLoading(false)}
                    onError={() => {
                      setIsVideoLoading(false);
                      setEmbedError(true);
                    }}
                  />
                )}
              </div>

              {/* Content Details */}
              <div className="p-6 space-y-5">
                <div className="flex flex-wrap items-center gap-2">
                  <span className={cn('px-2.5 py-1 rounded-xl text-xs font-bold border', DIFF_COLORS[selectedVideo.difficulty])}>
                    {selectedVideo.difficulty}
                  </span>
                  <Badge variant="muted">{selectedVideo.category}</Badge>
                  <span className="flex items-center gap-1 text-xs text-slate-500 ml-auto font-semibold">
                    <Clock className="w-3.5 h-3.5" /> {selectedVideo.duration}
                  </span>
                </div>

                <p className="text-sm text-slate-700 leading-relaxed font-medium">
                  {selectedVideo.description}
                </p>

                {/* Safety Note */}
                <div className="bg-amber-50/70 rounded-2xl p-4 border border-amber-200">
                  <h4 className="text-xs font-bold text-amber-900 uppercase tracking-wider mb-1 flex items-center gap-1.5">
                    <ShieldAlert className="w-3.5 h-3.5 text-amber-600" /> Key Safety Note
                  </h4>
                  <p className="text-xs text-amber-800 leading-relaxed">
                    {selectedVideo.safetyNote}
                  </p>
                </div>

                {/* Actions */}
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 pt-2">
                  <Button
                    variant="secondary"
                    onClick={() => handleAskSaheli(selectedVideo.title)}
                    className="flex items-center justify-center gap-2 text-xs"
                  >
                    <MessageSquareText className="w-4 h-4 text-primary-500" /> Ask Saheli About Technique
                  </Button>
                  
                  {watchedIds.has(selectedVideo.id) ? (
                    <Button variant="safe" className="cursor-default flex items-center justify-center gap-2 text-xs">
                      <CheckCircle2 className="w-4 h-4" /> Lesson Completed ✓
                    </Button>
                  ) : (
                    <Button
                      variant="primary"
                      onClick={() => handleMarkWatched(selectedVideo.id)}
                      className="flex items-center justify-center gap-2 text-xs"
                    >
                      <CheckCircle2 className="w-4 h-4" /> Mark as Completed
                    </Button>
                  )}
                </div>
              </div>
            </div>
          </div>
        </div>,
        document.body
      )}
    </div>
  );
}

// ─── Video Card Component ─────────────────────────────────────────────────────

function VideoCard({
  video,
  featured = false,
  isWatched = false,
  onClick
}: {
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
        'text-left rounded-3xl border border-pink-200/80 bg-white overflow-hidden relative shadow-card',
        'hover:border-primary-300 hover:shadow-card-hover hover:-translate-y-1 transition-all duration-200 group flex flex-col',
        featured && 'ring-1 ring-primary-300/40',
      )}
    >
      {/* Thumbnail */}
      <div className="relative aspect-video bg-slate-100 overflow-hidden flex items-center justify-center w-full">
        <img
          src={video.thumbnailUrl}
          alt={video.title}
          className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
          onError={e => {
            (e.currentTarget as HTMLImageElement).style.display = 'none';
          }}
        />
        <div className="absolute inset-0 bg-slate-900/20 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity">
          <div className="w-11 h-11 rounded-full bg-white/90 backdrop-blur-sm border border-white text-primary-600 flex items-center justify-center shadow-lg group-hover:scale-110 transition-transform">
            <Play className="w-5 h-5 ml-0.5 fill-current" />
          </div>
        </div>
        
        {/* Watched Badge */}
        {isWatched && (
          <div className="absolute top-2.5 right-2.5 w-6 h-6 rounded-full bg-emerald-500 flex items-center justify-center shadow-sm">
            <CheckCircle2 className="w-3.5 h-3.5 text-white" />
          </div>
        )}

        {/* Duration badge */}
        <div className="absolute bottom-2.5 right-2.5 px-2 py-0.5 rounded-lg bg-slate-900/80 text-white text-[10px] font-bold flex items-center gap-1">
          <Clock className="w-2.5 h-2.5" /> {video.duration}
        </div>
      </div>

      {/* Info */}
      <div className="p-4 flex-1 flex flex-col justify-between space-y-2">
        <div>
          <div className="flex items-center gap-2 mb-2">
            <span className={cn('px-2 py-0.5 rounded-lg text-[10px] font-bold border', DIFF_COLORS[video.difficulty])}>
              {video.difficulty}
            </span>
            <span className="text-[10px] font-semibold text-slate-500 line-clamp-1">{video.category}</span>
          </div>
          <p className="text-xs sm:text-sm font-extrabold text-slate-900 leading-snug group-hover:text-primary-600 transition-colors line-clamp-2">
            {video.title}
          </p>
        </div>

        <div className="pt-2 flex items-center justify-between text-[11px] font-bold text-primary-600 border-t border-pink-50">
          <span>Watch Lesson</span>
          <Play className="w-3 h-3 fill-current group-hover:translate-x-0.5 transition-transform" />
        </div>
      </div>
    </button>
  );
}
