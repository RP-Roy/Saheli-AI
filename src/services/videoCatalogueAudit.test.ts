import { describe, it, expect } from 'vitest';
import { SELF_DEFENSE_VIDEOS, VIDEO_CATEGORIES, getRecommendedResources } from '../data/selfDefenseVideos';

describe('Focused QA Pass: Self-Defense YouTube Catalogue', () => {
  it('1. Verifies every video has a valid 11-char YouTube ID and structure', () => {
    expect(SELF_DEFENSE_VIDEOS.length).toBeGreaterThan(0);

    for (const video of SELF_DEFENSE_VIDEOS) {
      // 11-character YouTube video ID regex
      expect(video.youtubeId).toMatch(/^[a-zA-Z0-9_-]{11}$/);
      expect(video.id).toMatch(/^v\d+$/);
      expect(video.title.length).toBeGreaterThan(5);
      expect(video.description.length).toBeGreaterThan(15);
      expect(video.safetyNote.length).toBeGreaterThan(10);
      expect(VIDEO_CATEGORIES).toContain(video.category);
      expect(['Beginner', 'Intermediate', 'Advanced']).toContain(video.difficulty);
      expect(video.duration).toMatch(/^\d+\s*min$/);
      expect(video.thumbnailUrl).toBe(`https://i.ytimg.com/vi/${video.youtubeId}/hqdefault.jpg`);
      expect(video.sourceUrl).toBe(`https://www.youtube.com/watch?v=${video.youtubeId}`);
    }
  });

  it('2. Verifies every category has at least one verified video', () => {
    for (const category of VIDEO_CATEGORIES) {
      const matching = SELF_DEFENSE_VIDEOS.filter(v => v.category === category);
      expect(matching.length).toBeGreaterThan(0);
    }
  });

  it('3. Verifies live YouTube oEmbed availability for all catalogue videos', async () => {
    const auditPromises = SELF_DEFENSE_VIDEOS.map(async (video) => {
      try {
        const oembedUrl = `https://www.youtube.com/oembed?url=https://www.youtube.com/watch?v=${video.youtubeId}&format=json`;
        const res = await fetch(oembedUrl);
        if (res.ok) {
          const data = await res.json();
          return {
            id: video.id,
            youtubeId: video.youtubeId,
            title: video.title,
            ok: true,
            status: res.status,
            oembedTitle: data.title,
          };
        } else {
          return {
            id: video.id,
            youtubeId: video.youtubeId,
            title: video.title,
            ok: false,
            status: res.status,
          };
        }
      } catch {
        return {
          id: video.id,
          youtubeId: video.youtubeId,
          title: video.title,
          ok: false,
          status: 0,
        };
      }
    });

    const auditResults = await Promise.all(auditPromises);

    console.log('--- YOUTUBE OEMBED LIVE AUDIT RESULTS ---');
    console.table(auditResults);

    const brokenEntries = auditResults.filter(r => !r.ok);
    expect(brokenEntries.length).toBe(0);
  }, 15000);

  it('4. Verifies search matching by keywords and categories', () => {
    // Search by keyword "wrist"
    const wristResults = getRecommendedResources('wrist');
    expect(wristResults.length).toBeGreaterThan(0);
    expect(wristResults[0].category).toBe('Escape Techniques');

    // Search by category "Night Safety"
    const nightResults = getRecommendedResources('night');
    expect(nightResults.length).toBeGreaterThan(0);
    expect(nightResults[0].category).toBe('Night Safety');

    // Search by "uber" / "cab"
    const cabResults = getRecommendedResources('uber');
    expect(cabResults.length).toBeGreaterThan(0);
    expect(cabResults[0].category).toBe('Public Transport Safety');
  });

  it('5. Verifies Chatbot -> Resource flow returns verified items', () => {
    const resources = getRecommendedResources('I am worried about someone grabbing my wrist');
    expect(resources.length).toBeGreaterThan(0);
    expect(resources[0].youtubeId).toBe('sY-P5GBwggU');
    expect(resources[0].sourceUrl).toContain('sY-P5GBwggU');
  });
});
