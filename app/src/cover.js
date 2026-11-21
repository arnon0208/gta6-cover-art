// Vice Cover Studio — the cover drawing engine. Pure canvas: given a state it
// paints one poster (panels + grade + decorations + caption) at any export size.
export const GRADES = {
  sunset: {
    name: 'Sunset',
    tint: 'rgba(255,110,40,0.16)',
    skyTop: '#2a1052',
    skyBottom: '#ff7a2e',
    caption: '#fff3d6',
    accent: '#ffb400',
    shadow: 'rgba(20,4,40,0.85)',
  },
  neon: {
    name: 'Neon',
    tint: 'rgba(190,40,255,0.18)',
    skyTop: '#060214',
    skyBottom: '#5b1a8a',
    caption: '#e8fff9',
    accent: '#00ffd0',
    shadow: 'rgba(4,0,24,0.85)',
  },
  golden: {
    name: 'Golden',
    tint: 'rgba(255,190,60,0.14)',
    skyTop: '#3a2408',
    skyBottom: '#ffb347',
    caption: '#fff8e0',
    accent: '#ffcf3d',
    shadow: 'rgba(40,20,0,0.85)',
  },
  noir: {
    name: 'Noir',
    tint: 'rgba(10,10,30,0.28)',
    skyTop: '#0a0a12',
    skyBottom: '#3c3c58',
    caption: '#f2f2f2',
    accent: '#c8c8d8',
    shadow: 'rgba(0,0,0,0.9)',
  },
};

export const SIZES = {
  '1080x1080': [1080, 1080],
  '1080x1350': [1080, 1350],
  '1920x1080': [1920, 1080],
};

export const LAYOUTS = ['solo', 'duo', 'trio', 'quad'];

// Panel rectangles for a layout, with a gap between panels and an outer frame.
export function layoutPanels(layout, w, h) {
  const g = Math.round(Math.min(w, h) * 0.012);
  const f = Math.round(Math.min(w, h) * 0.018);
  const x0 = f, y0 = f, x1 = w - f, y1 = h - f;
  const iw = x1 - x0, ih = y1 - y0;
  const midX = x0 + iw / 2, midY = y0 + ih / 2;
  if (layout === 'solo') return [{ x: x0, y: y0, w: iw, h: ih }];
  if (layout === 'duo') {
    return [
      { x: x0, y: y0, w: (iw - g) / 2, h: ih },
      { x: midX + g / 2, y: y0, w: (iw - g) / 2, h: ih },
    ];
  }
  if (layout === 'trio') {
    return [
      { x: x0, y: y0, w: (iw - g) / 2, h: (ih - g) / 2 },
      { x: midX + g / 2, y: y0, w: (iw - g) / 2, h: (ih - g) / 2 },
      { x: x0, y: midY + g / 2, w: iw, h: (ih - g) / 2 },
    ];
  }
  return [
    { x: x0, y: y0, w: (iw - g) / 2, h: (ih - g) / 2 },
    { x: midX + g / 2, y: y0, w: (iw - g) / 2, h: (ih - g) / 2 },
    { x: x0, y: midY + g / 2, w: (iw - g) / 2, h: (ih - g) / 2 },
    { x: midX + g / 2, y: midY + g / 2, w: (iw - g) / 2, h: (ih - g) / 2 },
  ];
}

// Keep a photo's pan inside its panel: the image must always cover the frame.
// pan carries the panel's drag offset and zoom (photo itself holds no pan).
export function clampPan(photo, rect, pan) {
  if (!photo || !photo.img) return { x: 0, y: 0, zoom: 1 };
  const img = photo.img;
  const base = Math.max(rect.w / img.naturalWidth, rect.h / img.naturalHeight);
  const zoom = Math.max(1, (pan && pan.zoom) || 1);
  const dw = img.naturalWidth * base * zoom;
  const dh = img.naturalHeight * base * zoom;
  const maxX = Math.max(0, (dw - rect.w) / 2);
  const maxY = Math.max(0, (dh - rect.h) / 2);
  return {
    x: Math.max(-maxX, Math.min(maxX, (pan && pan.x) || 0)),
    y: Math.max(-maxY, Math.min(maxY, (pan && pan.y) || 0)),
    zoom,
  };
}

function drawPanel(ctx, panel, rect) {
  const photo = panel ? panel.photo : null;
  ctx.save();
  ctx.beginPath();
  ctx.rect(rect.x, rect.y, rect.w, rect.h);
  ctx.clip();
  if (photo && photo.img) {
    const img = photo.img;
    const pan = clampPan(photo, rect, panel);
    const base = Math.max(rect.w / img.naturalWidth, rect.h / img.naturalHeight);
    const dw = img.naturalWidth * base * pan.zoom;
    const dh = img.naturalHeight * base * pan.zoom;
    ctx.drawImage(img, rect.x + (rect.w - dw) / 2 + pan.x, rect.y + (rect.h - dh) / 2 + pan.y, dw, dh);
  } else {
    const grad = ctx.createLinearGradient(rect.x, rect.y, rect.x, rect.y + rect.h);
    grad.addColorStop(0, '#241a4a');
    grad.addColorStop(1, '#12081f');
    ctx.fillStyle = grad;
    ctx.fillRect(rect.x, rect.y, rect.w, rect.h);
    ctx.fillStyle = 'rgba(255,255,255,0.35)';
    ctx.font = `600 ${Math.round(rect.h * 0.05)}px sans-serif`;
    ctx.textAlign = 'center';
    ctx.fillText('Drop a photo here', rect.x + rect.w / 2, rect.y + rect.h / 2);
  }
  ctx.restore();
}

function drawSun(ctx, cx, cy, r, color) {
  ctx.save();
  ctx.fillStyle = color;
  ctx.beginPath();
  ctx.arc(cx, cy, r, 0, Math.PI * 2);
  ctx.fill();
  ctx.globalAlpha = 0.25;
  ctx.beginPath();
  ctx.arc(cx, cy, r * 1.8, 0, Math.PI * 2);
  ctx.fill();
  ctx.restore();
}

function drawBirds(ctx, w, h, color) {
  ctx.save();
  ctx.strokeStyle = color;
  ctx.lineWidth = Math.max(2, w * 0.002);
  ctx.lineCap = 'round';
  const spots = [[0.2, 0.12, 0.03], [0.3, 0.08, 0.025], [0.72, 0.1, 0.028], [0.8, 0.16, 0.02]];
  for (const [fx, fy, fs] of spots) {
    const x = fx * w, y = fy * h, s = fs * w;
    ctx.beginPath();
    ctx.arc(x - s / 2, y, s / 2, Math.PI * 1.15, Math.PI * 1.85);
    ctx.stroke();
    ctx.beginPath();
    ctx.arc(x + s / 2, y, s / 2, Math.PI * 1.15, Math.PI * 1.85);
    ctx.stroke();
  }
  ctx.restore();
}

function drawPalms(ctx, w, h, color) {
  ctx.save();
  ctx.strokeStyle = color;
  ctx.fillStyle = color;
  ctx.lineWidth = Math.max(3, w * 0.004);
  ctx.lineCap = 'round';
  for (const [fx, lean] of [[0.06, -1], [0.94, 1]]) {
    const bx = fx * w, by = h * 0.98, th = h * 0.22;
    const tx = bx + lean * th * 0.25, ty = by - th;
    ctx.beginPath();
    ctx.moveTo(bx, by);
    ctx.quadraticCurveTo(bx + lean * th * 0.08, by - th * 0.55, tx, ty);
    ctx.stroke();
    for (let a = -70; a <= 70; a += 35) {
      const ang = (-90 + a) * Math.PI / 180;
      const ex = tx + Math.cos(ang) * th * 0.42;
      const ey = ty + Math.sin(ang) * th * 0.36 + th * 0.1;
      ctx.beginPath();
      ctx.moveTo(tx, ty);
      ctx.quadraticCurveTo(tx + Math.cos(ang) * th * 0.22, ty + Math.sin(ang) * th * 0.22 + th * 0.12, ex, ey);
      ctx.stroke();
    }
  }
  ctx.restore();
}

function fitCaption(ctx, text, maxWidth, startPx, fontFace) {
  let px = startPx;
  ctx.font = `${px}px ${fontFace}`;
  while (px > 24 && ctx.measureText(text).width > maxWidth) {
    px -= 4;
    ctx.font = `${px}px ${fontFace}`;
  }
  return px;
}

// Paint the whole poster. state: { panels: [{photo, x, y, zoom}], layout,
// caption, subcaption, grade, size }.
export function drawCover(ctx, state, w, h) {
  const grade = GRADES[state.grade] || GRADES.sunset;
  ctx.clearRect(0, 0, w, h);
  const bg = ctx.createLinearGradient(0, 0, 0, h);
  bg.addColorStop(0, grade.skyTop);
  bg.addColorStop(1, grade.skyBottom);
  ctx.fillStyle = bg;
  ctx.fillRect(0, 0, w, h);
  const rects = layoutPanels(state.layout || 'solo', w, h);
  const panels = state.panels || [];
  rects.forEach((rect, i) => drawPanel(ctx, panels[i] || null, rect));
  // Grade tint over the panels.
  ctx.fillStyle = grade.tint;
  ctx.fillRect(0, 0, w, h);
  // Vignette: darken the corners so the caption plate and frame sit cleanly.
  const vig = ctx.createRadialGradient(
    w / 2, h / 2, Math.min(w, h) * 0.35,
    w / 2, h / 2, Math.max(w, h) * 0.75,
  );
  vig.addColorStop(0, 'rgba(0,0,0,0)');
  vig.addColorStop(1, 'rgba(0,0,0,0.32)');
  ctx.fillStyle = vig;
  ctx.fillRect(0, 0, w, h);
  // Decorations in the frame corners.
  drawSun(ctx, w * 0.88, h * 0.1, Math.min(w, h) * 0.045, grade.accent);
  drawBirds(ctx, w, h, 'rgba(255,255,255,0.75)');
  drawPalms(ctx, w, h, 'rgba(8,4,24,0.55)');
  // Caption block, bottom-left, with a dark plate behind it.
  const caption = (state.caption || '').trim();
  const sub = (state.subcaption || '').trim();
  if (caption || sub) {
    const pad = Math.round(Math.min(w, h) * 0.03);
    const plateH = Math.round(h * (sub ? 0.17 : 0.12));
    const plateY = h - plateH - pad;
    ctx.fillStyle = 'rgba(8,4,24,0.45)';
    ctx.fillRect(pad, plateY, w - pad * 2, plateH);
    ctx.textAlign = 'left';
    ctx.textBaseline = 'alphabetic';
    if (caption) {
      const face = '"Noto Sans Condensed Black", "Arial Narrow", sans-serif';
      const px = fitCaption(ctx, caption.toUpperCase(), w - pad * 4, Math.round(h * 0.085), face);
      ctx.font = `${px}px ${face}`;
      ctx.lineWidth = Math.max(3, px * 0.09);
      ctx.strokeStyle = grade.shadow;
      ctx.strokeText(caption.toUpperCase(), pad * 2, plateY + plateH * 0.58);
      ctx.fillStyle = grade.caption;
      ctx.fillText(caption.toUpperCase(), pad * 2, plateY + plateH * 0.58);
    }
    if (sub) {
      ctx.font = `600 ${Math.round(h * 0.032)}px "Noto Sans Condensed Bold", "Arial Narrow", sans-serif`;
      ctx.fillStyle = grade.accent;
      ctx.fillText(sub.toUpperCase(), pad * 2, plateY + plateH * 0.88);
    }
  }
  // Poster frame.
  ctx.strokeStyle = 'rgba(255,255,255,0.85)';
  ctx.lineWidth = Math.max(2, Math.min(w, h) * 0.006);
  ctx.strokeRect(ctx.lineWidth / 2, ctx.lineWidth / 2, w - ctx.lineWidth, h - ctx.lineWidth);
}
