// Fixed scenes for screenshots: ?shot=editor shows the app with a sample photo
// loaded; ?shot=cover shows the cover alone; ?shot=cover2 shows a second cover
// (neon grade, four panels). `photo` picks the sample, `caption` the words,
// `sub` the sub-caption. window.__shotReady is set once painted and the font
// is loaded.
export async function runShot(shot, query, api) {
  const photo = query.get('photo') ?? 'pier';
  const caption = query.get('caption') ?? 'Neon Bay Nights';
  const sub = query.get('sub') ?? 'A story in four frames';
  if (shot === 'cover' || shot === 'cover2') {
    document.body.classList.add('shot-cover');
  }
  if (shot === 'cover2') {
    // load all three samples into a four-panel cover
    for (const sample of ['neon', 'boulevard', 'pier']) {
      const img = await api.loadImage(`samples/${sample}.jpg`);
      api.state.photos.push({ img, name: `${sample}.jpg`, zoom: 1, ox: 0, oy: 0 });
    }
    api.state.photos.push({ img: api.state.photos[0].img, name: 'neon.jpg', zoom: 1.15, ox: 0.05, oy: 0 });
    await api.apply(null, 'Midnight In Neon Bay', 'Four frames. One city.', 'quad', 'neon', '1080x1350');
  } else {
    await api.apply(photo, caption, sub, shot === 'cover' ? 'solo' : undefined, shot === 'cover' ? 'sunset' : undefined, shot === 'cover' ? '1080x1080' : undefined);
  }
  try {
    await document.fonts.ready;
  } catch {
    // fonts are a progressive enhancement; the fallback still paints
  }
  requestAnimationFrame(() => requestAnimationFrame(() => {
    window.__shotReady = true;
  }));
}
