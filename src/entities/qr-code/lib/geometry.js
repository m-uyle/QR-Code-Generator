import { state } from "../model/store.js";

function pRect(x, y, w, h) {
  return `M${x} ${y}h${w}v${h}h-${w}Z`;
}

function pRoundedRect(x, y, w, h, r) {
  if (r <= 0.01) {
    return pRect(x, y, w, h);
  }
  const rC = Math.min(r, w / 2, h / 2);
  const rF = +rC.toFixed(3);
  const wRem = +(w - 2 * rC).toFixed(3);
  const hRem = +(h - 2 * rC).toFixed(3);
  return `M${+(x + rC).toFixed(3)} ${y}h${wRem}a${rF} ${rF} 0 0 1 ${rF} ${rF}v${hRem}a${rF} ${rF} 0 0 1 -${rF} ${rF}h-${wRem}a${rF} ${rF} 0 0 1 -${rF} -${rF}v-${hRem}a${rF} ${rF} 0 0 1 ${rF} -${rF}Z`;
}

export function pCircle(cx, cy, r) {
  const rF = +r.toFixed(3);
  const cxF = +cx.toFixed(3);
  const cyF = +cy.toFixed(3);
  return `M ${+(cxF - rF).toFixed(3)} ${cyF} a ${rF} ${rF} 0 1 0 ${+(rF * 2).toFixed(3)} 0 a ${rF} ${rF} 0 1 0 -${+(rF * 2).toFixed(3)} 0 Z`;
}

export function getBadgePath(cx, cy, size, shape, radiusPercent) {
  const r = size / 2;
  if (shape === "circle") {
    return pCircle(cx, cy, r);
  }
  const maxCr = size * 0.25;
  const cr = +(
    maxCr *
    (Math.max(0, Math.min(100, radiusPercent)) / 100)
  ).toFixed(3);
  return pRoundedRect(
    +(cx - r).toFixed(3),
    +(cy - r).toFixed(3),
    +size.toFixed(3),
    +size.toFixed(3),
    cr
  );
}

export function isFinderOrSeparator(r, c, N) {
  if (r < 8 && c < 8) {
    return true;
  }
  if (r < 8 && c >= N - 8) {
    return true;
  }
  if (r >= N - 8 && c < 8) {
    return true;
  }
  return false;
}

function buildModuleGrid(qr, N, isCleared) {
  const grid = Array.from({ length: N }, () => new Uint8Array(N));
  for (let r = 0; r < N; r += 1) {
    for (let c = 0; c < N; c += 1) {
      if (isFinderOrSeparator(r, c, N) || isCleared(r, c)) {
        continue;
      }
      if (qr.isDark(r, c)) {
        grid[r][c] = 1;
      }
    }
  }
  return grid;
}

function addHorizontalEdges(getCell, N, addEdge) {
  for (let y = 0; y <= N; y += 1) {
    for (let x = 0; x < N; x += 1) {
      const top = getCell(x, y - 1);
      const bot = getCell(x, y);
      if (top === 0 && bot === 1) {
        addEdge(x, y, x + 1, y, 1, 0);
      } else if (top === 1 && bot === 0) {
        addEdge(x + 1, y, x, y, -1, 0);
      }
    }
  }
}

function addVerticalEdges(getCell, N, addEdge) {
  for (let x = 0; x <= N; x += 1) {
    for (let y = 0; y < N; y += 1) {
      const left = getCell(x - 1, y);
      const right = getCell(x, y);
      if (left === 1 && right === 0) {
        addEdge(x, y, x, y + 1, 0, 1);
      } else if (left === 0 && right === 1) {
        addEdge(x, y + 1, x, y, 0, -1);
      }
    }
  }
}

function extractModuleEdges(grid, N) {
  const getCell = (x, y) =>
    x < 0 || x >= N || y < 0 || y >= N ? 0 : grid[y][x];
  const adj = new Map();
  const addEdge = (x1, y1, x2, y2, dx, dy) => {
    const k = `${x1},${y1}`;
    if (!adj.has(k)) {
      adj.set(k, []);
    }
    adj.get(k).push({ x: x2, y: y2, dx, dy });
  };

  addHorizontalEdges(getCell, N, addEdge);
  addVerticalEdges(getCell, N, addEdge);

  return adj;
}

function getTurnScore(inDx, inDy, outDx, outDy) {
  const cp = inDx * outDy - inDy * outDx;
  if (cp > 0) {
    return 3;
  }
  if (cp === 0 && inDx * outDx + inDy * outDy > 0) {
    return 2;
  }
  return 1;
}

function pickBestEdge(nextEdges, inDx, inDy) {
  let bestIdx = 0;
  let bestScore = -1;
  for (let i = 0; i < nextEdges.length; i += 1) {
    const score = getTurnScore(inDx, inDy, nextEdges[i].dx, nextEdges[i].dy);
    if (score > bestScore) {
      bestScore = score;
      bestIdx = i;
    }
  }
  const [chosen] = nextEdges.splice(bestIdx, 1);
  return chosen;
}

function simplifyLoop(loop) {
  if (loop.length <= 3) {
    return loop;
  }
  const res = [];
  const n = loop.length;
  for (let i = 0; i < n; i += 1) {
    const prev = loop[(i - 1 + n) % n];
    const curr = loop[i];
    const next = loop[(i + 1) % n];
    const dx1 = curr.x - prev.x;
    const dy1 = curr.y - prev.y;
    const dx2 = next.x - curr.x;
    const dy2 = next.y - curr.y;
    if (dx1 * dy2 !== dy1 * dx2 || dx1 * dx2 + dy1 * dy2 <= 0) {
      res.push(curr);
    }
  }
  return res;
}

function traceBoundaryLoops(adj) {
  const rawLoops = [];
  for (const [startKey, edges] of adj.entries()) {
    while (edges.length > 0) {
      const [startX, startY] = startKey.split(",").map(Number);
      const first = edges.pop();
      const loop = [{ x: startX, y: startY }];

      let inDx = first.dx;
      let inDy = first.dy;
      let currX = first.x;
      let currY = first.y;

      while (currX !== startX || currY !== startY) {
        loop.push({ x: currX, y: currY });
        const nextKey = `${currX},${currY}`;
        const nextEdges = adj.get(nextKey);
        if (!nextEdges || nextEdges.length === 0) {
          break;
        }

        const chosen = pickBestEdge(nextEdges, inDx, inDy);
        inDx = chosen.dx;
        inDy = chosen.dy;
        currX = chosen.x;
        currY = chosen.y;
      }

      if (loop.length >= 3) {
        rawLoops.push(loop);
      }
    }
  }

  return rawLoops.map(simplifyLoop).filter((l) => l.length >= 3);
}

function renderSharpLoops(loops, margin) {
  let pathD = "";
  for (const loop of loops) {
    pathD += `M${+(loop[0].x + margin).toFixed(3)} ${+(loop[0].y + margin).toFixed(3)}`;
    for (let i = 1; i < loop.length; i += 1) {
      pathD += `L${+(loop[i].x + margin).toFixed(3)} ${+(loop[i].y + margin).toFixed(3)}`;
    }
    pathD += "Z";
  }
  return pathD;
}

function renderRoundedLoops(loops, margin, maxR) {
  let pathD = "";
  for (const loop of loops) {
    const n = loop.length;
    const lengths = [];
    for (let i = 0; i < n; i += 1) {
      const next = loop[(i + 1) % n];
      lengths.push(Math.hypot(next.x - loop[i].x, next.y - loop[i].y));
    }

    for (let i = 0; i < n; i += 1) {
      const prev = loop[(i - 1 + n) % n];
      const curr = loop[i];
      const next = loop[(i + 1) % n];
      const lPrev = lengths[(i - 1 + n) % n];
      const lNext = lengths[i];
      const r = Math.min(lPrev / 2, lNext / 2, maxR);

      const d1x = (curr.x - prev.x) / lPrev;
      const d1y = (curr.y - prev.y) / lPrev;
      const d2x = (next.x - curr.x) / lNext;
      const d2y = (next.y - curr.y) / lNext;

      const startX = curr.x - d1x * r + margin;
      const startY = curr.y - d1y * r + margin;
      const endX = curr.x + d2x * r + margin;
      const endY = curr.y + d2y * r + margin;
      const sweep = d1x * d2y - d1y * d2x > 0 ? 1 : 0;

      if (i === 0) {
        pathD += `M${+startX.toFixed(3)} ${+startY.toFixed(3)}`;
      } else {
        pathD += `L${+startX.toFixed(3)} ${+startY.toFixed(3)}`;
      }

      if (r > 0.01) {
        pathD += `A${+r.toFixed(3)} ${+r.toFixed(3)} 0 0 ${sweep} ${+endX.toFixed(3)} ${+endY.toFixed(3)}`;
      } else {
        pathD += `L${+(curr.x + margin).toFixed(3)} ${+(curr.y + margin).toFixed(3)}`;
      }
    }
    pathD += "Z";
  }
  return pathD;
}

export function buildDissolvedPolygonPath(
  qr,
  N,
  margin,
  radiusRatio,
  isCleared = () => false
) {
  const grid = buildModuleGrid(qr, N, isCleared);
  const adj = extractModuleEdges(grid, N);
  const loops = traceBoundaryLoops(adj);
  return radiusRatio <= 0.01
    ? renderSharpLoops(loops, margin)
    : renderRoundedLoops(loops, margin, radiusRatio);
}

function pCornerRect(x, y, s, [tl, tr, br, bl]) {
  const f = (n) => +n.toFixed(3);
  let d = `M${f(x + tl)} ${f(y)}h${f(s - tl - tr)}`;
  if (tr) {
    d += `a${f(tr)} ${f(tr)} 0 0 1 ${f(tr)} ${f(tr)}`;
  }
  d += `v${f(s - tr - br)}`;
  if (br) {
    d += `a${f(br)} ${f(br)} 0 0 1 ${-f(br)} ${f(br)}`;
  }
  d += `h${-f(s - br - bl)}`;
  if (bl) {
    d += `a${f(bl)} ${f(bl)} 0 0 1 ${-f(bl)} ${-f(bl)}`;
  }
  d += `v${-f(s - bl - tl)}`;
  if (tl) {
    d += `a${f(tl)} ${f(tl)} 0 0 1 ${f(tl)} ${-f(tl)}`;
  }
  return `${d}Z`;
}

export function eyeRadii(shape, ox, oy, s) {
  const lerp = (a, b) => a + (b - a) * s;
  const all = (a, b, c) => ({
    o: [a, a, a, a],
    h: [b, b, b, b],
    c: [c, c, c, c],
  });
  if (shape === "circle") {
    return all(3.5, 2.5, 1.5);
  }
  if (shape === "rounded") {
    return all(lerp(1.8, 2.5), lerp(1.2, 1.6), lerp(0.8, 1.0));
  }
  if (shape === "leaf") {
    const mk = (r, t) => (oy === 0 && ox === 0 ? [t, r, t, r] : [r, t, r, t]);
    return { o: mk(3.5, s * 1.2), h: mk(2.5, s * 0.8), c: mk(1.5, s * 0.4) };
  }
  return all(s * 1.6, s * 1.0, s * 0.6);
}

export const lerpEye = (a, b, t) => ({
  o: a.o.map((v, i) => v + (b.o[i] - v) * t),
  h: a.h.map((v, i) => v + (b.h[i] - v) * t),
  c: a.c.map((v, i) => v + (b.c[i] - v) * t),
});

let eyeBlend = null;
export function setEyeBlend(val) {
  eyeBlend = val;
}

export function getEyeSubpaths(ox, oy, margin, eyeShape) {
  const x = ox + margin;
  const y = oy + margin;
  const s = Math.min(1, Math.max(0, state.moduleRadius / 100));
  const to = eyeRadii(eyeShape, ox, oy, s);
  const rr = eyeBlend ? lerpEye(eyeBlend.from(ox, oy, s), to, eyeBlend.t) : to;
  return (
    pCornerRect(x, y, 7, rr.o) +
    pCornerRect(x + 1, y + 1, 5, rr.h) +
    pCornerRect(x + 2, y + 2, 3, rr.c)
  );
}

export function bgCornerRadius(qrDim, margin) {
  const maxR = Math.max(0, (Math.SQRT2 * margin - 1) / (Math.SQRT2 - 1));
  return +Math.min((state.moduleRadius / 100) * qrDim * 0.1, maxR).toFixed(2);
}
