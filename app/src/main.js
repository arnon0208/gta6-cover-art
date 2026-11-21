// Vice Cover Studio — editor wiring: photos, layouts, pan/zoom, export, shots.
import { GRADES, SIZES, LAYOUTS, layoutPanels, clampPan, drawCover } from './cover.js';
import { SHOTS } from './shots.js';

const $ = (id) => document.getElementById(id);
const canvas = $('preview');
const ctx = canvas.getContext('2d');

const state = {
  layout: 'trio',
  caption: 'SUNSET RUN',
  subcaption: 'NEON BAY',
  grade: 'sunset',
  size: '1080x1080',
  photos: [], // { name, img, src }
  panels: [], // { photo: index|null, x, y, zoom }
  active: 0,
};

function panelCount(layout) {
  return { solo: 1, duo: 2, trio: 3, quad: 4 }[layout] || 1;
}

function syncPanels() {
  const n = panelCount(state.layout);
  while (state.panels.length < n) {
    const i = state.panels.length;
    state.panels.push({ photo: i < state.photos.length ? i : null, x: 0, y: 0, zoom: 1 });
  }
  state.panels.length = n;
  state.active = Math.min(state.active, n - 1);
}

function loadImage(src) {
  return new Promise((resolve, reject) => {
    const img = new Image();
    img.onload = () => resolve(img);
    img.onerror = reject;
    img.src = src;
  });
}

async function loadSample(name, file) {
  const img = await loadImage(`samples/${file}`);
  return { name, img, src: `samples/${file}` };
}

async function loadSamples() {
  const defs = [
    ['Boulevard sunset', 'boulevard.jpg'],
    ['Neon street', 'neon.jpg'],
    ['Pier at dusk', 'pier.jpg'],
  ];
  for (const [name, file] of defs) {
    try {
      state.photos.push(await loadSample(name, file));
    } catch {
      // A missing sample never blocks the editor: the slot stays empty.
    }
  }
  syncPanels();
}

function addPhoto(file) {
  if (!file || !file.type.startsWith('image/')) return;
  const url = URL.createObjectURL(file);
  loadImage(url).then((img) => {
    const slot = state.photos.length < 4 ? state.photos.length : state.active;
    state.photos[slot] = { name: file.name, img, src: url };
    syncPanels();
    const target = state.panels[state.active];
    if (target) target.photo = slot;
    render();
    refreshSlots();
  });
}

function render() {
  const [w, h] = SIZES[state.size];
  canvas.width = w;
  canvas.height = h;
  const view = {
    panels: state.panels.map((p) => ({
      ...p,
      photo: p.photo === null ? null : state.photos[p.photo] || null,
    })),
    layout: state.layout,
    caption: state.caption,
    subcaption: state.subcaption,
    grade: state.grade,
    size: state.size,
  };
  drawCover(ctx, view, w, h);
  updateStatus();
}

function updateStatus() {
  const filled = state.panels.filter((p) => p.photo !== null).length;
  $('status').textContent =
    `${filled} of ${panelCount(state.layout)} panels filled · ${state.layout} · ${state.size} · ${GRADES[state.grade].name}`;
}

function refreshSlots() {
  const box = $('slots');
  box.innerHTML = '';
  state.photos.forEach((photo, i) => {
    const b = document.createElement('button');
    b.type = 'button';
    b.className = 'slot' + (state.panels[state.active] && state.panels[state.active].photo === i ? ' on' : '');
    b.textContent = photo.name;
    b.addEventListener('click', () => {
      state.panels[state.active].photo = i;
      render();
      refreshSlots();
    });
    box.appendChild(b);
  });
  const empty = document.createElement('span');
  empty.className = 'hint';
  empty.textContent = state.photos.length < 4 ? 'Drop photos or use Add photo' : 'All 4 photo slots used';
  box.appendChild(empty);
}

function exportPNG() {
  const [w, h] = SIZES[state.size];
  const off = document.createElement('canvas');
  off.width = w;
  off.height = h;
  const octx = off.getContext('2d');
  const view = {
    panels: state.panels.map((p) => ({
      ...p,
      photo: p.photo === null ? null : state.photos[p.photo] || null,
    })),
    layout: state.layout,
    caption: state.caption,
    subcaption: state.subcaption,
    grade: state.grade,
    size: state.size,
  };
  drawCover(octx, view, w, h);
  off.toBlob((blob) => {
    if (!blob) return;
    const a = document.createElement('a');
    a.href = URL.createObjectURL(blob);
    a.download = `vice-cover-${state.size}.png`;
    a.click();
    setTimeout(() => URL.revokeObjectURL(a.href), 5000);
    $('status').textContent = `Exported vice-cover-${state.size}.png`;
  }, 'image/png');
}

function panelAt(clientX, clientY) {
  const r = canvas.getBoundingClientRect();
  const x = ((clientX - r.left) / r.width) * canvas.width;
  const y = ((clientY - r.top) / r.height) * canvas.height;
  const rects = layoutPanels(state.layout, canvas.width, canvas.height);
  const i = rects.findIndex((rc) => x >= rc.x && x <= rc.x + rc.w && y >= rc.y && y <= rc.y + rc.h);
  return { index: i, x, y };
}

let drag = null;
canvas.addEventListener('pointerdown', (e) => {
  const hit = panelAt(e.clientX, e.clientY);
  if (hit.index < 0) return;
  state.active = hit.index;
  canvas.setPointerCapture(e.pointerId);
  drag = { x: hit.x, y: hit.y, px: state.panels[hit.index].x, py: state.panels[hit.index].y };
  refreshSlots();
});
canvas.addEventListener('pointermove', (e) => {
  if (!drag) return;
  const hit = panelAt(e.clientX, e.clientY);
  const panel = state.panels[state.active];
  const rect = layoutPanels(state.layout, canvas.width, canvas.height)[state.active];
  const scale = canvas.width / canvas.getBoundingClientRect().width;
  panel.x = drag.px + (hit.x - drag.x) * scale;
  panel.y = drag.py + (hit.y - drag.y) * scale;
  const clamped = clampPan(panel.photo === null ? null : state.photos[panel.photo] || null, rect, panel);
  panel.x = clamped.x;
  panel.y = clamped.y;
  render();
});
canvas.addEventListener('pointerup', () => { drag = null; });
canvas.addEventListener('wheel', (e) => {
  e.preventDefault();
  const panel = state.panels[state.active];
  panel.zoom = Math.max(1, Math.min(3, (panel.zoom || 1) * (e.deltaY < 0 ? 1.1 : 0.9)));
  render();
}, { passive: false });

function bindControls() {
  const layoutBox = $('layouts');
  LAYOUTS.forEach((name) => {
    const b = document.createElement('button');
    b.type = 'button';
    b.textContent = name[0].toUpperCase() + name.slice(1);
    b.className = state.layout === name ? 'on' : '';
    b.addEventListener('click', () => {
      state.layout = name;
      syncPanels();
      render();
      layoutBox.querySelectorAll('button').forEach((x) => x.classList.toggle('on', x === b));
    });
    layoutBox.appendChild(b);
  });
  const gradeBox = $('grades');
  Object.entries(GRADES).forEach(([key, g]) => {
    const b = document.createElement('button');
    b.type = 'button';
    b.textContent = g.name;
    b.className = state.grade === key ? 'on' : '';
    b.addEventListener('click', () => {
      state.grade = key;
      render();
      gradeBox.querySelectorAll('button').forEach((x) => x.classList.toggle('on', x === b));
    });
    gradeBox.appendChild(b);
  });
  const sizeSel = $('size');
  Object.keys(SIZES).forEach((key) => {
    const o = document.createElement('option');
    o.value = key;
    o.textContent = key.replace('x', ' × ');
    sizeSel.appendChild(o);
  });
  sizeSel.value = state.size;
  sizeSel.addEventListener('change', () => { state.size = sizeSel.value; render(); });
  $('caption').addEventListener('input', (e) => { state.caption = e.target.value; render(); });
  $('subcaption').addEventListener('input', (e) => { state.subcaption = e.target.value; render(); });
  $('caption').value = state.caption;
  $('subcaption').value = state.subcaption;
  $('addPhoto').addEventListener('click', () => $('fileInput').click());
  $('fileInput').addEventListener('change', (e) => {
    [...e.target.files].forEach(addPhoto);
    e.target.value = '';
  });
  $('exportBtn').addEventListener('click', exportPNG);
  const drop = $('dropzone');
  drop.addEventListener('dragover', (e) => { e.preventDefault(); drop.classList.add('over'); });
  drop.addEventListener('dragleave', () => drop.classList.remove('over'));
  drop.addEventListener('drop', (e) => {
    e.preventDefault();
    drop.classList.remove('over');
    [...e.dataTransfer.files].forEach(addPhoto);
  });
}

function syncControls() {
  $('caption').value = state.caption;
  $('subcaption').value = state.subcaption;
  $('size').value = state.size;
  const mark = (boxId, current) => {
    document.getElementById(boxId).querySelectorAll('button').forEach((b) => {
      b.classList.toggle('on', b.textContent.toLowerCase() === current.toLowerCase());
    });
  };
  mark('layouts', state.layout);
  mark('grades', GRADES[state.grade].name);
}

async function boot() {
  bindControls();
  await loadSamples();
  const params = new URLSearchParams(location.search);
  const shot = params.get('shot');
  if (params.get('bare') === '1') {
    // Screenshot mode: hide the editor chrome so the canvas fills the frame.
    document.querySelector('header').style.display = 'none';
    $('controls').style.display = 'none';
    document.querySelector('main').style.cssText = 'display:block;padding:0;';
    canvas.style.width = '100vmin';
    canvas.style.height = '100vmin';
    document.querySelector('.tip').style.display = 'none';
  }
  if (shot && SHOTS[shot]) {
    SHOTS[shot](state);
    syncPanels();
    syncControls();
  }
  render();
  refreshSlots();
  try {
    await document.fonts.ready;
    render();
  } catch {
    // Fonts are decorative; the canvas still renders without them.
  }
  if (shot) window.__shotReady = true;
}

boot();
