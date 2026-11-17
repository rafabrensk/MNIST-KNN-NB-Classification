/* ==========================================================================
   drawing.js — Canvas de desenho e camada de classificação da demonstração
   --------------------------------------------------------------------------
   MnistImage         converte um canvas em 784 pixels no formato do MNIST
   DrawingPad         canvas de desenho (mouse, caneta e toque)
   ClassifierService  ponto único de integração com os modelos
   DemoController     liga desenho, classificação e gráficos na interface
   ========================================================================== */

/* -------------------------------------------------------------------------
   MnistImage — formatação da entrada no padrão MNIST
   (o mesmo formato das imagens originais; não é pré-processamento extra:
   o MNIST já armazena os dígitos centralizados desta forma)
   1. recorta o traço pela caixa delimitadora;
   2. redimensiona para caber em 20 × 20 mantendo a proporção;
   3. posiciona numa imagem 28 × 28 centralizando pelo centro de massa.
   ------------------------------------------------------------------------- */
const MnistImage = (() => {
  const SIDE = 28, BOX = 20;

  function fromCanvas(src) {
    const sctx = src.getContext('2d', { willReadFrequently: true });
    const { width: w, height: h } = src;
    const data = sctx.getImageData(0, 0, w, h).data;

    let x0 = w, y0 = h, x1 = -1, y1 = -1;
    for (let y = 0; y < h; y++) {
      for (let x = 0; x < w; x++) {
        if (data[(y * w + x) * 4] > 20) {
          if (x < x0) x0 = x; if (x > x1) x1 = x;
          if (y < y0) y0 = y; if (y > y1) y1 = y;
        }
      }
    }
    if (x1 < 0) return null; // canvas vazio

    const bw = x1 - x0 + 1, bh = y1 - y0 + 1;
    const scale = BOX / Math.max(bw, bh);
    const dw = Math.max(1, Math.round(bw * scale)), dh = Math.max(1, Math.round(bh * scale));

    // redução em etapas para um antisserrilhado mais próximo do MNIST
    let step = document.createElement('canvas');
    step.width = bw; step.height = bh;
    step.getContext('2d').drawImage(src, x0, y0, bw, bh, 0, 0, bw, bh);
    while (step.width / 2 > dw && step.height / 2 > dh) {
      const half = document.createElement('canvas');
      half.width = Math.ceil(step.width / 2); half.height = Math.ceil(step.height / 2);
      const hctx = half.getContext('2d');
      hctx.imageSmoothingQuality = 'high';
      hctx.drawImage(step, 0, 0, half.width, half.height);
      step = half;
    }
    const small = document.createElement('canvas');
    small.width = dw; small.height = dh;
    const smctx = small.getContext('2d', { willReadFrequently: true });
    smctx.imageSmoothingQuality = 'high';
    smctx.drawImage(step, 0, 0, dw, dh);
    const sd = smctx.getImageData(0, 0, dw, dh).data;

    // centro de massa
    let mass = 0, cx = 0, cy = 0;
    for (let y = 0; y < dh; y++) for (let x = 0; x < dw; x++) {
      const v = sd[(y * dw + x) * 4];
      mass += v; cx += x * v; cy += y * v;
    }
    cx = mass ? cx / mass : dw / 2; cy = mass ? cy / mass : dh / 2;
    const ox = Math.round(SIDE / 2 - cx - 0.5), oy = Math.round(SIDE / 2 - cy - 0.5);

    const out = new Uint8ClampedArray(SIDE * SIDE);
    for (let y = 0; y < dh; y++) for (let x = 0; x < dw; x++) {
      const tx = x + ox, ty = y + oy;
      if (tx >= 0 && ty >= 0 && tx < SIDE && ty < SIDE) out[ty * SIDE + tx] = sd[(y * dw + x) * 4];
    }
    return out;
  }

  /* Dígito sintético (ilustração): escrito com fonte manuscrita, com
     pequenas variações aleatórias. NÃO é uma amostra do dataset MNIST. */
  function synthetic(digit, rng = Math.random) {
    const c = document.createElement('canvas');
    c.width = c.height = 140;
    const ctx = c.getContext('2d');
    ctx.fillStyle = '#000'; ctx.fillRect(0, 0, 140, 140);
    ctx.translate(70, 70);
    ctx.rotate((rng() - 0.5) * 0.35);
    ctx.transform(1, 0, (rng() - 0.5) * 0.4, 1, 0, 0);
    ctx.scale(0.85 + rng() * 0.3, 0.9 + rng() * 0.2);
    ctx.fillStyle = ctx.strokeStyle = '#fff';
    ctx.lineWidth = 2 + rng() * 6;
    ctx.lineJoin = 'round';
    ctx.font = `700 ${100}px Caveat, 'Segoe Script', 'Comic Sans MS', cursive`;
    ctx.textAlign = 'center'; ctx.textBaseline = 'middle';
    ctx.fillText(String(digit), 0, 4);
    ctx.strokeText(String(digit), 0, 4);
    return fromCanvas(c);
  }

  // gerador pseudoaleatório determinístico (mesma ilustração a cada carga)
  function seededRng(seed = 1) {
    let s = seed % 2147483647; if (s <= 0) s += 2147483646;
    return () => (s = (s * 16807) % 2147483647) / 2147483647;
  }

  return { fromCanvas, synthetic, seededRng, SIDE };
})();


/* -------------------------------------------------------------------------
   DrawingPad — desenho com Pointer Events (mouse, caneta e toque)
   ------------------------------------------------------------------------- */
class DrawingPad {
  constructor(canvas, { onStrokeEnd } = {}) {
    this.canvas = canvas;
    this.ctx = canvas.getContext('2d', { willReadFrequently: true });
    this.brush = 34;
    this.drawing = false;
    this.last = null;
    this.isEmpty = true;
    this.onStrokeEnd = onStrokeEnd || (() => {});
    this.clear();

    canvas.addEventListener('pointerdown', (e) => this.start(e));
    canvas.addEventListener('pointermove', (e) => this.move(e));
    canvas.addEventListener('pointerup', (e) => this.end(e));
    canvas.addEventListener('pointercancel', (e) => this.end(e));
  }

  // converte coordenadas da tela para o canvas (funciona com o palco escalado)
  point(e) {
    const r = this.canvas.getBoundingClientRect();
    return {
      x: (e.clientX - r.left) * (this.canvas.width / r.width),
      y: (e.clientY - r.top) * (this.canvas.height / r.height),
    };
  }

  start(e) {
    e.preventDefault();
    this.canvas.setPointerCapture(e.pointerId);
    this.drawing = true;
    this.last = this.point(e);
    this.dot(this.last);
    this.isEmpty = false;
  }

  move(e) {
    if (!this.drawing) return;
    e.preventDefault();
    const events = e.getCoalescedEvents ? e.getCoalescedEvents() : [e];
    for (const ev of events.length ? events : [e]) {
      const p = this.point(ev);
      const { ctx } = this;
      ctx.lineWidth = this.brush;
      ctx.lineCap = ctx.lineJoin = 'round';
      ctx.strokeStyle = '#fff';
      ctx.beginPath();
      ctx.moveTo(this.last.x, this.last.y);
      ctx.lineTo(p.x, p.y);
      ctx.stroke();
      this.last = p;
    }
  }

  end(e) {
    if (!this.drawing) return;
    this.drawing = false;
    if (this.canvas.hasPointerCapture?.(e.pointerId)) this.canvas.releasePointerCapture(e.pointerId);
    this.onStrokeEnd();
  }

  dot(p) {
    const { ctx } = this;
    ctx.fillStyle = '#fff';
    ctx.beginPath();
    ctx.arc(p.x, p.y, this.brush / 2, 0, Math.PI * 2);
    ctx.fill();
  }

  setBrush(size) { this.brush = Number(size); }

  clear() {
    this.ctx.fillStyle = '#000';
    this.ctx.fillRect(0, 0, this.canvas.width, this.canvas.height);
    this.isEmpty = true;
  }

  /** 784 valores inteiros (0–255), linha a linha — formato de entrada dos modelos. */
  getPixels() { return this.isEmpty ? null : MnistImage.fromCanvas(this.canvas); }
}


/* -------------------------------------------------------------------------
   ClassifierService — ponto único de integração
   -------------------------------------------------------------------------
   Formato de resultado esperado pela interface (normalizado):
   {
     simulated: boolean,
     naiveBayes: { prediction: 0–9, probabilities: [10 números, soma 1] },
     knn:        { prediction: 0–9, votes: [10 contagens], proportions: [10] }
   }

   Ordem de prioridade:
   1. Modelos reais no navegador (models.js), lidos de presentation/models/
      ou de arquivos escolhidos pelo usuário. Gerados por
      src/export_web_models.py.
   2. Resultados simulados, se "Dados fictícios" estiver ligado.
   3. Caso contrário, NotAvailableError.
   ------------------------------------------------------------------------- */
class NotAvailableError extends Error {}

const ClassifierService = (() => {
  let scenario = 0;
  let simulationEnabled = false;
  let loading = null;

  /** Tenta carregar os modelos da pasta models/ (uma tentativa por vez). */
  function ensureModels() {
    if (BrowserModels.isReady()) return Promise.resolve(true);
    if (!loading) {
      loading = BrowserModels.loadFromUrl(PRESENTATION.demo.modelsPath || 'models/')
        .then(() => true)
        .catch(() => false)
        .finally(() => { loading = null; });
    }
    return loading;
  }

  const argmax = (arr) => arr.reduce((best, v, i) => (v > arr[best] ? i : best), 0);

  function normalize(raw, simulated) {
    const nbProbs = raw.naiveBayes.probabilities;
    const votes = raw.knn.votes;
    const k = votes.reduce((a, b) => a + b, 0) || 1;
    return {
      simulated,
      naiveBayes: { prediction: argmax(nbProbs), probabilities: nbProbs },
      knn: { prediction: argmax(votes), votes, k, proportions: votes.map((v) => v / k) },
    };
  }

  function simulate() {
    const list = EXAMPLE_DATA.demoResults;
    const raw = list[scenario % list.length];
    const info = { index: (scenario % list.length) + 1, total: list.length };
    scenario++;
    return Object.assign(normalize(raw, true), { scenario: info });
  }

  async function classify(pixels) {
    if (await ensureModels()) {
      const t0 = performance.now();
      const raw = BrowserModels.classify(pixels);
      return Object.assign(normalize(raw, false), { ms: performance.now() - t0 });
    }
    if (simulationEnabled) return simulate();
    throw new NotAvailableError('Modelos não encontrados.');
  }

  return {
    classify, normalize, ensureModels,
    loadFiles: (files) => BrowserModels.loadFromFiles(files),
    modelsReady: () => BrowserModels.isReady(),
    modelsInfo: () => BrowserModels.info(),
    isSimulated: () => simulationEnabled && !BrowserModels.isReady(),
    setSimulation(on) { simulationEnabled = !!on; },
  };
})();


/* -------------------------------------------------------------------------
   DemoController — interface da demonstração
   ------------------------------------------------------------------------- */
const DemoController = (() => {
  const $ = (id) => document.getElementById(id);
  const DIGITS = ['0', '1', '2', '3', '4', '5', '6', '7', '8', '9'];
  const NB_COLOR = PRESENTATION.theme?.naiveBayes || '#2563eb';
  const KNN_COLOR = PRESENTATION.theme?.knn || '#c084fc';
  let pad;

  function renderCharts(result) {
    const nb = result ? result.naiveBayes.probabilities : Array(10).fill(0);
    const kn = result ? result.knn.proportions : Array(10).fill(0);
    const common = { categories: DIGITS, height: 215, yMax: 1, ticks: 2, labels: 'none' };
    Charts.barChart($('nb-demo-chart'), {
      ...common,
      series: [{ name: 'Probabilidade', color: NB_COLOR, values: nb }],
      highlight: result ? { index: result.naiveBayes.prediction } : null,
      categoryTitle: (c) => `Dígito ${c}`,
      format: (v, d = 0) => Charts.pct(v, d),
    });
    Charts.barChart($('knn-demo-chart'), {
      ...common,
      series: [{ name: 'Votos', color: KNN_COLOR, values: kn }],
      highlight: result ? { index: result.knn.prediction } : null,
      categoryTitle: (c) => `Dígito ${c}`,
      format: (v, d = 0) => Charts.pct(v, d),
    });
  }

  function renderResult(result) {
    const nb = result?.naiveBayes, kn = result?.knn;
    const simTag = result?.simulated ? ' · simulado' : '';
    $('nb-pred').textContent = nb ? nb.prediction : '?';
    $('knn-pred').textContent = kn ? kn.prediction : '?';
    $('nb-pred').classList.toggle('is-empty', !nb);
    $('knn-pred').classList.toggle('is-empty', !kn);
    $('nb-conf').textContent = nb ? `P = ${Charts.pct(nb.probabilities[nb.prediction])}${simTag}` : ' ';
    $('knn-conf').textContent = kn ? `${fmtVotes(kn.votes[kn.prediction])} de ${fmtVotes(kn.k)} ${kn.k === 1 ? 'vizinho' : 'vizinhos'}${simTag}` : ' ';
    renderCharts(result);

    if (!result) {
      setStatus('waiting', 'Aguardando', 'Desenhe um dígito e clique em <strong>Classificar</strong>.');
      return;
    }
    const info = ClassifierService.modelsInfo();
    const sim = result.simulated
      ? `<br><span class="muted">Cenário simulado ${result.scenario.index} de ${result.scenario.total}</span>`
      : info ? `<br><span class="muted">${modelsLabel(info)} · ${Math.round(result.ms)} ms</span>` : '';
    if (nb.prediction === kn.prediction) {
      setStatus('agree', 'Concordaram', `Os dois classificadores previram <strong>${nb.prediction}</strong>.${sim}`);
    } else {
      setStatus('diverge', 'Divergiram',
        `Naive Bayes previu <strong>${nb.prediction}</strong> e KNN previu <strong>${kn.prediction}</strong>.${sim}`);
    }
  }

  // votos podem ser pesos (weights='distance'): mostra inteiro quando for inteiro
  const fmtVotes = (v) => (Number.isInteger(v) ? v : v.toFixed(2).replace('.', ','));
  const modelsLabel = (i) =>
    `${i.nb} · KNN K = ${i.k}, ${i.metric} · ${i.n.toLocaleString('pt-BR')} exemplos · rodando no navegador`;

  function showUnavailable() {
    setStatus('off', 'Sem modelos',
      'Modelos não encontrados em <code>models/</code>. ' +
      '<button type="button" class="link-btn" id="btn-pick-models">Selecionar arquivos</button>');
    $('btn-pick-models').addEventListener('click', () => $('models-input').click());
  }

  async function loadPickedFiles(files) {
    setStatus('waiting', 'Carregando', 'Carregando modelos…');
    try {
      await ClassifierService.loadFiles(files);
      $('sim-banner').classList.toggle('is-hidden', !ClassifierService.isSimulated());
      setStatus('waiting', 'Pronto', `Modelos carregados: ${modelsLabel(ClassifierService.modelsInfo())}.`);
    } catch (err) {
      setStatus('off', 'Erro', `Não foi possível carregar: ${err.message}`);
    }
  }

  // Ao abrir o slide da demonstração, já tenta carregar os modelos.
  async function onShow() {
    if (ClassifierService.modelsReady()) return;
    const ok = await ClassifierService.ensureModels();
    $('sim-banner').classList.toggle('is-hidden', !ClassifierService.isSimulated());
    if (ok) setStatus('waiting', 'Pronto', `Modelos carregados: ${modelsLabel(ClassifierService.modelsInfo())}.`);
  }

  function setStatus(kind, label, html) {
    const pill = $('agree-pill');
    pill.className = `pill pill--${kind}`;
    pill.textContent = label;
    $('agree-text').innerHTML = html;
  }

  function updatePreview() {
    const px = pad.getPixels();
    const prev = $('preview-canvas');
    if (px) Charts.drawPixels(prev, px, { max: 255 });
    else { const c = prev.getContext('2d'); c.fillStyle = '#000'; c.fillRect(0, 0, prev.width, prev.height); }
    $('btn-classify').disabled = !px;
  }

  async function classify() {
    const pixels = pad.getPixels();
    if (!pixels) return;
    try {
      if (!ClassifierService.modelsReady()) setStatus('waiting', 'Carregando', 'Carregando modelos…');
      renderResult(await ClassifierService.classify(Array.from(pixels)));
    } catch (err) {
      renderResult(null);
      if (err instanceof NotAvailableError) showUnavailable();
      else setStatus('off', 'Erro', `Erro ao classificar: ${err.message}`);
    }
  }

  // Chamado pelo botão "Dados fictícios" da barra inferior.
  function setExamples(on) {
    ClassifierService.setSimulation(on);
    $('sim-banner').classList.toggle('is-hidden', !ClassifierService.isSimulated());
    renderResult(null);
  }

  function init() {
    pad = new DrawingPad($('draw-canvas'), { onStrokeEnd: updatePreview });

    const size = $('brush-size');
    pad.setBrush(size.value);
    size.addEventListener('input', () => { pad.setBrush(size.value); $('brush-size-value').textContent = size.value; });

    $('btn-clear').addEventListener('click', () => { pad.clear(); updatePreview(); renderResult(null); });
    $('btn-classify').addEventListener('click', classify);
    $('models-input').addEventListener('change', (e) => { if (e.target.files.length) loadPickedFiles(e.target.files); });

    updatePreview();
    renderResult(null);
  }

  return { init, setExamples, onShow };
})();
