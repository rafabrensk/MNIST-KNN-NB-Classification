/* ==========================================================================
   data.js — CONTEÚDO EDITÁVEL DA APRESENTAÇÃO
   --------------------------------------------------------------------------
   Este é o único arquivo que precisa ser alterado para atualizar a
   apresentação com os resultados reais.

   • PRESENTATION   → dados REAIS. null / vazio aparece no slide como
                      "[a preencher]" ou como área "Aguardando resultados".
   • EXAMPLE_DATA   → dados FICTÍCIOS. Só são usados quando o botão
                      "Dados fictícios" (barra inferior) está ligado, e
                      apenas onde o dado real ainda está vazio. Cada bloco
                      fictício recebe o selo amarelo "Dados de exemplo".

   Todas as taxas são frações (0.034 = 3,4 %).
   Os textos explicativos fixos (títulos, tópicos) estão em index.html.
   ========================================================================== */

const PRESENTATION = {

  /* ---------------------------------------------------------------- Cores
     Cores dos modelos em toda a apresentação (gráficos, matrizes, legendas).
     O restante da interface é preto, branco e cinza. */
  theme: {
    naiveBayes: '#1c60f2',      // azul
    knn:        '#8a21f4',      // roxo
  },

  /* ---------------------------------------------------------------- Logos
     Aparecem grandes no slide de título e pequenos no canto superior
     direito dos demais (onAllSlides: false → só no título). */
  logos: {
    onAllSlides: true,
    images: [
      { src: 'assets/images/logo-usp.png', alt: 'Universidade de São Paulo' },
      { src: 'assets/images/logo-dcm.png', alt: 'DCM' },
    ],
  },

  /* ---------------------------------------------------------------- Slide 1 */
  meta: {
    title: 'Classificação de Dígitos do MNIST usando Naive Bayes e KNN',
    course: 'Inteligência Artificial',
    institution: 'Universidade de São Paulo - USP',
  },

  // Os integrantes são ordenados alfabeticamente automaticamente.
  members: [
    { name: 'Enzo Rocha',    nusp: '15449850' },
    { name: 'Giovana Leite', nusp: '16869044' },
    { name: 'Rafael Silva',  nusp: '17152206' },
  ],

  /* ---------------------------------------------------------------- Slide 2 */
  dataset: {
    trainSize: 60000,
    testSize: 10000,
    // PNGs reais do MNIST em assets/images/ (um por dígito, ordem 0–9).
    // Vazio → ilustração gerada no navegador.
    sampleImages: [],
  },

  /* ---------------------------------------------------------------- Slide 3 */
  split: {
    // src/nb.py e src/knn.py: train_test_split(test_size=0.3, random_state=29)
    trainPercent: 70,
    validationPercent: 30,
    strategy: 'random_state = 29',
  },

  /* ---------------------------------------------------------------- Slide 4 */
  naiveBayes: {
    implementation: 'scikit-learn (sklearn.naive_bayes)',
    // Nome igual a um dos itens de validation. null → nenhuma destacada.
    chosen: null,
    justification: null,
    // Taxa de erro na validação (1 − acurácia) — reports/NB_report_case_1..3.txt
    validation: [
      { name: 'GaussianNB',    value: 0.4198 },   // acurácia 0,5802
      { name: 'MultinomialNB', value: 0.1795 },   // acurácia 0,8205
      { name: 'BernoulliNB',   value: 0.1731 },   // acurácia 0,8269
    ],
  },

  /* ---------------------------------------------------------------- Slide 5 */
  knn: {
    implementation: 'scikit-learn (KNeighborsClassifier)',
    metric: null,               // ex.: 'Euclidiana'
    k: null,                    // ex.: 3
    justification: null,
    // Taxa de erro na validação para cada K (colunas) e métrica (séries).
    // K = 1, Euclidiana: reports/KNN_report_case_teste.txt (acurácia 0,9711)
    validation: {
      kValues: [1, 3, 5, 7, 9],
      series: [
        { name: 'Euclidiana', values: [0.0289, null, null, null, null] },
        { name: 'Manhattan',  values: [null, null, null, null, null] },
      ],
    },
  },

  /* ------------------------------------------------------- Slides 6, 7 e 9
     Matrizes de confusão no TESTE (10.000 imagens), 10 × 10.
     Linha = classe real · Coluna = classe prevista.
     As taxas de erro e as conclusões automáticas são calculadas daqui. */
  confusion: {
    naiveBayes: null,
    knn: null,
  },

  /* ---------------------------------------------------------------- Slide 8
     Cada análise extra vira uma aba. enabled: false → a aba não aparece. */
  extras: {
    distanceComparison: { enabled: true,  note: null },              // usa knn.validation
    pixelMeans:         { enabled: false, data: null, note: null },  // 10 × 784
    pixelVariances:     { enabled: false, data: null, note: null },  // 10 × 784
    misclassified:      { enabled: false, items: [], note: null },
    // item: { image: 'assets/images/erro_01.png', trueLabel: 4, nb: 9, knn: 4 }
    knnExamples:        { enabled: false, items: [], note: null },
    // item: { query: 'assets/images/q1.png', label: 3,
    //         neighbors: [{ image: 'assets/images/q1_n1.png', label: 3 }, ...] }
  },

  /* ---------------------------------------------------------------- Slide 9
     Itens null aparecem como "[a preencher]".
     auto: 'comparison' | 'best' → valores calculados das matrizes. */
  conclusions: [
    { title: 'Comparação final', auto: 'comparison', items: [null] },
    { title: 'Melhor desempenho', auto: 'best', items: [null] },
    {
      title: 'Distribuição e métrica',
      items: [
        null,   // influência da distribuição no Naive Bayes
        null,   // influência da métrica de distância no KNN
      ],
    },
    {
      title: 'Processamento',
      items: [
        'Naive Bayes: treino rápido, só estima médias e variâncias.',
        'KNN: não treina; cada previsão compara com 60.000 imagens.',
      ],
    },
    {
      title: 'Limitações',
      items: [null, null],
    },
    {
      title: 'Com pré-processamento',
      items: [
        'Corrigir inclinação e normalizar o traço.',
        'Reduzir dimensões (PCA).',
      ],
    },
  ],

  /* ---------------------------------------------------------------- Obrigado
     Último slide. Mostra também os logos e os integrantes. */
  thanks: {
    title: 'Obrigado!',
    subtitle: 'Perguntas?',
  },

  /* --------------------------------------------------------------- Demo
     Os modelos rodam no navegador a partir dos arquivos gerados por
     src/export_web_models.py nesta pasta. Sem eles, "Classificar" só
     responde com "Dados fictícios" ligado (resultados simulados). */
  demo: {
    modelsPath: 'models/',
  },
};


/* ==========================================================================
   DADOS FICTÍCIOS — apenas para visualizar o layout.
   Não representam resultados reais dos modelos.
   ========================================================================== */
const EXAMPLE_DATA = {
  naiveBayesValidation: [
    { name: 'GaussianNB',    value: 0.44 },
    { name: 'MultinomialNB', value: 0.18 },
    { name: 'BernoulliNB',   value: 0.16 },
  ],
  knnValidation: [
    { name: 'Euclidiana', values: [0.032, 0.030, 0.031, 0.032, 0.034] },
    { name: 'Manhattan',  values: [0.037, 0.036, 0.037, 0.038, 0.040] },
  ],
  confusion: {
    naiveBayes: [
      [ 882,    4,    7,    7,    4,    8,   51,    5,    4,    8],
      [   2, 1078,    3,    6,    3,    4,    5,   28,    3,    3],
      [  21,   18,  619,    9,   21,   13,   20,  207,   80,   24],
      [  18,   18,   13,  656,   11,  171,   16,   19,   72,   16],
      [  24,   25,   26,   21,  540,   25,   38,   28,   36,  219],
      [  37,   19,   19,  264,   22,  357,   33,   18,  101,   22],
      [  49,    6,    4,    3,    3,   18,  862,    3,    7,    3],
      [  16,    9,   57,   10,   15,   14,   13,  720,   19,  155],
      [  20,   18,   21,  242,   28,   98,   17,   22,  487,   21],
      [  10,   16,   17,    9,  122,    6,   11,   50,   11,  757],
    ],
    knn: [
      [ 972,    0,    1,    1,    0,    1,    4,    1,    0,    0],
      [   1, 1130,    1,    0,    0,    0,    0,    3,    0,    0],
      [   1,    2,  996,    1,    1,    1,    3,   15,    9,    3],
      [   0,    5,    3,  975,    2,   14,    1,    1,    7,    2],
      [   3,    1,    5,    1,  948,    1,    2,    3,    4,   14],
      [   1,    1,    0,   15,    1,  861,    1,    3,    5,    4],
      [   7,    0,    1,    1,    0,    2,  944,    0,    1,    2],
      [   4,    0,    9,    3,    2,    2,    1,  987,    4,   16],
      [   0,    3,    2,   28,    2,   10,    2,    3,  920,    4],
      [   0,    3,    2,    2,   19,    1,    7,    9,    2,  964],
    ],
  },
  // Médias e variâncias por classe são geradas como ilustração sintética.
  syntheticPixelStats: true,

  // Resultados SIMULADOS da demonstração (um cenário por clique).
  // probabilities: 10 valores (soma 1) · votes: 10 contagens (soma = k).
  demoResults: [
    { naiveBayes: { probabilities: [0.01, 0.00, 0.02, 0.71, 0.00, 0.18, 0.00, 0.01, 0.07, 0.00] },
      knn:        { votes: [0, 0, 0, 5, 0, 0, 0, 0, 0, 0] } },
    { naiveBayes: { probabilities: [0.00, 0.00, 0.00, 0.02, 0.38, 0.01, 0.00, 0.04, 0.02, 0.53] },
      knn:        { votes: [0, 0, 0, 0, 4, 0, 0, 0, 0, 1] } },
    { naiveBayes: { probabilities: [0.00, 0.02, 0.04, 0.01, 0.00, 0.00, 0.00, 0.88, 0.01, 0.04] },
      knn:        { votes: [0, 0, 1, 0, 0, 0, 0, 4, 0, 0] } },
    { naiveBayes: { probabilities: [0.03, 0.00, 0.01, 0.31, 0.00, 0.12, 0.00, 0.00, 0.52, 0.01] },
      knn:        { votes: [0, 0, 0, 2, 0, 0, 0, 0, 3, 0] } },
  ],
};
