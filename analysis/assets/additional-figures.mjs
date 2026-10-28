import { circumscribedPolygon, sectorModel, factorialTerms, powerModel, exponentialModel, convexityModel, clipPolyline } from './figure-models.mjs';
import { inscribedPolygon } from './polygon-model.mjs';

const BLUE = '#1d5fbf', ORANGE = '#c54b16', PURPLE = '#8426aa', TEAL = '#008071', INK = '#4b5563', GOLD = '#9a651b';
const FIXED = { fixed: true, highlight: false, withLabel: false };
const el = (tag, className, text) => {
  const node = document.createElement(tag);
  if (className) node.className = className;
  if (text !== undefined) node.textContent = text;
  return node;
};
const mathQueue = new Set();
let mathFrame = 0, mathChain = Promise.resolve();
function setMath(node, tex) {
  if (node.dataset.requestedTex === tex) return;
  node.dataset.requestedTex = tex;
  mathQueue.add(node);
  if (!mathFrame) mathFrame = requestAnimationFrame(() => {
    const nodes = [...mathQueue].filter(node => node.isConnected);
    mathQueue.clear();
    mathFrame = 0;
    mathChain = mathChain.then(async () => {
      for (const item of nodes) {
        const requested = item.dataset.requestedTex;
        if (item.dataset.tex === requested) continue;
        const buffer = el('span', 'figure-math-buffer', `\\(${requested}\\)`);
        item.append(buffer);
        await window.MathJax.typesetPromise([buffer]);
        if (!item.isConnected || item.dataset.requestedTex !== requested) {
          window.MathJax.typesetClear([buffer]);
          buffer.remove();
          continue;
        }
        // Keep the old equation visible until its replacement is ready.
        const previous = [...item.children].filter(child => child !== buffer);
        window.MathJax.typesetClear(previous);
        buffer.classList.remove('figure-math-buffer');
        item.replaceChildren(buffer);
        item.dataset.tex = requested;
      }
    }).catch(console.error);
  });
}
function math(tex) {
  const node = el('span', 'figure-math');
  setMath(node, tex);
  return node;
}
function number(value, places = 4) {
  if (value === 0) return '0';
  if (Math.abs(value) >= 1e5 || Math.abs(value) < 1e-4) return value.toExponential(3);
  return Number(value.toFixed(places)).toString();
}

class Figure {
  constructor(image, options) {
    this.options = options;
    this.values = {};
    this.inputs = [];
    this.boards = [];
    this.pendingRefresh = 0;
    this.source = image.closest('picture') || image;
    this.widget = el('div', 'interactive-figure');
    this.widget.id = options.embed.split('/').pop().replace('.html', '') + '-1';
    this.widget.dataset.figure = options.type;
    this.widget.dataset.variant = options.mode || '';
    this.live = el('div', 'figure-live');
    this.stage = el('div', 'figure-stage');
    this.aside = el('aside', 'figure-aside');
    this.aside.setAttribute('aria-label', 'Figure legend');
    this.panels = el('div', 'figure-panels');
    this.legend = el('div', 'figure-legend');
    this.controls = el('div', 'figure-control-list');
    this.readouts = el('div', 'figure-readouts');
    this.toolbar = el('div', 'figure-toolbar');
    this.reset = el('button', 'figure-reset', 'Reset');
    this.reset.type = 'button';
    this.reset.setAttribute('aria-label', `Reset ${options.title.toLowerCase()}`);
    this.reset.title = 'Reset';
    this.reset.addEventListener('click', () => {
      for (const { input, output, key, range } of this.inputs) {
        input.value = String(range.initial);
        if (output) output.value = number(range.initial);
        this.values[key] = range.initial;
      }
      this.refresh?.();
    });
    this.aside.append(this.legend, this.readouts);
    this.stage.append(this.panels, this.aside);
    this.toolbar.append(this.controls, this.reset);
    this.live.append(this.stage, this.toolbar);
    this.source.before(this.widget);
    this.source.classList.add('figure-static');
    this.widget.append(this.source, this.live);
  }

  scheduleRefresh() {
    if (this.pendingRefresh) return;
    this.pendingRefresh = requestAnimationFrame(() => {
      this.pendingRefresh = 0;
      this.refresh?.();
    });
  }

  control(key, tex, range, name) {
    const row = el('div', 'figure-controls');
    const label = el('label', 'figure-control-label');
    const input = el('input', 'figure-slider');
    input.id = `${this.widget.id}-${key}`;
    input.type = 'range';
    input.min = String(range.min);
    input.max = String(range.max);
    input.step = String(range.step);
    input.value = String(range.initial);
    input.setAttribute('aria-label', name);
    label.htmlFor = input.id;
    const output = el('output', '', number(range.initial));
    output.htmlFor = input.id;
    label.append(math(tex), document.createTextNode(' = '), output);
    row.append(label, input);
    this.controls.append(row);
    this.values[key] = range.initial;
    this.inputs.push({ input, output, key, range });
    input.addEventListener('input', () => {
      const value = Number(input.value);
      output.value = number(value);
      if (value === this.values[key]) return;
      this.values[key] = value;
      this.scheduleRefresh();
    });
    input.addEventListener('change', () => {
      this.values[key] = Number(input.value);
      if (this.pendingRefresh) cancelAnimationFrame(this.pendingRefresh);
      this.pendingRefresh = 0;
      this.refresh?.();
    });
    return input;
  }

  readout(tex, name, color) {
    const wrap = el('span', 'figure-readout');
    const output = el('output', 'figure-number');
    output.setAttribute('aria-label', name);
    if (color) {
      const dot = el('span', 'figure-key-dot');
      dot.style.backgroundColor = color;
      wrap.append(dot);
      wrap.classList.add('figure-key');
      this.readouts.classList.add('has-keys');
    }
    wrap.append(math(tex), document.createTextNode(' = '), output);
    this.readouts.append(wrap);
    return value => { output.value = String(value); };
  }

  key(tex, color) {
    const item = el('span', 'figure-key');
    const dot = el('span', 'figure-key-dot');
    dot.style.backgroundColor = color;
    const label = math(tex);
    item.append(dot, label);
    this.legend.append(item);
    return next => setMath(label, next);
  }

  editablePowerKey(key, range, color, name, exponent = 'x', suffix = '') {
    const item = el('span', 'figure-key figure-editable-equation');
    const dot = el('span', 'figure-key-dot');
    dot.style.backgroundColor = color;
    const equation = el('span', 'figure-equation');
    const input = el('input', 'figure-base-input');
    input.type = 'number';
    input.min = String(range.min); input.max = String(range.max); input.step = String(range.step);
    input.value = String(range.initial);
    input.setAttribute('aria-label', name);
    input.title = 'Edit the base';
    const power = el('sup', 'figure-inline-power');
    power.append(math(exponent));
    equation.append(math('y='), input, power);
    if (suffix) equation.append(math(suffix));
    item.append(dot, equation);
    this.legend.append(item);
    this.values[key] = range.initial;
    this.inputs.push({ input, output: null, key, range });
    const commit = () => {
      const value = Number(input.value);
      if (!Number.isFinite(value) || value < range.min || value > range.max) {
        input.value = String(this.values[key]);
        return;
      }
      if (value === this.values[key]) return;
      this.values[key] = value;
      this.refresh?.();
    };
    input.addEventListener('change', commit);
    input.addEventListener('keydown', event => {
      if (event.key === 'Enter') { event.preventDefault(); commit(); input.blur(); }
    });
    return input;
  }

  board(bounds, geometry = false, title) {
    const panel = el('div', 'figure-panel');
    const heading = el('div', 'figure-panel-title');
    if (title) { setMath(heading, title); panel.append(heading); }
    const element = el('div', `figure-board${geometry ? '' : ' figure-plot'}`);
    element.id = `${this.widget.id}-board-${this.boards.length}`;
    element.setAttribute('role', 'img');
    element.setAttribute('aria-label', this.options.title);
    panel.append(element);
    this.panels.append(panel);
    const descriptor = { element, bounds, geometry, heading, board: null, width: 0, height: 0 };
    this.boards.push(descriptor);
    if (this.boards.length > 1) this.panels.classList.add('is-paired');
    return descriptor;
  }

  mount(draw, update) {
    if (!this.controls.childElementCount) {
      this.toolbar.hidden = true;
      if (this.inputs.length) this.aside.append(this.reset);
    }
    let initialized = false, failed = false;
    const resize = () => {
      if (failed || this.boards.some(({ element }) => element.clientWidth < 1 || element.clientHeight < 1)) return;
      try {
        if (!initialized) {
          initialized = true;
          for (const item of this.boards) {
            item.currentBounds = item.bounds();
            item.board = window.JXG.JSXGraph.initBoard(item.element.id, {
              renderer: 'svg', boundingbox: item.currentBounds, keepaspectratio: item.geometry,
              axis: false, grid: false, showCopyright: false, showNavigation: false,
              pan: { enabled: false }, zoom: { enabled: false, wheel: false, pinch: false },
              keyboard: { enabled: false }, resize: { enabled: false }, selection: { enabled: false }, showInfobox: false,
            });
            item.board.suspendUpdate();
          }
          draw();
          this.refresh = () => {
            update();
            for (const [key, value] of Object.entries(this.values)) this.widget.dataset[key] = String(value);
            for (const item of this.boards) {
              const nextBounds = item.bounds();
              if (nextBounds.some((value, index) => value !== item.currentBounds[index])) {
                item.board.setBoundingBox(nextBounds, item.geometry);
                item.currentBounds = nextBounds;
              }
              item.board.update();
            }
          };
          this.refresh();
          for (const { board } of this.boards) board.unsuspendUpdate();
          this.widget.classList.add('is-ready');
          this.source.setAttribute('aria-hidden', 'true');
          window.MathJax?.typesetPromise?.([this.live]).catch(console.error);
        }
        for (const item of this.boards) {
          const width = item.element.clientWidth, height = item.element.clientHeight;
          if (width !== item.width || height !== item.height) {
            item.width = width; item.height = height;
            item.board.resizeContainer(width, height, true);
            item.board.setBoundingBox(item.bounds(), item.geometry);
          }
        }
      } catch (error) {
        failed = true;
        this.observer.disconnect();
        for (const { board } of this.boards) if (board) window.JXG.JSXGraph.freeBoard(board);
        this.live.hidden = true;
        this.widget.classList.remove('is-ready');
        this.source.removeAttribute('aria-hidden');
        console.error(`The static figure is shown instead: ${this.options.type}`, error);
      }
    };
    // A proof can start closed. Initialize its figures when the boards become measurable.
    this.observer = new ResizeObserver(resize);
    for (const { element } of this.boards) this.observer.observe(element);
    resize();
    const reveal = () => {
      if (location.hash !== `#${this.widget.id}`) return;
      let parent = this.widget.parentElement;
      while (parent) { if (parent.tagName === 'DETAILS') parent.open = true; parent = parent.parentElement; }
      this.widget.scrollIntoView({ block: 'start' });
    };
    addEventListener('hashchange', reveal);
    reveal();
  }
}

function curve(board, points, color = BLUE, extra = {}) {
  const graph = board.create('curve', [[], []], { ...FIXED, strokeColor: color, strokeWidth: 2.2, ...extra });
  graph.updateDataArray = function () {
    const data = points();
    this.dataX = data.map(p => p[0]);
    this.dataY = data.map(p => p[1]);
  };
  return graph;
}
function plotCurve(board, points, frame, color = BLUE, extra = {}) {
  return curve(board, () => clipPolyline(points(), frame()), color, extra);
}
function label(board, x, y, tex, extra = {}) {
  return board.create('text', [x, y, `\\(${tex}\\)`], {
    ...FIXED, display: 'html', useMathJax: true, fontSize: 16,
    anchorX: 'middle', anchorY: 'middle', cssClass: 'figure-board-label', layer: 9, ...extra,
  });
}
function point(board, x, y, extra = {}) {
  return board.create('point', [x, y], {
    ...FIXED, size: 2.3, fillColor: BLUE, strokeColor: BLUE, layer: 8, ...extra,
  });
}
function samples(fn, start, end, count = 600) {
  return Array.from({ length: count + 1 }, (_, i) => {
    const x = start + (end - start) * i / count;
    return [x, fn(x)];
  });
}
function niceTicks(min, max, count = 6) {
  const raw = (max - min) / count;
  const scale = 10 ** Math.floor(Math.log10(raw));
  const fraction = raw / scale;
  const step = (fraction <= 1 ? 1 : fraction <= 2 ? 2 : fraction <= 5 ? 5 : 10) * scale;
  const ticks = [];
  for (let n = Math.ceil(min / step); n * step <= max + step * 1e-8; n++) ticks.push(Number((n * step).toPrecision(12)));
  return ticks;
}
function frameBounds(f) {
  const dx = f.xmax - f.xmin, dy = f.ymax - f.ymin;
  return [f.xmin - .13 * dx, f.ymax + .10 * dy, f.xmax + .07 * dx, f.ymin - .18 * dy];
}
function axes(board, frame, xName = 'x') {
  const get = () => {
    const f = frame();
    return { ...f, dx: f.xmax - f.xmin, dy: f.ymax - f.ymin,
      x0: Math.max(f.xmin, Math.min(f.xmax, 0)), y0: Math.max(f.ymin, Math.min(f.ymax, 0)),
      xticks: f.xticks || niceTicks(f.xmin, f.xmax), yticks: f.yticks || niceTicks(f.ymin, f.ymax) };
  };
  curve(board, () => { const f = get(); return [[f.xmin, f.y0], [f.xmax, f.y0]]; }, INK, { strokeWidth: 1, layer: 2 });
  curve(board, () => { const f = get(); return [[f.x0, f.ymin], [f.x0, f.ymax]]; }, INK, { strokeWidth: 1, layer: 2 });
  for (const horizontal of [false, true]) {
    for (let index = 0; index < 9; index++) {
      curve(board, () => {
        const f = get(), tick = (horizontal ? f.yticks : f.xticks)[index];
        if (tick === undefined) return [];
        return horizontal ? [[f.xmin, tick], [f.xmax, tick]] : [[tick, f.ymin], [tick, f.ymax]];
      }, '#e1e4e8', { strokeWidth: .7, strokeOpacity: .6, layer: 0 });
      board.create('text', [
        () => { const f = get(); return horizontal ? f.x0 - .035 * f.dx : f.xticks[index] ?? NaN; },
        () => { const f = get(); return horizontal ? f.yticks[index] ?? NaN : f.y0 - .055 * f.dy; },
        () => { const f = get(), tick = (horizontal ? f.yticks : f.xticks)[index]; return tick === undefined ? '' : number(tick, 3).replace('-', '−'); },
      ], { ...FIXED, fontSize: 12, anchorX: horizontal ? 'right' : 'middle', anchorY: 'middle',
        visible: () => { const f = get(); return (horizontal ? f.yticks : f.xticks)[index] !== undefined; },
        cssClass: 'figure-tick-label', layer: 7 });
    }
  }
  label(board, () => { const f = get(); return f.xmax + .035 * f.dx; },
    () => { const f = get(); return f.y0 - .05 * f.dy; }, xName, { fontSize: 15 });
  label(board, () => { const f = get(); return f.x0 - .045 * f.dx; },
    () => { const f = get(); return f.ymax + .055 * f.dy; }, 'y', { fontSize: 15 });
}
function originOne(board, frame) {
  point(board, 0, 1, { fillColor: INK, strokeColor: INK });
  label(board, () => .08 * (frame().xmax - frame().xmin),
    () => { const f = frame(), dy = f.ymax - f.ymin; return 1 - .14 * dy > Math.max(f.ymin + .02 * dy, .07 * dy) ? 1 - .14 * dy : 1 + .14 * dy; }, '(0,1)', { fontSize: 14 });
}

function mountPolygon(image, options) {
  const outer = options.type === 'circumscribed-polygon';
  const model = outer ? circumscribedPolygon : inscribedPolygon;
  const color = outer ? ORANGE : BLUE;
  const fig = new Figure(image, options);
  fig.control('n', 'n', options.n, `n, ${outer ? 'circumscribed' : 'inscribed'} polygon exponent`);
  let g = model(fig.values.n);
  const panel = fig.board(() => outer ? [-1.35, 1.3, 1.65, -1.3] : [-1.25, 1.2, 1.4, -1.2], true);
  const sideLabel = el('span', 'figure-readout figure-polygon-stat');
  sideLabel.style.color = GOLD;
  const sideNumber = el('output', 'figure-number');
  sideNumber.setAttribute('aria-label', 'Number of triangles');
  sideLabel.append(math('2^n'), document.createTextNode(' = '), sideNumber, document.createTextNode(' triangles'));
  const areaLabel = el('span', 'figure-readout figure-polygon-stat');
  areaLabel.style.color = color;
  const areaNumber = el('output', 'figure-number');
  areaNumber.setAttribute('aria-label', `${outer ? 'Circumscribed' : 'Inscribed'} polygon area`);
  areaLabel.append(math(outer ? 'B_n' : 'A_n'), document.createTextNode(' = '), areaNumber);
  fig.readouts.append(sideLabel, areaLabel);
  fig.mount(() => {
    const board = panel.board;
    board.create('circle', [[0, 0], 1], { ...FIXED, strokeColor: INK, strokeWidth: 1.4, fillOpacity: 0, center: { visible: false }, layer: 4 });
    curve(board, () => g.vertices.flatMap(p => [[0, 0], p, [NaN, NaN]]), color, { strokeWidth: 1, strokeOpacity: .17, layer: 2 });
    curve(board, () => [...g.vertices, g.vertices[0]], color, { layer: 5 });
    const o = point(board, 0, 0, { fillColor: INK, strokeColor: INK, size: 1.6 });
    const lower = point(board, () => g.vertices[0][0], () => g.vertices[0][1], { visible: false });
    const upper = point(board, () => g.vertices[1][0], () => g.vertices[1][1], { visible: false });
    board.create('polygon', [o, lower, upper], { ...FIXED, fillColor: '#f6d881', fillOpacity: .72, layer: 3,
      borders: { ...FIXED, strokeColor: GOLD, strokeWidth: 2, layer: 7 }, vertices: { visible: false }, hasInnerPoints: false });
    curve(board, () => samples(t => t, -Math.PI / g.sides, Math.PI / g.sides, 50).map(([t]) => [.25 * Math.cos(t), .25 * Math.sin(t)]), GOLD, { strokeWidth: 1, layer: 8 });
    label(board, -.09, -.08, 'O');
    if (outer) {
      curve(board, () => [[0, 0], [1, 0]], INK, { dash: 2, strokeWidth: 1.2, layer: 7 });
      curve(board, () => [[.94, 0], [.94, .06], [1, .06]], INK, { strokeWidth: 1, layer: 8 });
      label(board, .7, -.10, '1');
      label(board, 1.25, () => Math.max(.24, g.halfBase / 2), '\\tan\\!\\left(\\frac{\\pi}{2^n}\\right)', { fontSize: 13 });
    } else {
      label(board, () => .62 * g.vertices[0][0], () => .62 * g.vertices[0][1] - .08, '1');
      label(board, () => .62 * g.vertices[1][0], () => .62 * g.vertices[1][1] + .08, '1');
    }
    label(board, () => outer ? .52 : g.n <= 3 ? .41 : .34,
      () => g.n <= 3 ? outer ? .14 : 0 : .22, '\\frac{2\\pi}{2^n}', { fontSize: 15 });
  }, () => {
    g = model(fig.values.n);
    sideNumber.value = String(g.sides); areaNumber.value = g.area.toFixed(10);
    fig.widget.dataset.sides = String(g.sides); fig.widget.dataset.area = String(g.area);
    panel.element.setAttribute('aria-label', `Unit circle and an ${outer ? 'circumscribed' : 'inscribed'} ${g.sides}-gon; all radial sides and one highlighted triangle are shown.`);
  });
}

function mountSector(image, options) {
  const fig = new Figure(image, options);
  fig.control('x', '|x|', options.x, 'Absolute angle x in radians');
  let g = sectorModel(fig.values.x);
  const panel = fig.board(() => [-1.3, 1.25, 1.3, -1.2], true);
  const triangle = fig.readout('\\mathrm{Area}(OPQ)', 'Triangle area', ORANGE);
  const sector = fig.readout('\\mathrm{Area}(\\mathrm{sector})', 'Sector area', BLUE);
  fig.mount(() => {
    const board = panel.board;
    const arc = () => Array.from({ length: 181 }, (_, i) => [Math.cos(g.angle * i / 180), Math.sin(g.angle * i / 180)]);
    board.create('circle', [[0, 0], 1], { ...FIXED, strokeColor: INK, strokeWidth: 1.5, fillOpacity: 0, center: { visible: false }, layer: 4 });
    curve(board, () => [[0, 0], ...arc(), [0, 0]], BLUE, { fillColor: '#d8eaf5', fillOpacity: 1, strokeWidth: 2, layer: 2 });
    curve(board, () => [[0, 0], [1, 0], g.q, [0, 0]], ORANGE, { fillColor: '#f6d881', fillOpacity: 1, strokeWidth: 2, layer: 3 });
    curve(board, () => [[g.q[0], 0], g.q], INK, { dash: 2, strokeWidth: 1.2, layer: 5 });
    curve(board, () => arc().map(([x, y]) => [.22 * x, .22 * y]), INK, { strokeWidth: 1, layer: 6 });
    label(board, -.09, -.10, 'O'); label(board, 1.10, -.08, 'P');
    label(board, () => 1.11 * g.q[0], () => 1.11 * g.q[1] + .035, 'Q');
    label(board, () => .37 * Math.cos(g.angle / 2), () => .37 * Math.sin(g.angle / 2), '|x|');
  }, () => {
    g = sectorModel(fig.values.x);
    triangle(number(g.triangleArea, 6)); sector(number(g.sectorArea, 6));
    fig.widget.dataset.triangleArea = String(g.triangleArea); fig.widget.dataset.sectorArea = String(g.sectorArea);
    panel.element.setAttribute('aria-label', `Triangle OPQ within a circular sector of ${number(g.angle)} radians. Triangle area ${g.triangleArea}; sector area ${g.sectorArea}.`);
  });
}

function mountPower(image, options) {
  const fig = new Figure(image, options), root = options.mode === 'root';
  fig.control('n', 'n', options.n, root ? 'Root denominator n' : 'Power exponent n');
  let g = powerModel(fig.values.n, root);
  const getFrame = () => options.view;
  const panel = fig.board(() => frameBounds(getFrame()));
  const curveKey = fig.key('', BLUE), tangentKey = fig.key('', ORANGE, true);
  fig.mount(() => {
    const board = panel.board;
    axes(board, getFrame);
    plotCurve(board, () => root
      // Sampling by height resolves the near-vertical branch at x = -1.
      ? Array.from({ length: 901 }, (_, i) => { const y = 5 ** g.exponent * (i + 1) / 901; return [y ** fig.values.n - 1, y]; })
      : samples(g.value, -1 + 1e-7, 1), getFrame, BLUE, { layer: 5 });
    plotCurve(board, () => samples(g.tangent, -1 + 1e-7, root ? 4 : 1, 1), getFrame, ORANGE, { dash: 2, layer: 6 });
    point(board, -1, 0, { fillColor: '#faf9f5', size: 3.5, strokeWidth: 2 });
    originOne(board, getFrame);
  }, () => {
    g = powerModel(fig.values.n, root);
    const n = fig.values.n, power = root ? `\\frac{1}{${n}}` : String(n);
    curveKey(`y=(1+x)^{${power}}`);
    tangentKey(root ? `y=1+\\frac{x}{${n}}` : `y=1+${n}x`);
    fig.widget.dataset.exponent = String(g.exponent);
    panel.element.setAttribute('aria-label', `y = (1+x) to the power ${g.exponent}, x greater than -1, with tangent slope ${g.exponent} at (0,1). The point (-1,0) is excluded.`);
  });
}

function mountFactorial(image, options) {
  const fig = new Figure(image, options);
  fig.widget.classList.add('figure-legacy-factorial');
  fig.control('a', 'a', options.a, 'Factorial sequence base a');
  fig.control('N', 'N', options.N, 'Number of sequence terms N');
  let terms = factorialTerms(fig.values.a, fig.values.N);
  const getFrame = () => ({ xmin: .5, xmax: fig.values.N + .5, ymin: 0, ymax: Math.max(.1, ...terms.map(p => p[1])) * 1.12,
    xticks: [...new Set([1, ...niceTicks(1, fig.values.N, 4), fig.values.N])] });
  const panel = fig.board(() => frameBounds(getFrame()));
  const title = el('div', 'figure-title');
  setMath(title, '\\frac{a^n}{n!},\\quad n=1,2,\\ldots,N');
  const last = fig.readout('a^N/N!', 'Last factorial sequence term');
  fig.reset.textContent = 'Reset';
  fig.live.replaceChildren(title, fig.panels, fig.toolbar, fig.readouts, fig.reset);
  fig.mount(() => {
    const board = panel.board;
    axes(board, getFrame, 'n');
    curve(board, () => terms, '#226a9a', { strokeWidth: 1.6, layer: 4 });
    for (let i = 0; i < options.N.max; i++) point(board, () => terms[i]?.[0] ?? 0, () => terms[i]?.[1] ?? 0,
      { size: 2, fillColor: '#226a9a', strokeColor: '#226a9a', visible: () => i < terms.length });
  }, () => {
    terms = factorialTerms(fig.values.a, fig.values.N);
    last(number(terms.at(-1)[1], 8));
    fig.widget.dataset.lastTerm = String(terms.at(-1)[1]);
    panel.element.setAttribute('aria-label', `The sequence ${fig.values.a} to the n divided by n factorial, at integer n from 1 to ${fig.values.N}.`);
  });
}

function tangentEquation(slope) {
  if (Math.abs(slope) < 1e-10) return 'y=1';
  return `y=1${slope < 0 ? '-' : '+'}${number(Math.abs(slope))}x`;
}

function mountFamily(image, options) {
  const fig = new Figure(image, options);
  fig.control('a', 'a', options.a, 'Exponential base a');
  const curveKey = fig.key('', BLUE);
  let model = exponentialModel(fig.values.a);
  const getFrame = () => options.view;
  const panel = fig.board(() => frameBounds(getFrame()));
  fig.mount(() => {
    const board = panel.board;
    axes(board, getFrame);
    plotCurve(board, () => samples(model.value, -1.5, 1.5), getFrame, BLUE, { strokeWidth: 2.4, layer: 5 });
    originOne(board, getFrame);
  }, () => {
    model = exponentialModel(fig.values.a);
    curveKey(model.a === 1 ? 'y=1' : `y=${number(model.a)}^x`);
    fig.widget.dataset.a = String(model.a);
    panel.element.setAttribute('aria-label', `Exponential curve with base ${model.a}, passing through (0,1).`);
  });
}

function mountTangents(image, options) {
  const fig = new Figure(image, options);
  fig.control('a', 'a', options.a, 'Exponential tangent base a');
  const curveKey = fig.key('', BLUE);
  const tangentKey = fig.key('', ORANGE);
  let model = exponentialModel(fig.values.a);
  const getFrame = () => options.view;
  const panel = fig.board(() => frameBounds(getFrame()));
  fig.mount(() => {
    const board = panel.board;
    axes(board, getFrame);
    plotCurve(board, () => samples(model.value, -1.5, 1.5), getFrame, BLUE, { layer: 5 });
    plotCurve(board, () => samples(model.tangent, -1.5, 1.5, 1), getFrame, ORANGE, { dash: 2, layer: 6 });
    originOne(board, getFrame);
  }, () => {
    model = exponentialModel(fig.values.a);
    curveKey(`y=${number(model.a)}^x`);
    tangentKey(tangentEquation(model.k));
    fig.widget.dataset.slope = String(model.k);
    panel.element.setAttribute('aria-label', `The exponential with base ${model.a} and its tangent with slope ${model.k}, touching at (0,1).`);
  });
}

function mountReflection(image, options) {
  const fig = new Figure(image, options);
  fig.control('a', 'a', options.a, 'Reflected exponential base a');
  const curveKey = fig.key('', BLUE);
  const tangentKey = fig.key('', PURPLE);
  const reflectedKey = fig.key('', ORANGE);
  const reflectedTangentKey = fig.key('', TEAL);
  let model = exponentialModel(fig.values.a);
  const getFrame = () => options.view;
  const panel = fig.board(() => frameBounds(getFrame()));
  fig.mount(() => {
    const board = panel.board;
    axes(board, getFrame);
    plotCurve(board, () => samples(model.value, -1.5, 1.5), getFrame, BLUE, { layer: 5 });
    plotCurve(board, () => samples(model.tangent, -1.5, 1.5, 1), getFrame, PURPLE, { dash: 2, strokeWidth: 1.8, layer: 6 });
    plotCurve(board, () => samples(model.reflected, -1.5, 1.5), getFrame, ORANGE, { layer: 5 });
    plotCurve(board, () => samples(model.reflectedTangent, -1.5, 1.5, 1), getFrame, TEAL, { dash: 2, strokeWidth: 1.8, layer: 6 });
    originOne(board, getFrame);
  }, () => {
    model = exponentialModel(fig.values.a);
    curveKey(`y=${number(model.a)}^x`);
    tangentKey(tangentEquation(model.k));
    reflectedKey(`y=${number(model.a)}^{-x}`);
    reflectedTangentKey(tangentEquation(-model.k));
    fig.widget.dataset.reciprocal = String(model.b);
    panel.element.setAttribute('aria-label', `Reflection across the y-axis of the exponential with base ${model.a} and its tangent. The reflected exponential has base ${model.b} and tangent slope ${-model.k}.`);
  });
}

function mountConvexity(image, options) {
  const fig = new Figure(image, options);
  const sInput = fig.control('s', 's', options.s, 'Convex weight s');
  const tInput = fig.control('t', 't', options.t, 'Convex weight t');
  const linked = (source, targetKey) => {
    const target = fig.inputs.find(item => item.key === targetKey);
    const value = Number((1 - Number(source.value)).toFixed(10));
    target.input.value = String(value);
    target.output.value = number(value);
    fig.values[targetKey] = value;
  };
  sInput.addEventListener('input', () => linked(sInput, 't'));
  tInput.addEventListener('input', () => linked(tInput, 's'));
  sInput.addEventListener('change', () => { linked(sInput, 't'); fig.refresh?.(); });
  tInput.addEventListener('change', () => { linked(tInput, 's'); fig.refresh?.(); });

  let model = convexityModel(fig.values.s, options.a, options.b);
  const getFrame = () => options.view;
  const panel = fig.board(() => frameBounds(getFrame()));
  fig.key('y=e^x', BLUE);
  fig.key('\\ell(x)', ORANGE);
  const weightedKey = fig.key('', PURPLE);
  const xReadout = fig.readout('x', 'Weighted point x');
  const gapReadout = fig.readout('\\ell(x)-e^x', 'Vertical gap between chord and exponential', TEAL);

  fig.mount(() => {
    const board = panel.board;
    axes(board, getFrame);
    plotCurve(board, () => samples(model.value, getFrame().xmin, getFrame().xmax), getFrame, BLUE, { layer: 5 });
    plotCurve(board, () => samples(model.line, model.a, model.b, 1), getFrame, ORANGE, { strokeWidth: 2, layer: 6 });
    curve(board, () => [[model.x, model.curve], [model.x, model.chord]], TEAL, { dash: 2, strokeWidth: 1.8, layer: 7 });
    point(board, () => model.a, () => model.value(model.a), { fillColor: ORANGE, strokeColor: ORANGE });
    point(board, () => model.b, () => model.value(model.b), { fillColor: ORANGE, strokeColor: ORANGE });
    point(board, () => model.x, () => model.curve, { fillColor: BLUE, strokeColor: BLUE, size: 3 });
    point(board, () => model.x, () => model.chord, { fillColor: TEAL, strokeColor: TEAL, size: 3 });
    label(board, model.a - .08, model.value(model.a) + .16, 'a');
    label(board, model.b + .08, model.value(model.b) + .16, 'b');
  }, () => {
    model = convexityModel(fig.values.s, options.a, options.b);
    fig.values.t = model.t;
    weightedKey(`x=${number(model.s, 2)}a+${number(model.t, 2)}b`);
    xReadout(number(model.x, 4));
    gapReadout(number(model.gap, 4));
    fig.widget.dataset.x = String(model.x);
    fig.widget.dataset.gap = String(model.gap);
    panel.element.setAttribute('aria-label', `The exponential curve and the chord from a equals ${model.a} to b equals ${model.b}. At x equals ${model.x}, the chord is ${model.gap} above the curve.`);
  });
}

const mounts = {
  'inscribed-polygon': mountPolygon, 'circumscribed-polygon': mountPolygon, 'sine-sector': mountSector,
  'power-tangent': mountPower, 'factorial-sequence': mountFactorial,
  'exponential-family': mountFamily, 'exponential-tangent': mountTangents,
  'exponential-reflection': mountReflection, 'exponential-convexity': mountConvexity,
};
export function mountAdditionalFigure(image, options) {
  const mount = mounts[options.type];
  if (!mount) throw new Error(`Unknown figure type: ${options.type}`);
  mount(image, options);
}
