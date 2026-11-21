// Vice Cover Studio — deterministic screenshot mode.
// ?shot=cover renders just the finished cover, full-bleed, for the cover
// screenshot. ?shot=editor shows the editor with a photo loaded.
// Query params: photo (boulevard|neon|pier), caption, sub, grade, layout,
// size (1080x1080|1080x1350|1920x1080). Sets window.__shotReady when drawn.

export function applyShotMode(state, hooks) {
  const params = new URLSearchParams(location.search);
  const shot = params.get("shot");
  if (!shot) return false;

  const photo = params.get("photo") || "pier";
  const caption = params.get("caption");
  const sub = params.get("sub");
  const grade = params.get("grade");
  const layout = params.get("layout");
  const size = params.get("size");

  if (caption !== null) {
    state.caption = caption;
    document.getElementById("caption").value = caption;
  }
  if (sub !== null) {
    state.subcaption = sub;
    document.getElementById("subcaption").value = sub;
  }
  if (grade && ["sunset", "neon", "golden", "noir"].includes(grade)) {
    state.grade = grade;
    document.getElementById("grade").value = grade;
  }
  if (layout && ["solo", "duo", "trio", "quad"].includes(layout)) {
    state.layout = layout;
    document.querySelectorAll("#layouts button").forEach((b) =>
      b.classList.toggle("active", b.dataset.layout === layout));
  }
  if (size && ["1080x1080", "1080x1350", "1920x1080"].includes(size)) {
    state.size = size;
    document.getElementById("size").value = size;
  }

  const finish = () => {
    hooks.render();
    window.__shotReady = true;
  };

  hooks.loadSamples().then(() => {
    // the named photo fills every panel of the cover shot; the editor shot
    // keeps the default trio arrangement
    if (shot === "cover") {
      const idx = state.photos.findIndex((p) => p.name === photo);
      const fill = idx >= 0 ? idx : 0;
      for (const panel of state.panels) panel.photo = fill;
      document.body.classList.add("shot-cover");
    }
    document.fonts.ready.then(finish);
  });

  return true;
}
