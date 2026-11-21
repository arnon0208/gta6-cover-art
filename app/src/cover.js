// Vice Cover Studio — cover renderer.
// Draws the multi-panel poster onto a canvas from a plain state object.
// No network, no external assets: photos are Image objects the caller loads,
// the caption font is the vendored Noto Sans Condensed Black.

export const SIZES = {
  "1080x1080": [1080, 1080],
  "1080x1350": [1080, 1350],
  "1920x1080": [1920, 1080],
};

// Colour grades: a wash drawn over the photos plus caption colours.
export const GRADES = {
  sunset: {
    wash: ["rgba(255,110,30,0.20)", "rgba(255,45,149,0.16)"],
    sun: "#ffd97a",
    captionTop: "#fff6d8",
    captionBottom: "#ffb347",
    sub: "#ffe9c4",
  },
  neon: {
    wash: ["rgba(255,45,149,0.22)", "rgba(0,229,255,0.18)"],
    sun: "#ff9de2",
    captionTop: "#eafcff",
    captionBottom: "#00e5ff",
    sub: "#ffd7ef",
  },
  golden: {
    wash: ["rgba(255,190,60,0.24)", "rgba(255,140,0,0.12)"],
    sun: "#ffe9a3",
    captionTop: "#fffbe8",
    captionBottom: "#ffc93c",
    sub: "#fff3cf",
  },
  noir: {
    wash: ["rgba(20,20,30,0.30)", "rgba(120,120,140,0.10)"],
    sun: "#e8e8f0",
    captionTop: "#ffffff",
    captionBottom: "#c9c9d6",
    sub: "#e6e6ee",
  },
};

// Panel rectangles for each layout, as fractions of the cover [x, y, w, h].
export function layoutRects(layout, W, H) {
  const gap = 0.008; // thin white gutter between panels
  const g = Math.round(Math.min(W, H) * gap);
  if (layout === "solo") return [[0, 0, W, H]];
  if (layout === "duo") {
    return [
      [0, 0, Math.floor(W * 0.56) - g, H],
      [Math.floor(W * 0.56) + g, 0, W - Math.floor(W * 0.56) - g, H],
    ];
  }
  if (layout === "trio") {
    return [
      [0, 0, Math.floor(W * 0.58) - g, H],
      [Math.floor(W * 0.58) + g, 0, W - Math.floor(W * 0.58) - g, Math.floor(H * 0.5) - g],
      [Math.floor(W * 0.58) + g, Math.floor(H * 0.5) + g, W - Math.floor(W * 0.58) - g, H - Math.floor(H * 0.5) - g],
    ];
  }
  // quad: 2 x 2 grid
  const hw = Math.floor(W / 2);
  const hh = Math.floor(H / 2);
  return [
    [0, 0, hw - g, hh - g],
    [hw + g, 0, W - hw - g, hh - g],
    [0, hh + g, hw - g, H - hh - g],
    [hw + g, hh + g, W - hw - g, H - hh - g],
  ];
}

// A fresh per-panel transform: photo centred, cover-fit, zoom 1.
export function freshPanel() {
  return { photo: -1, ox: 0, oy: 0, zoom: 1 };
}

// Draw one photo into a panel rect, cover-fit, with pan (ox, oy in px) and zoom.
export function drawPhoto(ctx, img, rect, panel) {
  const [x, y, w, h] = rect;
  const iw = img.naturalWidth || img.width;
  const ih = img.naturalHeight || img.height;
  const base = Math.max(w / iw, h / ih) * panel.zoom;
  const dw = iw * base;
  const dh = ih * base;
  const dx = x + (w - dw) / 2 + panel.ox;
  const dy = y + (h - dh) / 2 + panel.oy;
  ctx.save();
  ctx.beginPath();
  ctx.rect(x, y, w, h);
  ctx.clip();
  ctx.drawImage(img, dx, dy, dw, dh);
  // gentle bottom shade so the caption stays readable
  const shade = ctx.createLinearGradient(0, y + h * 0.55, 0, y + h);
  shade.addColorStop(0, "rgba(10,4,18,0)");
  shade.addColorStop(1, "rgba(10,4,18,0.55)");
  ctx.fillStyle = shade;
  ctx.fillRect(x, y, w, h);
  ctx.restore();
}

function drawPalm(ctx, x, y, s, lean, color) {
  ctx.save();
  ctx.strokeStyle = color;
  ctx.fillStyle = color;
  ctx.lineCap = "round";
  let px = x;
  let py = y;
  const segs = 8;
  for (let i = 0; i < segs; i++) {
    const t = i / segs;
    const nx = x + lean * s * t * t + Math.sin(t * 2.2) * s * 0.06;
    const ny = y - s * t;
    ctx.lineWidth = Math.max(2, s * 0.045 * (1 - t * 0.5));
    ctx.beginPath();
    ctx.moveTo(px, py);
    ctx.lineTo(nx, ny);
    ctx.stroke();
    px = nx;
    py = ny;
  }
  for (let k = 0; k < 7; k++) {
    const ang = Math.PI * (0.08 + (0.84 * k) / 6);
    const L = s * (k === 0 || k === 6 ? 0.42 : 0.55);
    const ex = px + Math.cos(ang) * L;
    const ey = py + Math.abs(Math.sin(ang)) * L * 0.55 + s * 0.1;
    const mx = px + Math.cos(ang) * L * 0.5;
    const my = py - s * 0.05 + Math.abs(Math.sin(ang)) * L * 0.18;
    ctx.lineWidth = Math.max(2, s * 0.03);
    ctx.beginPath();
    ctx.moveTo(px, py);
    ctx.lineTo(mx, my);
    ctx.lineTo(ex, ey);
    ctx.stroke();
  }
  ctx.restore();
}

function drawBirds(ctx, W, H, color) {
  ctx.save();
  ctx.strokeStyle = color;
  ctx.lineWidth = Math.max(2, W * 0.002);
  const spots = [
    [0.18, 0.14, 0.02], [0.26, 0.10, 0.016], [0.72, 0.08, 0.018],
    [0.80, 0.13, 0.022], [0.62, 0.16, 0.014],
  ];
  for (const [fx, fy, fs] of spots) {
    const x = fx * W;
    const y = fy * H;
    const s = fs * W;
    ctx.beginPath();
    ctx.arc(x - s / 2, y, s / 2, Math.PI * 1.15, Math.PI * 1.85);
    ctx.stroke();
    ctx.beginPath();
    ctx.arc(x + s / 2, y, s / 2, Math.PI * 1.15, Math.PI * 1.85);
    ctx.stroke();
  }
  ctx.restore();
}

// The whole poster. state: { layout, panels, photos, caption, subcaption,
// grade, decor, frame, size }. ctx is a 2d context of a canvas sized W x H.
export function drawCover(ctx, W, H, state) {
  const grade = GRADES[state.grade] || GRADES.sunset;
  ctx.clearRect(0, 0, W, H);
  ctx.fillStyle = "#120a18";
  ctx.fillRect(0, 0, W, H);

  const rects = layoutRects(state.layout, W, H);
  const panelCount = rects.length;
  rects.forEach((rect, i) => {
    const panel = state.panels[i] || freshPanel();
    // photos are { name, img, src } records; the renderer needs the Image.
    const img = panel.photo >= 0 ? state.photos[panel.photo]?.img ?? null : null;
    if (img) {
      drawPhoto(ctx, img, rect, panel);
    } else {
      // empty panel: deep plum placeholder with a faint sun
      const [x, y, w, h] = rect;
      const g = ctx.createLinearGradient(x, y, x, y + h);
      g.addColorStop(0, "#2b1030");
      g.addColorStop(1, "#160a20");
      ctx.fillStyle = g;
      ctx.fillRect(x, y, w, h);
      ctx.fillStyle = "rgba(255,217,122,0.25)";
      ctx.beginPath();
      ctx.arc(x + w / 2, y + h * 0.38, Math.min(w, h) * 0.12, 0, Math.PI * 2);
      ctx.fill();
    }
  });

  // colour-grade wash over everything
  ctx.save();
  ctx.globalCompositeOperation = "overlay";
  const wash = ctx.createLinearGradient(0, 0, W, H);
  wash.addColorStop(0, grade.wash[0]);
  wash.addColorStop(1, grade.wash[1]);
  ctx.fillStyle = wash;
  ctx.fillRect(0, 0, W, H);
  ctx.restore();

  // white gutters between panels
  ctx.fillStyle = "rgba(255,255,255,0.92)";
  const g = Math.round(Math.min(W, H) * 0.008);
  if (panelCount > 1) {
    if (state.layout === "duo" || state.layout === "trio") {
      const x = Math.floor(W * (state.layout === "duo" ? 0.56 : 0.58));
      ctx.fillRect(x - g, 0, g * 2, H);
    }
    if (state.layout === "trio") {
      const y = Math.floor(H * 0.5);
      ctx.fillRect(Math.floor(W * 0.58) + g, y - g, W - Math.floor(W * 0.58) - g, g * 2);
    }
    if (state.layout === "quad") {
      ctx.fillRect(Math.floor(W / 2) - g, 0, g * 2, H);
      ctx.fillRect(0, Math.floor(H / 2) - g, W, g * 2);
    }
  }

  if (state.decor) {
    // decorative sun, top corner opposite the caption side
    const sunR = Math.min(W, H) * 0.085;
    const sunX = W * 0.86;
    const sunY = H * 0.10;
    const glow = ctx.createRadialGradient(sunX, sunY, sunR * 0.2, sunX, sunY, sunR * 2.4);
    glow.addColorStop(0, grade.sun + "cc");
    glow.addColorStop(1, grade.sun + "00");
    ctx.fillStyle = glow;
    ctx.fillRect(sunX - sunR * 2.4, sunY - sunR * 2.4, sunR * 4.8, sunR * 4.8);
    ctx.fillStyle = grade.sun;
    ctx.beginPath();
    ctx.arc(sunX, sunY, sunR, 0, Math.PI * 2);
    ctx.fill();
    drawBirds(ctx, W, H, "rgba(20,8,28,0.85)");
    // palm silhouettes framing the bottom corners
    drawPalm(ctx, W * 0.03, H * 0.985, H * 0.16, 0.10, "rgba(12,5,20,0.9)");
    drawPalm(ctx, W * 0.97, H * 0.985, H * 0.13, -0.10, "rgba(12,5,20,0.9)");
  }

  // caption: huge condensed capitals, gradient fill, dark outline, slight tilt.
  // Sized by measuring the text so long captions shrink to fit instead of
  // overflowing the frame.
  const caption = (state.caption || "").trim().toUpperCase();
  if (caption) {
    let size = W * 0.115;
    const cx = W / 2;
    const cy = H * 0.86;
    ctx.save();
    ctx.translate(cx, cy);
    ctx.rotate(-0.022);
    ctx.textAlign = "center";
    ctx.textBaseline = "middle";
    ctx.font = `900 ${size}px "Vice Condensed", "Arial Narrow", sans-serif`;
    const measured = ctx.measureText(caption).width;
    if (measured > W * 0.9) {
      size = Math.floor(size * (W * 0.9) / measured);
      ctx.font = `900 ${size}px "Vice Condensed", "Arial Narrow", sans-serif`;
    }
    const grad = ctx.createLinearGradient(0, -size * 0.55, 0, size * 0.55);
    grad.addColorStop(0, grade.captionTop);
    grad.addColorStop(1, grade.captionBottom);
    ctx.lineWidth = size * 0.09;
    ctx.strokeStyle = "rgba(16,6,24,0.9)";
    ctx.lineJoin = "round";
    ctx.strokeText(caption, 0, 0);
    ctx.fillStyle = grad;
    ctx.fillText(caption, 0, 0);
    ctx.restore();
  }

  // sub-caption: small letterspaced line under the caption
  const sub = (state.subcaption || "").trim().toUpperCase();
  if (sub) {
    const size = Math.min(W * 0.028, 34);
    ctx.save();
    ctx.font = `700 ${size}px "Vice Condensed", "Arial Narrow", sans-serif`;
    ctx.textAlign = "center";
    ctx.textBaseline = "middle";
    ctx.fillStyle = grade.sub;
    ctx.shadowColor = "rgba(0,0,0,0.7)";
    ctx.shadowBlur = size * 0.3;
    const spaced = sub.split("").join("  ");
    ctx.fillText(spaced, W / 2, H * 0.94);
    ctx.restore();
  }

  if (state.frame) {
    ctx.strokeStyle = "rgba(255,255,255,0.95)";
    ctx.lineWidth = Math.max(3, W * 0.006);
    ctx.strokeRect(ctx.lineWidth / 2, ctx.lineWidth / 2, W - ctx.lineWidth, H - ctx.lineWidth);
    ctx.strokeStyle = "rgba(0,0,0,0.85)";
    ctx.lineWidth = Math.max(6, W * 0.012);
    ctx.strokeRect(ctx.lineWidth / 2, ctx.lineWidth / 2, W - ctx.lineWidth, H - ctx.lineWidth);
  }
}
