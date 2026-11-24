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

  function applyTheme() {
    const root = document.documentElement.style;
    root.setProperty('--nb', NB_COLOR);
    root.setProperty('--knn', KNN_COLOR);
  }
  const DIGITS = ['0', '1', '2', '3', '4', '5', '6', '7', '8', '9'];
  const { pct, fmtInt } = Charts;

  const get = (path) => path.split('.').reduce((o, k) => (o == null ? o : o[k]), D);
  const esc = (s) => String(s).replace(/[&<>"]/g, (c) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;' }[c]));
  const placeholder = (label = 'a preencher') => `<span class="placeholder">[${esc(label)}]</span>`;
  const fill = (v, label) => (v == null || v === '' ? placeholder(label) : esc(v));

  /* =====================================================================
     DADOS FICTÍCIOS — botão da barra inferior, visível só quando os dados
     de treinamento não são encontrados. Ligado, a demonstração responde
     com resultados simulados (data.js → EXAMPLE_DATA).
     ===================================================================== */
  const STORAGE_KEY = 'mnist-presentation:examples';
  let useExamples = false;
  try { useExamples = localStorage.getItem(STORAGE_KEY) === '1'; } catch (_) { /* sem storage */ }

  function initExamplesToggle() {
    const toggle = $('#toggle-examples');
    toggle.checked = useExamples;
    DemoController.setExamples(useExamples);
    toggle.addEventListener('change', () => {
      useExamples = toggle.checked;
      try { localStorage.setItem(STORAGE_KEY, useExamples ? '1' : '0'); } catch (_) { /* sem storage */ }
      DemoController.setExamples(useExamples);
      updateModelStatus();
      toggle.blur();
    });
  }

  /* ---------------------------------------------------------------------
     Campos simples: <x data-field="caminho.no.data">
     --------------------------------------------------------------------- */
  function bindFields() {
    $$('[data-field]').forEach((el) => {
      el.innerHTML = fill(get(el.dataset.field), el.dataset.placeholder);
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

  /* ------------------------------------------------------------ Capa e último slide */
  function renderTitle() {
    renderLogos();

    // integrantes no rodapé do último slide, em ordem alfabética
    const members = [...D.members].sort((a, b) => (a.name || '￿').localeCompare(b.name || '￿', 'pt-BR'));
    $('#thanks-members').innerHTML = members.map((m) => `<li>${fill(m.name, 'Nome')}</li>`).join('');

    // dígitos ilustrativos da capa
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

  /* ------------------------------------------------------------ Matrizes de confusão */
  function renderConfusion() {
    const draw = (matrix, el, topEl, color) => {
      const top = Charts.heatmap(el, matrix, { color });
      topEl.innerHTML = matrix
        ? `<span class="lbl">Confusões mais frequentes</span>` +
          top.map((t) => `<span><strong>${t.real} → ${t.pred}</strong> · ${fmtInt(t.count)}</span>`).join('')
        : '<span class="lbl">Aguardando resultados</span>';
    };
    draw(D.confusion.naiveBayes, $('#cm-nb'), $('#cm-nb-top'), NB_COLOR);
    draw(D.confusion.knn, $('#cm-knn'), $('#cm-knn-top'), KNN_COLOR);
  }

  /* ------------------------------------------------------------ Taxas de erro */
  function renderErrors() {
    const nb = Charts.errorStats(D.confusion.naiveBayes);
    const kn = Charts.errorStats(D.confusion.knn);

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

  /* ------------------------------------------------------------ indicador dos dados de treinamento */
  function updateModelStatus(state) {
    const info = ClassifierService.modelsInfo();
    let st = info ? 'ok' : state || 'off';
    if (st === 'off' && useExamples) st = 'sim';
    $('#model-status').className = `model-status is-${st}`;
    $('#model-status-text').textContent =
      st === 'ok' ? `Conectado aos dados de treinamento · ${info.n.toLocaleString('pt-BR')} exemplos`
      : st === 'loading' ? 'Procurando dados de treinamento…'
      : st === 'sim' ? 'Simulando · dados fictícios'
      : 'Dados de treinamento não encontrados';
    // o botão "Dados fictícios" só aparece sem conexão com os dados de treinamento
    $('#examples-switch').classList.toggle('is-hidden', st === 'ok' || st === 'loading');
  }

  function initModelStatus() {
    document.addEventListener('models:loaded', () => updateModelStatus());
    updateModelStatus('loading');
    ClassifierService.ensureModels().then(() => updateModelStatus());
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
    renderConfusion();
    renderErrors();
    DemoController.init();
    initExamplesToggle();
    initModelStatus();
    contentReady = true;
    if (current === demoIndex) DemoController.onShow();
  }

  init();
})();
