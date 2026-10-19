import { inscribedPolygon } from './polygon-model.mjs';

export function circumscribedPolygon(n) {
  const inner = inscribedPolygon(n);
  const radius = 1 / Math.cos(Math.PI / inner.sides);
  const vertices = inner.vertices.map(([x, y]) => [radius * x, radius * y]);
  return { ...inner, radius, vertices, triangle: [[0, 0], ...vertices.slice(0, 2)],
    halfBase: Math.tan(Math.PI / inner.sides),
    area: inner.sides * Math.tan(Math.PI / inner.sides) };
}

export function sectorModel(x) {
  const angle = Math.abs(x);
  if (!Number.isFinite(angle) || angle >= Math.PI) throw new RangeError('|x| must be less than pi.');
  return { angle, q: [Math.cos(angle), Math.sin(angle)],
    triangleArea: Math.sin(angle) / 2, sectorArea: angle / 2 };
}

export function factorialTerms(a, count) {
  if (!(a > 0) || !Number.isFinite(a) || !Number.isInteger(count) || count < 1 || count > 80) {
    throw new RangeError('Use a positive base and 1 to 80 integer terms.');
  }
  let term = 1;
  return Array.from({ length: count }, (_, i) => {
    term *= a / (i + 1);
    return [i + 1, term];
  });
}

export function powerModel(n, root = false) {
  if (!Number.isInteger(n) || n < 1) throw new RangeError('n must be a positive integer.');
  const exponent = root ? 1 / n : n;
  return { exponent,
    value: x => x > -1 ? (1 + x) ** exponent : NaN,
    tangent: x => 1 + exponent * x };
}

export function exponentialModel(a) {
  if (!(a > 0) || !Number.isFinite(a)) throw new RangeError('a must be positive.');
  const k = Math.log(a);
  return { a, b: 1 / a, k,
    value: x => Math.exp(k * x), tangent: x => 1 + k * x,
    reflected: x => Math.exp(-k * x), reflectedTangent: x => 1 - k * x };
}

/** Intersect each plotted segment with a fixed coordinate window. */
export function clipPolyline(points, view) {
  const result = [];
  for (let i = 1; i < points.length; i++) {
    const a = points[i - 1], b = points[i];
    if (![...a, ...b].every(Number.isFinite)) continue;
    const dx = b[0] - a[0], dy = b[1] - a[1];
    let start = 0, end = 1, visible = true;
    for (const [p, q] of [[-dx, a[0] - view.xmin], [dx, view.xmax - a[0]],
      [-dy, a[1] - view.ymin], [dy, view.ymax - a[1]]]) {
      if (p === 0) { if (q < 0) visible = false; }
      else if (p < 0) start = Math.max(start, q / p);
      else end = Math.min(end, q / p);
    }
    if (!visible || start > end) continue;
    const first = [a[0] + start * dx, a[1] + start * dy];
    const last = [a[0] + end * dx, a[1] + end * dy];
    const previous = result.at(-1);
    if (!previous || Math.hypot(previous[0] - first[0], previous[1] - first[1]) > 1e-10) {
      if (previous) result.push([NaN, NaN]);
      result.push(first);
    }
    result.push(last);
  }
  return result;
}
