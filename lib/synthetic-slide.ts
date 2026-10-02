// Generates a synthetic H&E-stained tissue image as a data URL so the viewer
// always has pathology-like content offline. Swap tileSources for a real
// TCGA DZI/IIIF endpoint in production (see WSIViewer props).

export interface SlideRegions {
  tumor: { x: number; y: number; r: number }[]; // normalized 0..1
  cells: { x: number; y: number }[];
}

export function generateSyntheticSlide(
  width = 2400,
  height = 1600
): { dataUrl: string; regions: SlideRegions } {
  const canvas = document.createElement("canvas");
  canvas.width = width;
  canvas.height = height;
  const ctx = canvas.getContext("2d")!;

  // simple seeded RNG for reproducible slides
  let seed = 1337;
  const rnd = () => {
    seed = (seed * 1103515245 + 12345) & 0x7fffffff;
    return seed / 0x7fffffff;
  };

  // eosin background (pink extracellular matrix)
  ctx.fillStyle = "#f3dbe6";
  ctx.fillRect(0, 0, width, height);

  // large stromal washes
  for (let i = 0; i < 40; i++) {
    const x = rnd() * width;
    const y = rnd() * height;
    const r = 120 + rnd() * 320;
    const g = ctx.createRadialGradient(x, y, 0, x, y, r);
    g.addColorStop(0, `rgba(216,150,180,${0.25 + rnd() * 0.3})`);
    g.addColorStop(1, "rgba(216,150,180,0)");
    ctx.fillStyle = g;
    ctx.beginPath();
    ctx.arc(x, y, r, 0, Math.PI * 2);
    ctx.fill();
  }

  // tumor regions: denser, darker hematoxylin clusters
  const tumor: SlideRegions["tumor"] = [];
  for (let i = 0; i < 6; i++) {
    const cx = (0.12 + rnd() * 0.76) * width;
    const cy = (0.12 + rnd() * 0.76) * height;
    const rr = 150 + rnd() * 260;
    tumor.push({ x: cx / width, y: cy / height, r: rr / width });
    const g = ctx.createRadialGradient(cx, cy, 0, cx, cy, rr);
    g.addColorStop(0, "rgba(120,60,130,0.35)");
    g.addColorStop(1, "rgba(120,60,130,0)");
    ctx.fillStyle = g;
    ctx.beginPath();
    ctx.arc(cx, cy, rr, 0, Math.PI * 2);
    ctx.fill();
  }

  // nuclei (hematoxylin dots) — denser inside tumor regions
  const cells: SlideRegions["cells"] = [];
  const nucleusCount = 9000;
  for (let i = 0; i < nucleusCount; i++) {
    let x = rnd() * width;
    let y = rnd() * height;
    // bias some nuclei toward tumor centers
    if (rnd() < 0.45 && tumor.length) {
      const t = tumor[Math.floor(rnd() * tumor.length)];
      x = t.x * width + (rnd() - 0.5) * t.r * width * 1.6;
      y = t.y * height + (rnd() - 0.5) * t.r * width * 1.6;
    }
    const r = 2 + rnd() * 3.5;
    const shade = 60 + rnd() * 40;
    ctx.fillStyle = `rgba(${shade},${30 + rnd() * 30},${90 + rnd() * 40},0.85)`;
    ctx.beginPath();
    ctx.arc(x, y, r, 0, Math.PI * 2);
    ctx.fill();
    if (i % 12 === 0) cells.push({ x: x / width, y: y / height });
  }

  return { dataUrl: canvas.toDataURL("image/jpeg", 0.9), regions: tumor.length ? { tumor, cells } : { tumor, cells } };
}
