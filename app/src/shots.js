// Shot presets for screenshots: deterministic editor states the maker captures.
// ?shot=cover  — trio cover "SUNSET RUN" (the first screenshot, the cover).
// ?shot=editor — the editor with a photo loaded, trio "BOULEVARD QUEEN".
// ?shot=quad   — quad neon cover "MIDNIGHT IN NEON BAY".
export const SHOTS = {
  cover(state) {
    state.layout = 'trio';
    state.caption = 'SUNSET RUN';
    state.subcaption = 'NEON BAY';
    state.grade = 'sunset';
    state.size = '1080x1080';
    state.panels = [
      { photo: 0, x: 0, y: 0, zoom: 1.15 },
      { photo: 1, x: 0, y: 0, zoom: 1.1 },
      { photo: 2, x: 0, y: -70, zoom: 1.35 },
    ];
    state.active = 0;
  },
  editor(state) {
    state.layout = 'trio';
    state.caption = 'BOULEVARD QUEEN';
    state.subcaption = 'VICE CITY NIGHTS';
    state.grade = 'golden';
    state.size = '1080x1080';
    state.panels = [
      { photo: 0, x: -40, y: 0, zoom: 1.2 },
      { photo: 2, x: 0, y: 0, zoom: 1 },
      { photo: 1, x: 30, y: 0, zoom: 1.1 },
    ];
    state.active = 1;
  },
  quad(state) {
    state.layout = 'quad';
    state.caption = 'MIDNIGHT IN NEON BAY';
    state.subcaption = 'FOUR CORNERS';
    state.grade = 'neon';
    state.size = '1080x1080';
    state.panels = [
      { photo: 1, x: 0, y: 0, zoom: 1.1 },
      { photo: 0, x: 0, y: 0, zoom: 1 },
      { photo: 2, x: 0, y: -50, zoom: 1.3 },
      { photo: 1, x: -30, y: 0, zoom: 1.25 },
    ];
    state.active = 0;
  },
};
