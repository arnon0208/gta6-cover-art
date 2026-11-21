// Neon Bay Cover Studio — the cover renderer.
//
// Draws a GTA-style multi-panel poster on a canvas: the user's photos, one per
// panel, under a sunset or neon colour grade, with procedural palm and sun
// decorations and a bold condensed caption with a heavy outline. Pure canvas 2D,
// no libraries, no network.
export const GRADES = {
  sunset: {
    sky: ['#2b1042', '#7a2c6e', '#e85d50', '#ffb066'],
    tint: 'rgba(200, 40, 120, 0.20)',
    caption: '#ffffff',
    captionShade: '#1a0b26',
    accent: '#ffd166',
  },
  neon: {
    sky: ['#0a0a24', '#241047', '#7b2d8b', '#ff3d81'],
    tint: 'rgba(60, 20, 160, 0.22)',
    caption: '#ffffff',
    captionShade: '#12041f',
    accent: '#37e0ff',
  },
  golden: {
    sky: ['#3a1c10', '#8a3c14', '#e08a2e', '#ffd98a'],
    tint: 'rgba(220, 120, 30, 0.18)',
    caption: '#fff7e0',
    captionShade: '#2a1206',
    accent: '#ff8c42',
  },
  noir: {
    sky: ['#0d1b1e', '#17323a', '#2e5a66', '#7fb5a8'],
    tint: 'rgba(10, 40, 50, 0.25)',
    caption: '#f2f7f5',
    captionShade: '#06110f',
    accent: '#a8e6cf',
  },
};

export const LAYOUTS = {
  solo: { panels: 1, name: 'Solo' },
  duo: { panels: 2, name: 'Duo split' },
  trio: { panels: 3, name: 'Hero + two' },
  quad: { panels: 4, name: 'Four panels' },
};

/** Panel rectangles for a layout inside a cover of w x h. Gaps are thin white seams. */
export function panelRects(layout, w, h) {
  const g = Math.round(Math.min(w, h) * 0.008); // seam
  if (layout === 'solo') return [{ x: 0, y: 0, w, h }];
  if (layout === 'duo') {
    const w2 = (w - g) / 2;
    return [
      { x: 0, y: 0, w: w2, h },
      { x: w2 + g, y: 0, w: w2, h },
    ];
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
  // quad: 2 x 2
  const w2 = (w - g) / 2;
  const h2 = (h - g) / 2;
  return [
    { x: 0, y: 0, w: w2, h: h2 },
    { x: w2 + g, y: 0, w: w2, h: h2 },
    { x: 0, y: h2 + g, w: w2, h: h2 },
    { x: w2 + g, y: h2 + g, w: w2, h: h2 },
  ];
}

/** Draws one photo into a panel rect, cover-fit, with zoom and pan offsets. */
function drawPhoto(ctx, photo, rect) {
  if (!photo || !photo.img) return;
  const img = photo.img;
  const iw = img.naturalWidth || img.width;
  const ih = img.naturalHeight || img.height;
  const zoom = photo.zoom || 1;
  const base = Math.max(rect.w / iw, rect.h / ih) * zoom;
  const dw = iw * base;
  const dh = ih * base;
  const dx = rect.x + (rect.w - dw) / 2 + (photo.ox || 0) * rect.w;
  const dy = rect.y + (rect.h - dh) / 2 + (photo.oy || 0) * rect.h;
  ctx.save();
  ctx.beginPath();
  ctx.rect(rect.x, rect.y, rect.w, rect.h);
  ctx.clip();
  ctx.drawImage(img, dx, dy, dw, dh);
  ctx.restore();
}

function drawPalm(ctx, x, y, s, flip, color) {
  ctx.save();
  ctx.strokeStyle = color;
  ctx.fillStyle = color;
  ctx.lineCap = 'round';
  // trunk: a gentle curve
  ctx.lineWidth = Math.max(2, s * 0.035);
  ctx.beginPath();
  ctx.moveTo(x, y);
  ctx.quadraticCurveTo(x + 8 * flip, y - s * 0.55, x + 22 * flip, y - s);
  ctx.stroke();
  const cx = x + 22 * flip;
  const cy = y - s;
  // fronds: drooping arcs
  ctx.lineWidth = Math.max(2, s * 0.02);
  for (let a = -160; a <= 10; a += 14) {
    const r = (a * Math.PI) / 180;
    const len = s * 0.42;
    const ex = cx + Math.cos(r) * len * flip;
    const ey = cy + Math.sin(r) * len * 0.5 + s * 0.22;
    const mx = cx + Math.cos(r) * len * 0.55 * flip;
    const my = cy + Math.sin(r) * len * 0.3 + s * 0.05;
    ctx.beginPath();
    ctx.moveTo(cx, cy);
    ctx.quadraticCurveTo(mx, my, ex, ey);
    ctx.stroke();
  }
  ctx.beginPath();
  ctx.arc(cx, cy, Math.max(3, s * 0.03), 0, Math.PI * 2);
  ctx.fill();
  ctx.restore();
}

function drawSun(ctx, cx, cy, r, color) {
  const g = ctx.createRadialGradient(cx, cy, r * 0.1, cx, cy, r * 2.4);
  g.addColorStop(0, color);
  g.addColorStop(0.35, color + 'aa');
  g.addColorStop(1, color + '00');
  ctx.save();
  ctx.fillStyle = g;
  ctx.beginPath();
  ctx.arc(cx, cy, r * 2.4, 0, Math.PI * 2);
  ctx.fill();
  ctx.fillStyle = '#fff3c4';
  ctx.beginPath();
  ctx.arc(cx, cy, r, 0, Math.PI * 2);
  ctx.fill();
  ctx.restore();
}

function drawBirds(ctx, w, h, color) {
  ctx.save();
  ctx.strokeStyle = color;
  ctx.lineWidth = Math.max(2, w * 0.003);
  ctx.lineCap = 'round';
  const spots = [
    [0.62, 0.16, 1.0],
    [0.7, 0.11, 0.7],
    [0.55, 0.2, 0.8],
  ];
  for (const [fx, fy, s] of spots) {
    const x = w * fx;
    const y = h * fy;
    const r = w * 0.02 * s;
    ctx.beginPath();
    ctx.moveTo(x - r, y);
    ctx.quadraticCurveTo(x - r * 0.4, y - r * 0.8, x, y);
    ctx.quadraticCurveTo(x + r * 0.4, y - r * 0.8, x + r, y);
    ctx.stroke();
  }
  ctx.restore();
}

/** Wraps text into lines that fit maxWidth at the given font. */
function wrapLines(ctx, text, maxWidth) {
  const words = text.split(/\s+/).filter(Boolean);
  const lines = [];
  let line = '';
  for (const word of words) {
    const test = line ? line + ' ' + word : word;
    if (ctx.measureText(test).width <= maxWidth || !line) line = test;
    else {
      lines.push(line);
      line = word;
    }
  }
  if (line) lines.push(line);
  return lines;
}

/** The caption: bold condensed capitals, thick dark outline, white face. */
function drawCaption(ctx, state, w, h, grade) {
  const text = (state.caption || '').trim().toUpperCase();
  const sub = (state.subcaption || '').trim();
  if (!text && !sub) return;
  const base = Math.min(w, h);
  const pos = state.captionPos === 'top' ? 'top' : 'bottom';
  let size = base * 0.115 * (state.captionScale || 1);
  ctx.save();
  ctx.textAlign = 'center';
  ctx.textBaseline = 'alphabetic';
  const fontFor = (s) => `${s}px "CoverDisplay", "Arial Black", sans-serif`;
  let lines = [];
  if (text) {
    ctx.font = fontFor(size);
    while (ctx.measureText(text).width > w * 0.92 && size > 16) {
      size -= 2;
      ctx.font = fontFor(size);
    }
    lines = wrapLines(ctx, text, w * 0.92);
    // shrink again if wrapping made too many lines
    while (lines.length > 3 && size > 16) {
      size -= 2;
      ctx.font = fontFor(size);
      lines = wrapLines(ctx, text, w * 0.92);
    }
  }
  const lineH = size * 1.02;
  const subSize = Math.max(14, base * 0.032);
  const blockH = lines.length * lineH + (sub ? subSize * 1.8 : 0);
  let y = pos === 'top' ? size * 0.6 + base * 0.05 : h - blockH - base * 0.045 + size * 0.8;
  // soft dark band behind the caption so it reads over any photo
  const bandY = pos === 'top' ? 0 : h - blockH - base * 0.07;
  const band = ctx.createLinearGradient(0, bandY, 0, bandY + blockH + base * 0.07);
  if (pos === 'top') {
    band.addColorStop(0, 'rgba(10,4,20,0.55)');
    band.addColorStop(1, 'rgba(10,4,20,0)');
  } else {
    band.addColorStop(0, 'rgba(10,4,20,0)');
    band.addColorStop(1, 'rgba(10,4,20,0.55)');
  }
  ctx.fillStyle = band;
  ctx.fillRect(0, bandY, w, blockH + base * 0.07);
  ctx.font = fontFor(size);
  ctx.lineJoin = 'round';
  ctx.miterLimit = 2;
  for (const ln of lines) {
    ctx.strokeStyle = grade.captionShade;
    ctx.lineWidth = size * 0.16;
    ctx.strokeText(ln, w / 2, y);
    const grad = ctx.createLinearGradient(0, y - size, 0, y);
    grad.addColorStop(0, '#ffffff');
    grad.addColorStop(0.7, grade.caption);
    grad.addColorStop(1, grade.accent);
    ctx.fillStyle = grad;
    ctx.fillText(ln, w / 2, y);
    y += lineH;
  }
  if (sub) {
    ctx.font = `700 ${subSize}px "CoverDisplay", sans-serif`;
    ctx.fillStyle = grade.accent;
    ctx.strokeStyle = grade.captionShade;
    ctx.lineWidth = subSize * 0.18;
    const sy = y + subSize * 0.2;
    ctx.strokeText(sub.toUpperCase(), w / 2, sy);
    ctx.fillText(sub.toUpperCase(), w / 2, sy);
  }
  ctx.restore();
}

/**
 * Draws the whole cover onto `canvas` (its width/height are the export size).
 * state: { photos, layout, grade, caption, subcaption, captionPos, captionScale }
 */
export function drawCover(canvas, state) {
  const ctx = canvas.getContext('2d');
  const w = canvas.width;
  const h = canvas.height;
  const grade = GRADES[state.grade] || GRADES.sunset;
  // sky fallback behind the photos
  const sky = ctx.createLinearGradient(0, 0, 0, h);
  grade.sky.forEach((c, i) => sky.addColorStop(i / (grade.sky.length - 1), c));
  ctx.fillStyle = sky;
  ctx.fillRect(0, 0, w, h);
  const rects = panelRects(state.layout || 'solo', w, h);
  const photos = state.photos || [];
  rects.forEach((rect, i) => {
    const photo = photos[i % Math.max(photos.length, 1)] || null;
    drawPhoto(ctx, photo, rect);
  });
  // grade tint + vignette over everything
  ctx.fillStyle = grade.tint;
  ctx.fillRect(0, 0, w, h);
  const vg = ctx.createRadialGradient(w / 2, h / 2, Math.min(w, h) * 0.35, w / 2, h / 2, Math.max(w, h) * 0.75);
  vg.addColorStop(0, 'rgba(0,0,0,0)');
  vg.addColorStop(1, 'rgba(10,4,20,0.35)');
  ctx.fillStyle = vg;
  ctx.fillRect(0, 0, w, h);
  // seams between panels
  ctx.fillStyle = '#ffffff';
  const seam = Math.max(2, Math.round(Math.min(w, h) * 0.008));
  if (rects.length > 1) {
    // vertical seams
    const xs = new Set(rects.map((r) => r.x).filter((x) => x > 0));
    for (const x of xs) ctx.fillRect(x - seam, 0, seam, h);
    const ys = new Set(rects.map((r) => r.y).filter((y) => y > 0));
    for (const y of ys) ctx.fillRect(0, y - seam, w, seam);
  }
  // decorations on the hero panel: a small high sun tucked in the top corner
  // (the photo may carry its own sun), birds, and palm silhouettes
  const hero = rects[0];
  const s = Math.min(hero.w, hero.h);
  drawSun(ctx, hero.x + hero.w * 0.1, hero.y + hero.h * 0.1, s * 0.055, grade.accent);
  drawBirds(ctx, w, h, 'rgba(20,8,30,0.85)');
  drawPalm(ctx, hero.x + hero.w * 0.06, hero.y + hero.h * 0.99, s * 0.34, 1, 'rgba(12,6,20,0.92)');
  if (rects.length > 1) {
    drawPalm(ctx, hero.x + hero.w * 0.97, hero.y + hero.h * 0.99, s * 0.26, -1, 'rgba(12,6,20,0.92)');
  }
  drawCaption(ctx, state, w, h, grade);
}
