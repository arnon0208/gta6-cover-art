// Neon Bay Cover Studio — wires the page: photos, layouts, grades, caption,
// export. A `?shot=` query sets up a fixed scene for a screenshot (./shots.js).
import { drawCover, GRADES, LAYOUTS } from './cover.js';
import { runShot } from './shots.js';

const $ = (id) => document.getElementById(id);
const canvas = $('cover');
const status = $('status');

const SIZES = {
  '1080x1080': [1080, 1080],
  '1080x1350': [1080, 1350],
  '1920x1080': [1920, 1080],
};

const state = {
  photos: [], // { img, name, zoom, ox, oy }
  layout: 'solo',
  size: '1080x1080',
  grade: 'sunset',
  caption: 'Neon Bay Nights',
  subcaption: 'A story in four frames',
  captionPos: 'bottom',
  captionScale: 1,
  selected: 0,
};

function redraw() {
  const [w, h] = SIZES[state.size];
  if (canvas.width !== w || canvas.height !== h) {
    canvas.width = w;
    canvas.height = h;
  }
  drawCover(canvas, state);
  renderThumbs();
  $('zoom').value = String(Math.round(((state.photos[state.selected]?.zoom || 1) - 1) * 100));
  $('zoomVal').textContent = `${Math.round((state.photos[state.selected]?.zoom || 1) * 100)}%`;
}

/** Loads an image from a URL or blob URL, resolving once it can be drawn. */
export function loadImage(url) {
  return new Promise((resolve, reject) => {
    const img = new Image();
    img.onload = () => resolve(img);
    img.onerror = () => reject(new Error('could not load ' + url));
    img.src = url;
  });
}

async function addFiles(files) {
  let added = 0;
  for (const file of files) {
    if (!file.type.startsWith('image/')) continue;
    const img = await loadImage(URL.createObjectURL(file));
    state.photos.push({ img, name: file.name, zoom: 1, ox: 0, oy: 0 });
    added++;
  }
  if (added) {
    // auto-pick a layout that fits the photo count
    if (state.photos.length === 1) state.layout = 'solo';
    else if (state.photos.length === 2) state.layout = 'duo';
    else if (state.photos.length === 3) state.layout = 'trio';
    else state.layout = 'quad';
    state.selected = 0;
    syncLayoutButtons();
    status.textContent = `${added} photo${added > 1 ? 's' : ''} added — drag on the cover to position, scroll to zoom.`;
    redraw();
  }
}

function renderThumbs() {
  const box = $('thumbs');
  box.innerHTML = '';
  state.photos.forEach((p, i) => {
    const t = document.createElement('button');
    t.type = 'button';
    t.className = 'thumb' + (i === state.selected ? ' sel' : '');
    t.title = `Panel ${i + 1}: ${p.name} — click to select`;
    const img = document.createElement('img');
    img.src = p.img.src;
    img.alt = p.name;
    t.appendChild(img);
    const n = document.createElement('span');
    n.textContent = `${i + 1}`;
    t.appendChild(n);
    t.addEventListener('click', () => {
      state.selected = i;
      redraw();
    });
    box.appendChild(t);
  });
  $('photoCount').textContent = state.photos.length ? `${state.photos.length} photo${state.photos.length > 1 ? 's' : ''} loaded` : 'No photos yet — try a sample below.';
}

function syncLayoutButtons() {
  document.querySelectorAll('[data-layout]').forEach((b) => {
    b.classList.toggle('on', b.dataset.layout === state.layout);
  });
}

function syncGradeButtons() {
  document.querySelectorAll('[data-grade]').forEach((b) => {
    b.classList.toggle('on', b.dataset.grade === state.grade);
  });
}

function syncSizeButtons() {
  document.querySelectorAll('[data-size]').forEach((b) => {
    b.classList.toggle('on', b.dataset.size === state.size);
  });
}

// --- controls ---
$('photos').addEventListener('change', (e) => addFiles([...e.target.files]));
const drop = $('drop');
['dragenter', 'dragover'].forEach((ev) => drop.addEventListener(ev, (e) => {
  e.preventDefault();
  drop.classList.add('over');
}));
['dragleave', 'drop'].forEach((ev) => drop.addEventListener(ev, (e) => {
  e.preventDefault();
  drop.classList.remove('over');
}));
drop.addEventListener('drop', (e) => addFiles([...e.dataTransfer.files]));

document.querySelectorAll('[data-sample]').forEach((b) => {
  b.addEventListener('click', async () => {
    const img = await loadImage(`samples/${b.dataset.sample}.jpg`);
    state.photos.push({ img, name: `${b.dataset.sample}.jpg`, zoom: 1, ox: 0, oy: 0 });
    if (state.photos.length === 1) state.layout = 'solo';
    else if (state.photos.length === 2) state.layout = 'duo';
    else if (state.photos.length === 3) state.layout = 'trio';
    else state.layout = 'quad';
    state.selected = state.photos.length - 1;
    syncLayoutButtons();
    status.textContent = `Sample “${b.dataset.sample}” loaded.`;
    redraw();
  });
});

document.querySelectorAll('[data-layout]').forEach((b) => {
  b.addEventListener('click', () => {
    state.layout = b.dataset.layout;
    syncLayoutButtons();
    redraw();
  });
});
document.querySelectorAll('[data-grade]').forEach((b) => {
  b.addEventListener('click', () => {
    state.grade = b.dataset.grade;
    syncGradeButtons();
    redraw();
  });
});
document.querySelectorAll('[data-size]').forEach((b) => {
  b.addEventListener('click', () => {
    state.size = b.dataset.size;
    syncSizeButtons();
    redraw();
  });
});

$('caption').addEventListener('input', (e) => {
  state.caption = e.target.value;
  redraw();
});
$('subcaption').addEventListener('input', (e) => {
  state.subcaption = e.target.value;
  redraw();
});
$('captionPos').addEventListener('change', (e) => {
  state.captionPos = e.target.value;
  redraw();
});
$('captionScale').addEventListener('input', (e) => {
  state.captionScale = Number(e.target.value);
  redraw();
});
$('zoom').addEventListener('input', (e) => {
  const p = state.photos[state.selected];
  if (!p) return;
  p.zoom = 1 + Number(e.target.value) / 100;
  redraw();
});
$('resetPan').addEventListener('click', () => {
  const p = state.photos[state.selected];
  if (!p) return;
  p.zoom = 1;
  p.ox = 0;
  p.oy = 0;
  redraw();
});

// --- drag to pan, wheel to zoom, click a panel to select it ---
let drag = null;
canvas.addEventListener('pointerdown', (e) => {
  const rect = canvas.getBoundingClientRect();
  const x = ((e.clientX - rect.left) / rect.width) * canvas.width;
  const y = ((e.clientY - rect.top) / rect.height) * canvas.height;
  // pick the panel under the pointer via the same rects drawCover uses
  const [w, h] = SIZES[state.size];
  const g = Math.round(Math.min(w, h) * 0.008);
  const rects = panelRectsFor(state.layout, w, h, g);
  let hit = 0;
  rects.forEach((rc, i) => {
    if (x >= rc.x && x <= rc.x + rc.w && y >= rc.y && y <= rc.y + rc.h) hit = i;
  });
  state.selected = Math.min(hit, Math.max(state.photos.length - 1, 0));
  drag = { x: e.clientX, y: e.clientY, ox: state.photos[state.selected]?.ox || 0, oy: state.photos[state.selected]?.oy || 0 };
  canvas.setPointerCapture(e.pointerId);
  redraw();
});
canvas.addEventListener('pointermove', (e) => {
  if (!drag) return;
  const p = state.photos[state.selected];
  if (!p) return;
  const rect = canvas.getBoundingClientRect();
  p.ox = drag.ox + ((e.clientX - drag.x) / rect.width);
  p.oy = drag.oy + ((e.clientY - drag.y) / rect.height);
  redraw();
});
canvas.addEventListener('pointerup', () => { drag = null; });
canvas.addEventListener('wheel', (e) => {
  const p = state.photos[state.selected];
  if (!p) return;
  e.preventDefault();
  p.zoom = Math.min(3, Math.max(1, p.zoom - Math.sign(e.deltaY) * 0.1));
  redraw();
}, { passive: false });

function panelRectsFor(layout, w, h, g) {
  if (layout === 'solo') return [{ x: 0, y: 0, w, h }];
  if (layout === 'duo') {
    const w2 = (w - g) / 2;
    return [{ x: 0, y: 0, w: w2, h }, { x: w2 + g, y: 0, w: w2, h }];
  }
  if (layout === 'trio') {
    const w2 = (w - g) * 0.62;
    const w3 = w - w2 - g;
    const h2 = (h - g) / 2;
    return [
      { x: 0, y: 0, w: w2, h },
      { x: w2 + g, y: 0, w: w3, h: h2 },
      { x: w2 + g, y: h2 + g, w: w3, h: h2 },
    ];
  }
  const w2 = (w - g) / 2;
  const h2 = (h - g) / 2;
  return [
    { x: 0, y: 0, w: w2, h: h2 },
    { x: w2 + g, y: 0, w: w2, h: h2 },
    { x: 0, y: h2 + g, w: w2, h: h2 },
    { x: w2 + g, y: h2 + g, w: w2, h: h2 },
  ];
}

// --- export ---
$('export').addEventListener('click', () => {
  canvas.toBlob((blob) => {
    if (!blob) {
      status.textContent = 'Export failed — try again.';
      return;
    }
    const a = document.createElement('a');
    a.href = URL.createObjectURL(blob);
    a.download = `neon-bay-cover-${state.size}.png`;
    a.click();
    status.textContent = `Saved neon-bay-cover-${state.size}.png (${canvas.width} x ${canvas.height}).`;
  }, 'image/png');
});

// --- boot ---
const shot = new URLSearchParams(location.search).get('shot');
if (shot) {
  runShot(shot, new URLSearchParams(location.search), {
    loadImage,
    state,
    apply: async (sample, caption, sub, layout, grade, size) => {
      if (sample) {
        const img = await loadImage(`samples/${sample}.jpg`);
        state.photos = [{ img, name: `${sample}.jpg`, zoom: 1, ox: 0, oy: 0 }];
      }
      if (caption !== undefined) {
        state.caption = caption;
        $('caption').value = caption;
      }
      if (sub !== undefined) {
        state.subcaption = sub;
        $('subcaption').value = sub;
      }
      if (layout) {
        state.layout = layout;
        syncLayoutButtons();
      }
      if (grade) {
        state.grade = grade;
        syncGradeButtons();
      }
      if (size) {
        state.size = size;
        syncSizeButtons();
      }
      state.selected = 0;
      redraw();
    },
  });
} else {
  redraw();
}
