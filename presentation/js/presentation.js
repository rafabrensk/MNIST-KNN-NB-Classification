/* ==========================================================================
   presentation.js — montagem dos slides a partir de data.js e navegação
   ========================================================================== */

(() => {
  const D = PRESENTATION;
  const $ = (sel, root = document) => root.querySelector(sel);
  const $$ = (sel, root = document) => [...root.querySelectorAll(sel)];
  // Cores dos modelos: definidas em data.js → theme
  const NB_COLOR = D.theme?.naiveBayes || '#2563eb';
  const KNN_COLOR = D.theme?.knn || '#c084fc';
  const GRAYS = ['#475569', '#94a3b8', '#cbd5e1'];

  function applyTheme() {
    const root = document.documentElement.style;
    root.setProperty('--nb', NB_COLOR);
    root.setProperty('--knn', KNN_COLOR);
    root.setProperty('--nb-ink', Charts.mix(NB_COLOR, '#0f172a', 0.2));
    root.setProperty('--knn-ink', Charts.mix(KNN_COLOR, '#0f172a', 0.45));
  }
  const DIGITS = ['0', '1', '2', '3', '4', '5', '6', '7', '8', '9'];
  const { pct, fmtInt } = Charts;

  const get = (path) => path.split('.').reduce((o, k) => (o == null ? o : o[k]), D);
  const esc = (s) => String(s).replace(/[&<>"]/g, (c) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;' }[c]));
  const placeholder = (label = 'a preencher') => `<span class="placeholder">[${esc(label)}]</span>`;
  const fill = (v, label) => (v == null || v === '' ? placeholder(label) : esc(v));
  const EXAMPLE_TAG = '<span class="example-tag">Dados de exemplo</span>';

  /* =====================================================================
     DADOS FICTÍCIOS — liga/desliga pelo botão da barra inferior.
     Com o botão desligado, nada fictício é gerado: os blocos sem dado
     real mostram "Aguardando resultados".
     ===================================================================== */
  const STORAGE_KEY = 'mnist-presentation:examples';
  let useExamples = false;
  try { useExamples = localStorage.getItem(STORAGE_KEY) === '1'; } catch (_) { /* sem storage */ }

  const hasValues = (arr) => Array.isArray(arr) && arr.some((v) => v != null);

  // Escolhe, para cada bloco, o dado real; se não houver e o botão estiver
  // ligado, o fictício (marcado com example: true).
  function resolveData() {
    const ex = useExamples;
    const pick = (real, hasReal, example) =>
      hasReal ? { data: real, example: false } :
      ex ? { data: example, example: true } : { data: null, example: false };

    const nbVal = pick(D.naiveBayes.validation, hasValues(D.naiveBayes.validation.map((r) => r.value)),
      EXAMPLE_DATA.naiveBayesValidation);
    const knnSeries = D.knn.validation.series;
    const knnVal = pick(knnSeries, knnSeries.some((s) => hasValues(s.values)), EXAMPLE_DATA.knnValidation);

    const cmNb = pick(D.confusion.naiveBayes, !!D.confusion.naiveBayes, EXAMPLE_DATA.confusion.naiveBayes);
    const cmKnn = pick(D.confusion.knn, !!D.confusion.knn, EXAMPLE_DATA.confusion.knn);

    return {
      nbValidation: nbVal,
      knnValidation: knnVal,
      confusion: { nb: cmNb.data, knn: cmKnn.data, example: cmNb.example || cmKnn.example },
      pixelMeans: pick(D.extras.pixelMeans.data, !!D.extras.pixelMeans.data, ex ? syntheticStats().means : null),
      pixelVariances: pick(D.extras.pixelVariances.data, !!D.extras.pixelVariances.data, ex ? syntheticStats().vars : null),
    };
  }
  let V = null;

  /* ---------------------------------------------------------------------
     Campos simples: <x data-field="caminho.no.data">
     --------------------------------------------------------------------- */
  function bindFields() {
    $$('[data-field]').forEach((el) => {
      el.innerHTML = fill(get(el.dataset.field), el.dataset.placeholder);
    });
  }

  // Selos amarelos dos títulos: <span class="example-tag" data-example="chave">
  function updateExampleTags() {
    $$('[data-example]').forEach((el) => {
      el.textContent = V[el.dataset.example]?.example ? 'Dados de exemplo' : '';
    });
  }

  /* ------------------------------------------------------------ Logos */
  function renderLogos() {
    const imgs = D.logos?.images || [];
    if (!imgs.length) return;
    const html = imgs.map((l) => `<img src="${esc(l.src)}" alt="${esc(l.alt || '')}">`).join('');
    $('#title-logos').innerHTML = html;
    $('#thanks-logos').innerHTML = html;
    if (!D.logos.onAllSlides) return;
    $$('.slide:not(.slide--title):not(.slide--thanks)').forEach((slide) => {
      slide.insertAdjacentHTML('beforeend', `<div class="logos logos--corner" aria-hidden="true">${html}</div>`);
    });
  }

  /* ------------------------------------------------------------ Slide 1 */
  function renderTitle() {
    const members = [...D.members].sort((a, b) => (a.name || '￿').localeCompare(b.name || '￿', 'pt-BR'));
    $('#members-list').innerHTML = members
      .map((m) => `<li><span>${fill(m.name, 'Nome')}</span><span class="nusp">nº USP ${fill(m.nusp, '0000000')}</span></li>`)
      .join('');
    $('#thanks-members').innerHTML = members.map((m) => `<li>${fill(m.name, 'Nome')}</li>`).join('');

    // Campos removidos de meta não aparecem; campos null aparecem como [a preencher].
    const metaFields = [['institution', 'Instituição'], ['professor', 'Professor(a)'], ['date', 'Data']]
      .filter(([key]) => key in D.meta)
      .map(([key, label]) => `<span>${fill(D.meta[key], label)}</span>`);
    $('#title-meta').innerHTML = metaFields.join('<span class="sep">·</span>');

    renderLogos();

    const art = $('#title-digits');
    const rng = MnistImage.seededRng(11);
    [3, 7, 1, 5, 0, 8, 2, 9, 4].forEach((d) => {
      const c = document.createElement('canvas');
      c.className = 'pixelated';
      const px = MnistImage.synthetic(d, rng);
      if (px) Charts.drawPixels(c, px, { max: 255 });
      art.appendChild(c);
    });
  }

  /* ------------------------------------------------------------ Slide 2 */
  function renderIntro() {
    const strip = $('#intro-digits');
    const real = D.dataset.sampleImages && D.dataset.sampleImages.length === 10;
    const rng = MnistImage.seededRng(5);

    DIGITS.forEach((d, i) => {
      const fig = document.createElement('figure');
      if (real) {
        fig.innerHTML = `<img class="pixelated" src="${esc(D.dataset.sampleImages[i])}" alt="Dígito ${d}"><span>${d}</span>`;
      } else {
        const c = document.createElement('canvas');
        c.className = 'pixelated';
        const px = MnistImage.synthetic(i, rng);
        if (px) Charts.drawPixels(c, px, { max: 255 });
        fig.appendChild(c);
        fig.insertAdjacentHTML('beforeend', `<span>${d}</span>`);
      }
      strip.appendChild(fig);
    });

    const big = MnistImage.synthetic(5, MnistImage.seededRng(3));
    if (big) Charts.drawPixels($('#intro-big-digit'), big, { max: 255 });

    $('#intro-caption').textContent = real
      ? 'Amostras do conjunto MNIST.'
      : 'Ilustração — não são amostras do MNIST.';
  }

  /* ------------------------------------------------------------ Slide 3 */
  function renderSplit() {
    const { trainSize, testSize } = D.dataset;
    const { trainPercent: tp, validationPercent: vp, strategy } = D.split;
    const known = tp != null && vp != null;
    const trainN = known ? Math.round((trainSize * tp) / 100) : null;
    const valN = known ? trainSize - trainN : null;
    // largura proporcional ao número de imagens (70.000 no total)
    const wTrain = known ? trainN : trainSize * 0.8;
    const wVal = known ? valN : trainSize * 0.2;
    const unk = known ? '' : ' split-bar__seg--unknown';

    $('#split-bar').innerHTML = `
      <div class="split-bar__track">
        <div class="split-bar__seg split-bar__seg--train${unk}" style="flex:${wTrain}">
          Treino interno <small>${known ? `${tp} % · ${fmtInt(trainN)} imagens` : '[__ %] — proporção a definir'}</small>
        </div>
        <div class="split-bar__seg split-bar__seg--val${unk}" style="flex:${wVal}">
          Validação <small>${known ? `${vp} % · ${fmtInt(valN)}` : '[__ %]'}</small>
        </div>
        <div class="split-bar__seg split-bar__seg--test" style="flex:${testSize}">
          Teste <small>${fmtInt(testSize)} imagens</small>
        </div>
      </div>
      <div class="split-bar__brackets">
        <div style="flex:${wTrain + wVal}">Conjunto de treino original · ${fmtInt(trainSize)} imagens</div>
        <div class="test-br" style="flex:${testSize}">Isolado até a avaliação final</div>
      </div>`;

    $('#split-detail').innerHTML = known
      ? `${tp} % / ${vp} %${strategy ? ' · ' + esc(strategy) : ''}`
      : `Proporção: ${placeholder('__ % / __ %')}${strategy ? ' · ' + esc(strategy) : ''}`;
  }

  /* ------------------------------------------------------------ Slide 4 */
  const DIST_INFO = {
    GaussianNB: {
      desc: 'Pixel contínuo',
      svg: () => {
        const pts = [];
        for (let i = 0; i <= 60; i++) {
          const x = i / 60, z = (x - 0.5) / 0.15;
          pts.push(`${(x * 200).toFixed(1)},${(80 - Math.exp(-z * z / 2) * 70).toFixed(1)}`);
        }
        return `<polyline points="${pts.join(' ')}" fill="none" stroke="${NB_COLOR}" stroke-width="2"/>`;
      },
    },
    MultinomialNB: {
      desc: 'Intensidade como contagem',
      svg: () => [0.15, 0.4, 0.75, 0.55, 0.3, 0.2, 0.1]
        .map((h, i) => `<rect x="${8 + i * 27}" y="${80 - h * 70}" width="22" height="${h * 70}" rx="2" fill="${NB_COLOR}"/>`).join(''),
    },
    BernoulliNB: {
      desc: 'Pixel aceso ou apagado',
      svg: () => `<rect x="40" y="${80 - 0.65 * 70}" width="50" height="${0.65 * 70}" rx="2" fill="${NB_COLOR}"/>
        <rect x="110" y="${80 - 0.35 * 70}" width="50" height="${0.35 * 70}" rx="2" fill="${NB_COLOR}"/>
        <text x="65" y="96" text-anchor="middle" font-size="12" fill="#64748b">0</text>
        <text x="135" y="96" text-anchor="middle" font-size="12" fill="#64748b">1</text>`,
    },
  };

  function renderNaiveBayesStatic() {
    const nb = D.naiveBayes;
    const row = $('#nb-distributions');
    row.classList.toggle('has-choice', !!nb.chosen);
    row.innerHTML = nb.validation.map((r) => {
      const info = DIST_INFO[r.name] || { desc: '', svg: () => '' };
      const chosen = nb.chosen === r.name;
      return `<div class="dist${chosen ? ' is-chosen' : ''}">
        <svg viewBox="0 0 200 100" preserveAspectRatio="none">
          <line x1="0" x2="200" y1="80" y2="80" stroke="#cbd5e1"/>${info.svg()}
        </svg>
        <h4>${esc(r.name)}${chosen ? '<span class="chosen-tag">Escolhida</span>' : ''}</h4>
        <p>${esc(info.desc)}</p>
      </div>`;
    }).join('');
  }

  function renderNaiveBayesResults() {
    const el = $('#nb-validation-chart');
    if (!V.nbValidation.data) return Charts.emptyState(el, { height: 150 });
    Charts.hbarChart(el, {
      items: V.nbValidation.data.map((r) => ({ name: r.name, value: r.value })),
      color: NB_COLOR,
      highlightName: D.naiveBayes.chosen,
      valueLabel: 'Taxa de erro na validação',
    });
  }

  /* ------------------------------------------------------------ Slide 5 */
  function renderKnn() {
    const el = $('#knn-validation-chart');
    if (!V.knnValidation.data) return Charts.emptyState(el, { height: 400 });
    // séries = métricas de distância: cor do KNN na primeira, cinzas nas demais
    const palette = [KNN_COLOR, ...GRAYS];
    Charts.barChart(el, {
      categories: D.knn.validation.kValues.map((k) => `K = ${k}`),
      series: V.knnValidation.data.map((s, i) => ({ name: s.name, color: palette[i % palette.length], values: s.values })),
      height: 400,
      labels: 'all',
      yLabel: 'erro',
    });
  }

  /* ------------------------------------------------------------ Slide 6 */
  function renderConfusion() {
    const draw = (matrix, el, topEl, color) => {
      const top = Charts.heatmap(el, matrix, { color });
      topEl.innerHTML = matrix
        ? `<span class="lbl">Confusões mais frequentes</span>` +
          top.map((t) => `<span><strong>${t.real} → ${t.pred}</strong> · ${fmtInt(t.count)}</span>`).join('')
        : '<span class="lbl">Aguardando resultados</span>';
    };
    draw(V.confusion.nb, $('#cm-nb'), $('#cm-nb-top'), NB_COLOR);
    draw(V.confusion.knn, $('#cm-knn'), $('#cm-knn-top'), KNN_COLOR);
  }

  /* ------------------------------------------------------------ Slide 7 */
  function renderErrors() {
    const nb = Charts.errorStats(V.confusion.nb);
    const kn = Charts.errorStats(V.confusion.knn);

    const hero = (name, cls, s) => `
      <div class="hero">
        <span class="hero__label"><span class="dot dot--${cls}"></span>${name}</span>
        <span class="hero__value${s ? '' : ' is-empty'}">${s ? pct(s.global).replace(' %', '') : '—'}<small> %</small></span>
        <span class="hero__sub">${s ? `erro global · ${fmtInt(s.total - s.correct)} de ${fmtInt(s.total)} imagens` : 'erro global · aguardando resultados'}</span>
      </div>`;
    $('#global-errors').innerHTML = hero('Naive Bayes', 'nb', nb) + hero('KNN', 'knn', kn);

    const chart = $('#class-error-chart');
    if (!nb && !kn) Charts.emptyState(chart, { height: 330 });
    else {
      Charts.barChart(chart, {
        categories: DIGITS,
        series: [
          { name: 'Naive Bayes', color: NB_COLOR, values: nb ? nb.perClass : Array(10).fill(null) },
          { name: 'KNN', color: KNN_COLOR, values: kn ? kn.perClass : Array(10).fill(null) },
        ],
        height: 330,
        xLabel: 'Classe (dígito real)',
        categoryTitle: (c) => `Classe ${c}`,
      });
    }

    const row = (name, cls, s) => {
      const vals = s ? s.perClass : Array(10).fill(null);
      const max = s ? vals.indexOf(Math.max(...vals)) : -1;
      const min = s ? vals.indexOf(Math.min(...vals)) : -1;
      return `<tr><th><span class="dot dot--${cls}"></span> ${name}</th>${vals.map((v, i) =>
        `<td class="${i === max ? 'is-max' : ''}${i === min ? 'is-min' : ''}">${pct(v)}</td>`).join('')}
        <td class="col-global">${pct(s?.global)}</td></tr>`;
    };
    $('#class-error-table').innerHTML = `
      <thead><tr><th></th>${DIGITS.map((d) => `<th>${d}</th>`).join('')}<th class="col-global">Global</th></tr></thead>
      <tbody>${row('Naive Bayes', 'nb', nb)}${row('KNN', 'knn', kn)}</tbody>
      <caption style="caption-side:bottom;text-align:left;padding-top:10px;font-size:13px;color:var(--muted)">
        ▲ classe com maior taxa de erro · ▼ classe com menor taxa de erro
      </caption>`;
  }

  /* ------------------------------------------------------------ Slide 8 */
  // ilustração sintética de médias/variâncias (só com dados fictícios)
  let synthStats = null;
  function syntheticStats() {
    if (synthStats) return synthStats;
    const rng = MnistImage.seededRng(42), N = 30;
    const means = [], vars = [];
    for (let d = 0; d < 10; d++) {
      const sum = new Float64Array(784), sq = new Float64Array(784);
      for (let n = 0; n < N; n++) {
        const px = MnistImage.synthetic(d, rng);
        if (!px) continue;
        for (let p = 0; p < 784; p++) { sum[p] += px[p]; sq[p] += px[p] * px[p]; }
      }
      const m = Array.from(sum, (s) => s / N);
      means.push(m);
      vars.push(Array.from(sq, (s, p) => s / N - m[p] * m[p]));
    }
    return (synthStats = { means, vars });
  }

  const panelHead = (text, example) =>
    `<div class="tab-panel__head"><p>${text}</p>${example ? EXAMPLE_TAG : ''}</div>`;

  function pixelGridPanel(resolved, colormap, note, label) {
    const rows = resolved.data;
    const wrap = document.createElement('div');
    wrap.className = 'tab-panel__body';
    wrap.innerHTML = panelHead(note ? esc(note) : label, resolved.example) + '<div class="pixel-grid"></div>' +
      (rows ? `<div class="colorbar">baixo <i style="background:linear-gradient(90deg,#000,${colormap === 'blue' ? '#2563eb,#fff' : '#fff'})"></i> alto</div>` : '');
    const grid = $('.pixel-grid', wrap);
    const max = rows ? Math.max(...rows.flat()) : 1;
    DIGITS.forEach((d, i) => {
      const fig = document.createElement('figure');
      if (rows) {
        const c = document.createElement('canvas');
        c.className = 'pixelated';
        Charts.drawPixels(c, rows[i], { colormap, max });
        fig.appendChild(c);
      } else {
        fig.insertAdjacentHTML('beforeend', '<div class="slot__img">28 × 28</div>');
      }
      fig.insertAdjacentHTML('beforeend', `<span>${d}</span>`);
      grid.appendChild(fig);
    });
    return wrap;
  }

  const slot = (img, caption) => `
    <div class="slot">
      <div class="slot__img">${img ? `<img src="${esc(img)}" alt="">` : 'imagem'}</div>
      <span>${caption}</span>
    </div>`;

  const EXTRA_TABS = {
    pixelMeans: {
      label: 'Médias por classe',
      render: (cfg) => pixelGridPanel(V.pixelMeans, 'gray', cfg.note,
        'Média de cada pixel por classe (imagens 28 × 28): o “dígito típico” de cada classe.'),
    },
    pixelVariances: {
      label: 'Variâncias por classe',
      render: (cfg) => pixelGridPanel(V.pixelVariances, 'blue', cfg.note,
        'Variância de cada pixel por classe: regiões onde a escrita muda mais entre exemplos.'),
    },
    misclassified: {
      label: 'Erros de classificação',
      render: (cfg) => {
        const items = cfg.items.length ? cfg.items : Array(6).fill(null);
        const el = document.createElement('div');
        el.className = 'tab-panel__body';
        el.innerHTML = panelHead(cfg.note ? esc(cfg.note) : 'Instâncias do teste classificadas incorretamente.', false) +
          `<div class="slots">${items.map((it) => it
            ? slot(it.image, `Real <strong>${it.trueLabel}</strong> · NB ${it.nb ?? '–'} · KNN ${it.knn ?? '–'}`)
            : slot(null, 'Real ? · NB ? · KNN ?')).join('')}</div>`;
        return el;
      },
    },
    distanceComparison: {
      label: 'Métricas de distância',
      title: 'Comparação de métricas de distância',
      render: (cfg) => {
        const v = V.knnValidation;
        const kValues = D.knn.validation.kValues;
        const palette = [KNN_COLOR, ...GRAYS];
        const el = document.createElement('div');
        el.className = 'tab-panel__body';
        const series = (v.data || D.knn.validation.series).map((s) => {
          const valid = s.values.filter((x) => x != null);
          const best = valid.length ? Math.min(...valid) : null;
          return { ...s, best, bestK: best != null ? kValues[s.values.indexOf(best)] : null };
        });

        // destaque: menor erro de cada métrica
        const heroes = series.map((s, i) => `
          <div class="hero">
            <span class="hero__label"><span class="dot" style="background:${palette[i % palette.length]}"></span>${esc(s.name)}</span>
            <span class="hero__value${s.best == null ? ' is-empty' : ''}">${s.best != null ? pct(s.best).replace(' %', '') : '—'}<small> %</small></span>
            <span class="hero__sub">menor erro${s.bestK != null ? ` · K = ${s.bestK}` : ''}</span>
          </div>`).join('');

        const rows = series.map((s) => `<tr><th>${esc(s.name)}</th>${s.values.map((x) =>
          `<td class="${x != null && x === s.best ? 'is-max' : ''}">${pct(x)}</td>`).join('')}</tr>`).join('');

        el.innerHTML = panelHead(cfg.note ? esc(cfg.note) : 'Erro na validação por métrica de distância', v.example) + `
          <div class="hero-row">${heroes}</div>
          <table class="data-table data-table--lg">
            <thead><tr><th>Métrica</th>${kValues.map((k) => `<th>K = ${k}</th>`).join('')}</tr></thead>
            <tbody>${rows}</tbody>
          </table>`;
        return el;
      },
    },
    knnExamples: {
      label: 'Exemplos do KNN',
      render: (cfg) => {
        const k = D.knn.k || 5;
        const items = cfg.items.length ? cfg.items : [null, null];
        const el = document.createElement('div');
        el.className = 'tab-panel__body';
        el.innerHTML = panelHead(cfg.note ? esc(cfg.note) : 'Imagem de consulta e seus vizinhos mais próximos no treino.', false) +
          `<div class="stack">${items.map((it) => `
            <div class="knn-row">
              ${slot(it?.query, it ? `Consulta · real <strong>${it.label}</strong>` : 'Consulta')}
              <span class="arrow">→</span>
              ${(it ? it.neighbors : Array(k).fill(null)).map((n, i) =>
                slot(n?.image, n ? `Vizinho ${i + 1} · <strong>${n.label}</strong>` : `Vizinho ${i + 1}`)).join('')}
            </div>`).join('')}</div>`;
        return el;
      },
    },
  };

  let activeTab = null;
  function renderExtras() {
    const tabs = $('#extras-tabs'), panels = $('#extras-panels');
    tabs.innerHTML = ''; panels.innerHTML = '';
    const enabled = Object.entries(EXTRA_TABS).filter(([key]) => D.extras[key]?.enabled);
    if (!enabled.some(([key]) => key === activeTab)) activeTab = enabled[0]?.[0];
    // com uma única análise, não há abas: o título do slide vira o nome dela
    tabs.classList.toggle('is-hidden', enabled.length < 2);
    $('#extras-title').textContent = enabled.length === 1 ? (enabled[0][1].title || enabled[0][1].label) :'Análises complementares';

    enabled.forEach(([key, def]) => {
      const btn = document.createElement('button');
      btn.type = 'button';
      btn.setAttribute('role', 'tab');
      btn.textContent = def.label;
      btn.setAttribute('aria-selected', key === activeTab);
      btn.dataset.tab = key;
      tabs.appendChild(btn);

      const panel = document.createElement('div');
      panel.className = 'tab-panel' + (key === activeTab ? ' is-active' : '');
      panel.dataset.tab = key;
      panel.appendChild(def.render(D.extras[key]));
      panels.appendChild(panel);
    });
  }

  function initTabs() {
    $('#extras-tabs').addEventListener('click', (e) => {
      const key = e.target.closest('button')?.dataset.tab;
      if (!key) return;
      activeTab = key;
      $$('#extras-tabs button').forEach((b) => b.setAttribute('aria-selected', b.dataset.tab === key));
      $$('#extras-panels .tab-panel').forEach((p) => p.classList.toggle('is-active', p.dataset.tab === key));
    });
  }

  /* ------------------------------------------------------------ Slide 9 */
  function renderConclusions() {
    const nb = Charts.errorStats(V.confusion.nb);
    const kn = Charts.errorStats(V.confusion.knn);
    const ex = V.confusion.example ? EXAMPLE_TAG : '';

    const autoBlock = {
      comparison: () => nb && kn
        ? `<div class="kpi"><span><i class="dot dot--nb"></i> NB: <b>${pct(nb.global)}</b> de erro</span>
             <span><i class="dot dot--knn"></i> KNN: <b>${pct(kn.global)}</b> de erro</span></div>${ex}`
        : '',
      best: () => {
        if (!nb || !kn) return '';
        const best = nb.global < kn.global ? 'Naive Bayes' : kn.global < nb.global ? 'KNN' : 'Empate';
        const diff = Math.abs(nb.global - kn.global);
        return `<div class="kpi"><span><b>${best}</b> · diferença de ${pct(diff)} no erro global</span></div>${ex}`;
      },
    };

    $('#conclusions').innerHTML = D.conclusions.map((c, i) => `
      <div class="conclusion">
        <h3><span class="n">${String(i + 1).padStart(2, '0')}</span>${esc(c.title)}</h3>
        ${c.auto && autoBlock[c.auto] ? autoBlock[c.auto]() : ''}
        <ul>${c.items.map((it) => `<li>${fill(it)}</li>`).join('')}</ul>
      </div>`).join('');
  }

  /* ------------------------------------------------------------ dependentes dos dados */
  function renderData() {
    V = resolveData();
    updateExampleTags();
    renderNaiveBayesResults();
    renderKnn();
    renderConfusion();
    renderErrors();
    renderExtras();
    renderConclusions();
    DemoController.setExamples(useExamples);
  }

  function initExamplesToggle() {
    const toggle = $('#toggle-examples');
    toggle.checked = useExamples;
    toggle.addEventListener('change', () => {
      useExamples = toggle.checked;
      try { localStorage.setItem(STORAGE_KEY, useExamples ? '1' : '0'); } catch (_) { /* sem storage */ }
      renderData();
      toggle.blur();
    });
  }

  /* =====================================================================
     NAVEGAÇÃO
     ===================================================================== */
  const slides = $$('.slide');
  const demoIndex = slides.findIndex((s) => s.id === 'demo');
  let current = 0;
  let contentReady = false;

  function go(index, { updateHash = true } = {}) {
    index = Math.max(0, Math.min(slides.length - 1, index));
    current = index;
    slides.forEach((s, i) => {
      s.classList.toggle('is-active', i === index);
      s.classList.toggle('is-before', i < index);
      s.setAttribute('aria-hidden', i !== index);
    });
    $('#slide-count').textContent = `${index + 1} / ${slides.length}`;
    $('#progress-fill').style.width = `${((index + 1) / slides.length) * 100}%`;
    $('#btn-prev').disabled = index === 0;
    $('#btn-next').disabled = index === slides.length - 1;
    $('#btn-demo').textContent = index === demoIndex ? 'Voltar ao início' : 'Demonstração';
    document.title = `${slides[index].dataset.title} · MNIST`;
    Charts.hideTip();
    if (index === demoIndex && contentReady) DemoController.onShow();
    if (updateHash) history.replaceState(null, '', `#${index + 1}`);
  }

  // PDF: abre a impressão do navegador com um slide por página
  // (escolher "Salvar como PDF" como destino). A demonstração não entra.
  function exportPdf() {
    Charts.hideTip();
    window.print();
  }

  function toggleFullscreen() {
    if (!document.fullscreenElement) document.documentElement.requestFullscreen?.();
    else document.exitFullscreen?.();
  }

  // Em tela cheia (botão/F ou F11 do navegador) a barra inferior some.
  function updateFullscreenState() {
    const api = !!document.fullscreenElement;
    const f11 = matchMedia('(display-mode: fullscreen)').matches ||
      (Math.abs(innerHeight - screen.height) <= 2 && Math.abs(innerWidth - screen.width) <= 2);
    document.body.classList.toggle('is-fullscreen', api || f11);
  }

  function initNavigation() {
    $('#btn-prev').addEventListener('click', () => go(current - 1));
    $('#btn-next').addEventListener('click', () => go(current + 1));
    $('#btn-demo').addEventListener('click', () => go(current === demoIndex ? 0 : demoIndex));
    $('#btn-fullscreen').addEventListener('click', toggleFullscreen);
    $('#btn-pdf').addEventListener('click', exportPdf);
    document.addEventListener('fullscreenchange', updateFullscreenState);

    document.addEventListener('keydown', (e) => {
      if (e.target.matches('input, textarea, select') || e.altKey || e.ctrlKey || e.metaKey) return;
      switch (e.key) {
        case 'ArrowRight': case 'ArrowDown': case 'PageDown': case ' ':
          e.preventDefault(); go(current + 1); break;
        case 'ArrowLeft': case 'ArrowUp': case 'PageUp':
          e.preventDefault(); go(current - 1); break;
        case 'Home': go(0); break;
        case 'End': go(slides.length - 1); break;
        case 'd': case 'D': go(demoIndex); break;
        case 'f': case 'F': toggleFullscreen(); break;
        case 'p': case 'P': exportPdf(); break;
      }
    });

    const fromHash = () => {
      const n = parseInt(location.hash.slice(1), 10);
      return Number.isFinite(n) ? n - 1 : 0;
    };
    window.addEventListener('hashchange', () => go(fromHash(), { updateHash: false }));
    go(fromHash(), { updateHash: false });
  }

  // Escala o palco 1600 × 900 para caber na janela, mantendo a proporção.
  function fitStage() {
    const s = Math.min(innerWidth / 1600, innerHeight / 900);
    $('#stage').style.transform = `translate(-50%, -50%) scale(${s})`;
    updateFullscreenState();
  }

  /* =====================================================================
     INICIALIZAÇÃO
     ===================================================================== */
  async function init() {
    applyTheme();
    fitStage();
    window.addEventListener('resize', fitStage);
    initNavigation();

    // espera a fonte manuscrita das ilustrações (com limite de tempo)
    try {
      await Promise.race([
        document.fonts.load('700 100px Caveat'),
        new Promise((r) => setTimeout(r, 1500)),
      ]);
    } catch (_) { /* segue com a fonte de fallback */ }

    bindFields();
    renderTitle();
    renderIntro();
    renderSplit();
    renderNaiveBayesStatic();
    initTabs();
    DemoController.init();
    initExamplesToggle();
    renderData();
    contentReady = true;
    if (current === demoIndex) DemoController.onShow();
  }

  init();
})();
