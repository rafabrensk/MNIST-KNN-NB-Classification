/* ==========================================================================
   charts.js — gráficos em SVG/HTML puro (sem bibliotecas)
   --------------------------------------------------------------------------
   Charts.barChart(el, opts)      barras verticais (agrupadas ou simples)
   Charts.heatmap(el, matrix)     matriz de confusão 10 × 10
   Charts.drawPixels(canvas, px)  imagem 28 × 28 a partir de 784 valores
   Charts.errorStats(matrix)      taxas de erro por classe e global
   Charts.topConfusions(matrix)   pares (real → previsto) mais frequentes
   Charts.pct(value)              0.0345 → "3,5 %"
   ========================================================================== */

const Charts = (() => {
  const SVG_NS = 'http://www.w3.org/2000/svg';

  /* ------------------------------------------------------------ utilidades */
  const pct = (v, digits = 1) =>
    v == null || Number.isNaN(v) ? '—' : (v * 100).toFixed(digits).replace('.', ',') + ' %';

  const fmtInt = (v) => Number(v).toLocaleString('pt-BR');

  function svgEl(tag, attrs = {}, parent) {
    const el = document.createElementNS(SVG_NS, tag);
    for (const [k, v] of Object.entries(attrs)) el.setAttribute(k, v);
    if (parent) parent.appendChild(el);
    return el;
  }

  // Barra com cantos arredondados só na extremidade de dados.
  function barPath(x, y, w, h, r = 4) {
    if (h <= 0) return '';
    r = Math.min(r, w / 2, h);
    return `M${x},${y + h}V${y + r}Q${x},${y} ${x + r},${y}H${x + w - r}Q${x + w},${y} ${x + w},${y + r}V${y + h}Z`;
  }
  function niceMax(v) {
    if (v <= 0) return 1;
    const exp = Math.pow(10, Math.floor(Math.log10(v)));
    for (const m of [1, 1.2, 1.5, 2, 2.5, 3, 4, 5, 6, 8, 10]) if (m * exp >= v) return m * exp;
    return 10 * exp;
  }

  function hexToRgb(hex) {
    const n = parseInt(hex.replace('#', ''), 16);
    return [(n >> 16) & 255, (n >> 8) & 255, n & 255];
  }
  function mix(a, b, t) {
    const A = hexToRgb(a), B = hexToRgb(b);
    return `rgb(${A.map((c, i) => Math.round(c + (B[i] - c) * t)).join(',')})`;
  }

  /* --------------------------------------------------------------- tooltip */
  let tipEl = null;
  function tip() { return tipEl || (tipEl = document.getElementById('tooltip')); }
  function showTip(evt, html) {
    const t = tip(); if (!t) return;
    t.innerHTML = html;
    t.classList.add('is-visible');
    const pad = 14, r = t.getBoundingClientRect();
    let x = evt.clientX + pad, y = evt.clientY + pad;
    if (x + r.width > innerWidth - 8) x = evt.clientX - r.width - pad;
    if (y + r.height > innerHeight - 8) y = evt.clientY - r.height - pad;
    t.style.left = x + 'px'; t.style.top = y + 'px';
  }
  function hideTip() { tip()?.classList.remove('is-visible'); }
  function bindTip(el, htmlFn) {
    el.addEventListener('pointermove', (e) => showTip(e, htmlFn()));
    el.addEventListener('pointerleave', hideTip);
  }

  /* ------------------------------------------------------------ legend */
  function legend(container, series) {
    if (series.length < 2) return;
    const lg = document.createElement('div');
    lg.className = 'chart-legend';
    lg.innerHTML = series
      .map((s) => `<span><i class="dot" style="background:${s.color}"></i>${s.name}</span>`)
      .join('');
    container.appendChild(lg);
  }

  /* ------------------------------------------------------------ barChart
     opts = {
       categories: ['0','1',...],
       series: [{ name, color, values: [...] }],
       height, yMax, format, xLabel, yLabel,
       labels: 'all' | 'min' | 'max' | 'none',
       highlight: { index }        // destaca uma categoria (demais esmaecidas)
     } */
  function barChart(container, opts) {
    const {
      categories, series, height = 340, format = pct, xLabel = '', yLabel = '',
      labels = 'none', highlight = null, ticks = 4,
    } = opts;
    container.innerHTML = '';
    legend(container, series);

    const W = opts.width || container.clientWidth || 800;
    const H = height;
    const m = { top: 24, right: 8, bottom: xLabel ? 52 : 32, left: 56 };
    const iw = W - m.left - m.right, ih = H - m.top - m.bottom;

    const all = series.flatMap((s) => s.values).filter((v) => v != null);
    const yMax = opts.yMax ?? niceMax(Math.max(...all, 0) * 1.08);
    const y = (v) => m.top + ih - (v / yMax) * ih;

    const svg = svgEl('svg', { viewBox: `0 0 ${W} ${H}`, role: 'img' });

    // grade e eixo y
    for (let i = 0; i <= ticks; i++) {
      const v = (yMax * i) / ticks, yy = y(v);
      if (i > 0) svgEl('line', { x1: m.left, x2: W - m.right, y1: yy, y2: yy, class: 'grid-line' }, svg);
      const t = svgEl('text', { x: m.left - 10, y: yy + 4, 'text-anchor': 'end', class: 'tick-label' }, svg);
      t.textContent = format(v, 0);
    }
    if (yLabel) {
      const t = svgEl('text', { x: m.left - 10, y: m.top - 10, 'text-anchor': 'end', class: 'axis-label' }, svg);
      t.textContent = yLabel;
    }

    const groupW = iw / categories.length;
    const inner = groupW * 0.72;
    const gap = 2;
    const bw = (inner - gap * (series.length - 1)) / series.length;

    // índice dos rótulos seletivos
    const pick = (vals, fn) => {
      const valid = vals.map((v, i) => [v, i]).filter(([v]) => v != null);
      if (!valid.length) return -1;
      return valid.reduce((a, b) => (fn(b[0], a[0]) ? b : a))[1];
    };

    series.forEach((s, si) => {
      const labelIdx =
        labels === 'min' ? pick(s.values, (a, b) => a < b) :
        labels === 'max' ? pick(s.values, (a, b) => a > b) : -1;

      s.values.forEach((v, ci) => {
        const x = m.left + groupW * ci + (groupW - inner) / 2 + si * (bw + gap);
        const val = v ?? 0;
        const dim = highlight && highlight.index !== ci;
        svgEl('path', {
          d: barPath(x, y(val), bw, y(0) - y(val)),
          fill: s.color, class: 'bar', opacity: dim ? 0.3 : 1,
        }, svg);

        const showLabel = v != null && (labels === 'all' || ci === labelIdx || (highlight && highlight.index === ci && v > 0));
        if (showLabel) {
          const t = svgEl('text', { x: x + bw / 2, y: y(val) - 8, 'text-anchor': 'middle', class: 'value-label' }, svg);
          t.textContent = format(v);
        }
      });
    });

    // áreas de hover (uma por categoria, maiores que as barras)
    categories.forEach((c, ci) => {
      const hit = svgEl('rect', {
        x: m.left + groupW * ci, y: m.top, width: groupW, height: ih + 28, fill: 'transparent',
      }, svg);
      bindTip(hit, () =>
        `<strong>${opts.categoryTitle ? opts.categoryTitle(c) : c}</strong><br>` +
        series.map((ss) => `<i class="dot" style="background:${ss.color};width:8px;height:8px"></i> ${ss.name}: ${format(ss.values[ci])}`).join('<br>'));
    });

    // baseline e rótulos de categoria
    svgEl('line', { x1: m.left, x2: W - m.right, y1: y(0), y2: y(0), class: 'baseline' }, svg);
    categories.forEach((c, ci) => {
      const t = svgEl('text', {
        x: m.left + groupW * ci + groupW / 2, y: y(0) + 22, 'text-anchor': 'middle', class: 'tick-label',
      }, svg);
      t.textContent = c;
    });
    if (xLabel) {
      const t = svgEl('text', { x: m.left + iw / 2, y: H - 6, 'text-anchor': 'middle', class: 'axis-label' }, svg);
      t.textContent = xLabel;
    }
    container.appendChild(svg);
  }

  /* ------------------------------------------------------------ estatísticas */
  function errorStats(matrix) {
    if (!matrix) return null;
    const perClass = matrix.map((row, i) => {
      const total = row.reduce((a, b) => a + b, 0);
      return total ? (total - row[i]) / total : null;
    });
    const total = matrix.flat().reduce((a, b) => a + b, 0);
    const correct = matrix.reduce((a, row, i) => a + row[i], 0);
    return { perClass, global: total ? (total - correct) / total : null, total, correct };
  }

  function topConfusions(matrix, n = 3) {
    const list = [];
    matrix.forEach((row, i) => row.forEach((v, j) => { if (i !== j && v > 0) list.push({ real: i, pred: j, count: v }); }));
    return list.sort((a, b) => b.count - a.count).slice(0, n);
  }

  /* ------------------------------------------------------------ heatmap
     Diagonal (acertos): azul escuro, intensidade pela taxa de acerto da classe.
     Fora da diagonal (erros): escala azul clara, relativa ao maior erro. */
  function heatmap(container, matrix, opts = {}) {
    const { topN = 3, color = '#2563eb' } = opts;
    container.innerHTML = '';
    // sem dados → grade vazia, mantendo o layout
    const empty = !matrix;
    if (empty) matrix = Array.from({ length: 10 }, () => Array(10).fill(0));
    const top = empty ? [] : topConfusions(matrix, topN);
    const topKey = new Set(top.map((t) => `${t.real}-${t.pred}`));
    const rowTotals = matrix.map((r) => r.reduce((a, b) => a + b, 0));
    let maxOff = 0;
    matrix.forEach((r, i) => r.forEach((v, j) => { if (i !== j) maxOff = Math.max(maxOff, v); }));

    const frag = document.createDocumentFragment();
    const head = (txt) => { const d = document.createElement('div'); d.className = 'hm-head'; d.textContent = txt; frag.appendChild(d); };

    head('');
    for (let j = 0; j < 10; j++) head(j);

    matrix.forEach((row, i) => {
      head(i);
      row.forEach((v, j) => {
        const c = document.createElement('div');
        c.className = 'hm-cell';
        if (empty) {
          c.style.background = i === j ? '#eef2f7' : '#f8fafc';
          frag.appendChild(c);
          return;
        }
        const rate = rowTotals[i] ? v / rowTotals[i] : 0;
        let bg, fg;
        if (i === j) {
          // acertos: cor do modelo escurecida (mais escura = mais acertos)
          bg = mix(color, '#0f172a', 0.3 + 0.35 * Math.max(0, Math.min(1, (rate - 0.3) / 0.7)));
          fg = '#fff';
        } else if (v === 0) {
          bg = '#f8fafc'; fg = 'transparent';
        } else {
          const t = maxOff ? Math.sqrt(v / maxOff) : 0;
          // erros: tom claro da cor do modelo (mais forte = mais erros)
          bg = mix('#f1f5f9', color, 0.6 * t);
          fg = '#1e293b';
        }
        c.style.background = bg;
        c.style.color = fg;
        c.textContent = v;
        if (topKey.has(`${i}-${j}`)) c.classList.add('is-top');
        bindTip(c, () =>
          `Real <strong>${i}</strong> → previsto <strong>${j}</strong><br>${fmtInt(v)} imagens · ${pct(rate)} da classe ${i}`);
        frag.appendChild(c);
      });
    });
    container.appendChild(frag);
    return top;
  }

  /* ------------------------------------------------------------ pixels 28×28
     tons de cinza: 0 = preto, max = branco */
  function drawPixels(canvas, pixels, { max = null } = {}) {
    const ctx = canvas.getContext('2d');
    const side = Math.round(Math.sqrt(pixels.length));
    canvas.width = side; canvas.height = side;
    const img = ctx.createImageData(side, side);
    const mx = max ?? Math.max(...pixels, 1);
    for (let p = 0; p < pixels.length; p++) {
      const v = 255 * Math.max(0, Math.min(1, pixels[p] / mx));
      const o = p * 4;
      img.data[o] = img.data[o + 1] = img.data[o + 2] = v; img.data[o + 3] = 255;
    }
    ctx.putImageData(img, 0, 0);
  }

  /* ------------------------------------------------------------ sem dados */
  function emptyState(container, { height = 240, text = 'Aguardando resultados' } = {}) {
    container.innerHTML = `<div class="empty-state" style="height:${height}px">${text}</div>`;
  }

  return { barChart, heatmap, emptyState, mix, drawPixels, errorStats, topConfusions, pct, fmtInt, showTip, hideTip };
})();
