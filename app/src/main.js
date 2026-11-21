// Vice Cover Studio — editor wiring.
// Loads photos, binds the controls, pans/zooms panels on the canvas and
// exports the finished cover as a PNG. The cover itself is drawn by cover.js.

import { drawCover, layoutRects, freshPanel, SIZES } from "./cover.js";
import { applyShotMode } from "./shots.js";

const canvas = document.getElementById("stage");
const ctx = canvas.getContext("2d");

const SAMPLES = [
  { name: "boulevard", src: "samples/boulevard.jpg" },
  { name: "neon", src: "samples/neon.jpg" },
  { name: "pier", src: "samples/pier.jpg" },
];

export const state = {
  layout: "trio",
  panels: [freshPanel(), freshPanel(), freshPanel(), freshPanel()],
  photos: [], // { name, img } in load order
  caption: "SUNSET RUN",
  subcaption: "NEON BAY · VICE CITY NIGHTS",
  grade: "sunset",
  decor: true,
  frame: true,
  size: "1080x1080",
};

let selectedPanel = 0;
let drag = null;

function loadImage(src) {
  return new Promise((resolve, reject) => {
    const img = new Image();
    img.onload = () => resolve(img);
    img.onerror = reject;
    img.src = src;
  });
}

export function render() {
  const [W, H] = SIZES[state.size];
  if (canvas.width !== W || canvas.height !== H) {
    canvas.width = W;
    canvas.height = H;
  }
  drawCover(ctx, W, H, state);
}

function panelCount() {
  return { solo: 1, duo: 2, trio: 3, quad: 4 }[state.layout];
}

function ensurePanels() {
  while (state.panels.length < panelCount()) state.panels.push(freshPanel());
}

// --- photo slots -----------------------------------------------------------
const slotsEl = document.getElementById("slots");

function renderSlots() {
  slotsEl.innerHTML = "";
  for (let i = 0; i < 4; i++) {
    const photo = state.photos[i];
    const slot = document.createElement("div");
    slot.className = "slot" + (photo ? " filled" : "");
    slot.title = photo ? photo.name : "Empty slot — add a photo";
    if (photo) slot.style.backgroundImage = `url(${photo.src})`;
    const num = document.createElement("span");
    num.className = "num";
    num.textContent = String(i + 1);
    slot.appendChild(num);
    if (photo) {
      const rm = document.createElement("button");
      rm.className = "rm";
      rm.type = "button";
      rm.textContent = "×";
      rm.title = "Remove this photo";
      rm.addEventListener("click", (ev) => {
        ev.stopPropagation();
        removePhoto(i);
      });
      slot.appendChild(rm);
    }
    slot.addEventListener("click", () => assignPhotoToSelectedPanel(i));
    slotsEl.appendChild(slot);
  }
}

function assignPhotoToSelectedPanel(photoIndex) {
  if (!state.photos[photoIndex]) return;
  ensurePanels();
  state.panels[selectedPanel].photo = photoIndex;
  state.panels[selectedPanel].ox = 0;
  state.panels[selectedPanel].oy = 0;
  state.panels[selectedPanel].zoom = 1;
  render();
}

function removePhoto(i) {
  state.photos.splice(i, 1);
  for (const p of state.panels) {
    if (p.photo === i) p.photo = -1;
    else if (p.photo > i) p.photo -= 1;
  }
  renderSlots();
  render();
}

async function addFiles(files) {
  for (const file of files) {
    if (!file.type.startsWith("image/")) continue;
    if (state.photos.length >= 8) break;
    const url = URL.createObjectURL(file);
    try {
      const img = await loadImage(url);
      state.photos.push({ name: file.name.replace(/\.[^.]+$/, ""), img, src: url });
    } catch {
      URL.revokeObjectURL(url);
    }
  }
  renderSlots();
  render();
}

async function loadSamples() {
  for (const s of SAMPLES) {
    if (state.photos.some((p) => p.name === s.name)) continue;
    try {
      const img = await loadImage(s.src);
      state.photos.push({ name: s.name, img, src: s.src });
    } catch (err) {
      console.warn("sample failed:", s.name, err);
    }
  }
  // default trio: pier big on the left, boulevard + neon stacked right
  state.panels[0].photo = state.photos.findIndex((p) => p.name === "pier");
  state.panels[1].photo = state.photos.findIndex((p) => p.name === "boulevard");
  state.panels[2].photo = state.photos.findIndex((p) => p.name === "neon");
  renderSlots();
  render();
}

// --- controls --------------------------------------------------------------
document.querySelectorAll("#layouts button").forEach((btn) => {
  btn.addEventListener("click", () => {
    state.layout = btn.dataset.layout;
    selectedPanel = 0;
    ensurePanels();
    document.querySelectorAll("#layouts button").forEach((b) =>
      b.classList.toggle("active", b === btn));
    render();
  });
});
document.querySelector('#layouts button[data-layout="trio"]').classList.add("active");

document.getElementById("caption").addEventListener("input", (ev) => {
  state.caption = ev.target.value;
  render();
});
document.getElementById("subcaption").addEventListener("input", (ev) => {
  state.subcaption = ev.target.value;
  render();
});
document.getElementById("grade").addEventListener("change", (ev) => {
  state.grade = ev.target.value;
  render();
});
document.getElementById("size").addEventListener("change", (ev) => {
  state.size = ev.target.value;
  render();
});
document.getElementById("decor").addEventListener("change", (ev) => {
  state.decor = ev.target.checked;
  render();
});
document.getElementById("frame").addEventListener("change", (ev) => {
  state.frame = ev.target.checked;
  render();
});
document.getElementById("samplesBtn").addEventListener("click", loadSamples);
document.getElementById("fileInput").addEventListener("change", (ev) => {
  addFiles(ev.target.files);
  ev.target.value = "";
});

document.getElementById("exportBtn").addEventListener("click", () => {
  const [W, H] = SIZES[state.size];
  const off = document.createElement("canvas");
  off.width = W;
  off.height = H;
  drawCover(off.getContext("2d"), W, H, state);
  off.toBlob((blob) => {
    if (!blob) return;
    const a = document.createElement("a");
    a.href = URL.createObjectURL(blob);
    a.download = `vice-cover-${state.size}.png`;
    a.click();
    setTimeout(() => URL.revokeObjectURL(a.href), 5000);
  }, "image/png");
});

// drag & drop anywhere on the page
window.addEventListener("dragover", (ev) => ev.preventDefault());
window.addEventListener("drop", (ev) => {
  ev.preventDefault();
  if (ev.dataTransfer.files.length) addFiles(ev.dataTransfer.files);
});

// --- pan / zoom on the canvas ----------------------------------------------
function toCanvasCoords(ev) {
  const r = canvas.getBoundingClientRect();
  const scaleX = canvas.width / r.width;
  const scaleY = canvas.height / r.height;
  return [(ev.clientX - r.left) * scaleX, (ev.clientY - r.top) * scaleY];
}

function hitPanel(x, y) {
  const rects = layoutRects(state.layout, canvas.width, canvas.height);
  for (let i = 0; i < rects.length; i++) {
    const [rx, ry, rw, rh] = rects[i];
    if (x >= rx && x < rx + rw && y >= ry && y < ry + rh) return i;
  }
  return -1;
}

canvas.addEventListener("pointerdown", (ev) => {
  const [x, y] = toCanvasCoords(ev);
  const hit = hitPanel(x, y);
  if (hit < 0) return;
  selectedPanel = hit;
  canvas.setPointerCapture(ev.pointerId);
  drag = { x, y, ox: state.panels[hit].ox, oy: state.panels[hit].oy };
});

// Keep a panel's photo from sliding clean out of its frame: at least a
// quarter of the panel must stay covered on each axis.
function clampPan(panel, rect) {
  const img = panel.photo >= 0 ? state.photos[panel.photo]?.img : null;
  if (!img) return;
  const [,, w, h] = rect;
  const iw = img.naturalWidth || img.width;
  const ih = img.naturalHeight || img.height;
  const base = Math.max(w / iw, h / ih) * panel.zoom;
  const maxOx = Math.max(0, (iw * base - w) / 2 + w * 0.25);
  const maxOy = Math.max(0, (ih * base - h) / 2 + h * 0.25);
  panel.ox = Math.max(-maxOx, Math.min(maxOx, panel.ox));
  panel.oy = Math.max(-maxOy, Math.min(maxOy, panel.oy));
}

canvas.addEventListener("pointermove", (ev) => {
  if (!drag) return;
  const [x, y] = toCanvasCoords(ev);
  const panel = state.panels[selectedPanel];
  panel.ox = drag.ox + (x - drag.x);
  panel.oy = drag.oy + (y - drag.y);
  clampPan(panel, layoutRects(state.layout, canvas.width, canvas.height)[selectedPanel]);
  render();
});

canvas.addEventListener("pointerup", () => { drag = null; });
canvas.addEventListener("pointercancel", () => { drag = null; });

canvas.addEventListener("wheel", (ev) => {
  ev.preventDefault();
  const [x, y] = toCanvasCoords(ev);
  const hit = hitPanel(x, y);
  if (hit < 0) return;
  const panel = state.panels[hit];
  const next = Math.min(4, Math.max(1, panel.zoom * (ev.deltaY < 0 ? 1.12 : 1 / 1.12)));
  panel.zoom = next;
  render();
}, { passive: false });

// --- boot ------------------------------------------------------------------
renderSlots();
applyShotMode(state, { loadSamples, render });
if (!new URLSearchParams(location.search).has("shot")) {
  loadSamples();
}
document.fonts.ready.then(render);
render();
