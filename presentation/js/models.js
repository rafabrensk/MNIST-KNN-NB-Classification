/* ==========================================================================
   models.js — Naive Bayes e KNN rodando no próprio navegador
   --------------------------------------------------------------------------
   O navegador não lê .pkl. Os parâmetros dos modelos treinados no Python
   são exportados por src/export_web_models.py para a pasta models/:

     models/naive_bayes.json    parâmetros do Naive Bayes (scikit-learn)
     models/knn.json            K, métrica e tamanho do treino
     models/knn_train.bin.gz    imagens (uint8) + rótulos de treino

   As contas abaixo reproduzem as do scikit-learn (predict_proba do
   Naive Bayes e votação dos K vizinhos mais próximos).
   ========================================================================== */

const BrowserModels = (() => {
  const FILES = { nb: 'naive_bayes.json', knn: 'knn.json' };
  let nb = null;
  let knn = null;

  /* ------------------------------------------------------------ Naive Bayes */
  function logSumExp(arr) {
    const m = Math.max(...arr);
    return m + Math.log(arr.reduce((s, v) => s + Math.exp(v - m), 0));
  }

  function prepareNaiveBayes(p) {
    const model = { type: p.type, classes: p.classes, prior: p.class_log_prior };
    if (p.type === 'GaussianNB') {
      // constante -½ Σ log(2π σ²) por classe, calculada uma vez
      model.theta = p.theta;
      model.var = p.var;
      model.logNorm = p.var.map((v) => -0.5 * v.reduce((s, x) => s + Math.log(2 * Math.PI * x), 0));
    } else if (p.type === 'MultinomialNB') {
      model.flp = p.feature_log_prob;
    } else if (p.type === 'BernoulliNB') {
      model.binarize = p.binarize;
      // log(1 − p) e (log p − log(1 − p)) por pixel
      model.neg = p.feature_log_prob.map((row) => row.map((v) => Math.log(1 - Math.exp(v))));
      model.diff = p.feature_log_prob.map((row, c) => row.map((v, i) => v - model.neg[c][i]));
      model.negSum = model.neg.map((row) => row.reduce((s, v) => s + v, 0));
    } else {
      throw new Error(`Naive Bayes não suportado: ${p.type}`);
    }
    return model;
  }

  function naiveBayesJointLogLikelihood(model, x) {
    return model.classes.map((_, c) => {
      let s = model.prior[c];
      if (model.type === 'GaussianNB') {
        const th = model.theta[c], va = model.var[c];
        let q = 0;
        for (let i = 0; i < x.length; i++) { const d = x[i] - th[i]; q += (d * d) / va[i]; }
        s += model.logNorm[c] - 0.5 * q;
      } else if (model.type === 'MultinomialNB') {
        const f = model.flp[c];
        for (let i = 0; i < x.length; i++) s += x[i] * f[i];
      } else {
        const d = model.diff[c];
        const t = model.binarize;
        s += model.negSum[c];
        for (let i = 0; i < x.length; i++) {
          const xi = t == null ? x[i] : (x[i] > t ? 1 : 0);
          s += xi * d[i];
        }
      }
      return s;
    });
  }

  function predictNaiveBayes(x) {
    const jll = naiveBayesJointLogLikelihood(nb, x);
    const lse = logSumExp(jll);
    const probs = jll.map((v) => Math.exp(v - lse));
    // devolve na ordem dos dígitos 0–9
    const out = Array(10).fill(0);
    nb.classes.forEach((cls, c) => { out[cls] = probs[c]; });
    return { probabilities: out };
  }

  /* ------------------------------------------------------------ KNN */
  function distanceFn(metric, p) {
    switch (metric) {
      case 'euclidean': return (a, o, x, n) => { let s = 0; for (let i = 0; i < n; i++) { const d = a[o + i] - x[i]; s += d * d; } return s; };
      case 'manhattan': return (a, o, x, n) => { let s = 0; for (let i = 0; i < n; i++) s += Math.abs(a[o + i] - x[i]); return s; };
      case 'chebyshev': return (a, o, x, n) => { let s = 0; for (let i = 0; i < n; i++) s = Math.max(s, Math.abs(a[o + i] - x[i])); return s; };
      case 'minkowski': return (a, o, x, n) => { let s = 0; for (let i = 0; i < n; i++) s += Math.abs(a[o + i] - x[i]) ** p; return s; };
      default: throw new Error(`Métrica não suportada: ${metric}`);
    }
  }
  // converte a distância "interna" (sem raiz) na distância real, usada nos pesos
  const realDistance = (metric, p, d) =>
    metric === 'euclidean' ? Math.sqrt(d) : metric === 'minkowski' ? d ** (1 / p) : d;

  function predictKnn(x) {
    const { k, metric, p, weights, n, dim, pixels, labels } = knn;
    const dist = distanceFn(metric, p);

    // mantém os K menores (lista ordenada pequena)
    const bestD = new Float64Array(k).fill(Infinity);
    const bestI = new Int32Array(k).fill(-1);
    for (let j = 0; j < n; j++) {
      const d = dist(pixels, j * dim, x, dim);
      if (d >= bestD[k - 1]) continue;
      let pos = k - 1;
      while (pos > 0 && bestD[pos - 1] > d) { bestD[pos] = bestD[pos - 1]; bestI[pos] = bestI[pos - 1]; pos--; }
      bestD[pos] = d; bestI[pos] = j;
    }

    const votes = Array(10).fill(0);
    const neighbors = [];
    for (let r = 0; r < k; r++) {
      const label = labels[bestI[r]];
      const w = weights === 'distance' ? 1 / Math.max(realDistance(metric, p, bestD[r]), 1e-12) : 1;
      votes[label] += w;
      neighbors.push({ index: bestI[r], label, distance: realDistance(metric, p, bestD[r]) });
    }
    return { votes, neighbors };
  }

  /* ------------------------------------------------------------ carregamento */
  async function gunzipIfNeeded(buffer) {
    const bytes = new Uint8Array(buffer);
    if (bytes[0] !== 0x1f || bytes[1] !== 0x8b) return buffer; // já descompactado pelo servidor
    const stream = new Blob([buffer]).stream().pipeThrough(new DecompressionStream('gzip'));
    return new Response(stream).arrayBuffer();
  }

  function setKnn(meta, buffer) {
    const n = meta.n_samples, dim = meta.n_features;
    if (buffer.byteLength !== n * dim + n) throw new Error('knn_train.bin com tamanho inesperado.');
    knn = {
      k: meta.k, metric: meta.metric, p: meta.p || 2, weights: meta.weights || 'uniform',
      n, dim,
      pixels: new Uint8Array(buffer, 0, n * dim),
      labels: new Uint8Array(buffer, n * dim, n), // dígito de cada exemplo
    };
  }

  /** Carrega da pasta models/ (funciona em servidor ou GitHub Pages). */
  async function loadFromUrl(base = 'models/') {
    const get = async (name, type) => {
      const r = await fetch(base + name);
      if (!r.ok) throw new Error(`${name}: ${r.status}`);
      return type === 'json' ? r.json() : r.arrayBuffer();
    };
    const nbParams = await get(FILES.nb, 'json');
    const knnMeta = await get(FILES.knn, 'json');
    const knnData = await gunzipIfNeeded(await get(knnMeta.data_file, 'bin'));
    nb = prepareNaiveBayes(nbParams);
    setKnn(knnMeta, knnData);
  }

  /** Carrega a partir de arquivos escolhidos pelo usuário (abrindo o index.html direto). */
  async function loadFromFiles(fileList) {
    const files = Object.fromEntries([...fileList].map((f) => [f.name, f]));
    const need = (name) => { if (!files[name]) throw new Error(`Arquivo ausente: ${name}`); return files[name]; };
    const nbParams = JSON.parse(await need(FILES.nb).text());
    const knnMeta = JSON.parse(await need(FILES.knn).text());
    const knnData = await gunzipIfNeeded(await need(knnMeta.data_file).arrayBuffer());
    nb = prepareNaiveBayes(nbParams);
    setKnn(knnMeta, knnData);
  }

  return {
    loadFromUrl,
    loadFromFiles,
    isReady: () => !!(nb && knn),
    info: () => (nb && knn ? { nb: nb.type, k: knn.k, metric: knn.metric, n: knn.n } : null),
    /** pixels: 784 inteiros 0–255 → { naiveBayes: { probabilities }, knn: { votes } } */
    classify(pixels) {
      return { naiveBayes: predictNaiveBayes(pixels), knn: predictKnn(pixels) };
    },
  };
})();

if (typeof module !== 'undefined') module.exports = BrowserModels; // testes no Node
