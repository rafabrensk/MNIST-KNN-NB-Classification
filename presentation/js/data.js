/* ==========================================================================
   data.js — CONTEÚDO EDITÁVEL DA APRESENTAÇÃO
   --------------------------------------------------------------------------
   Único arquivo a alterar para atualizar textos e resultados.
   Os títulos fixos dos slides estão em index.html.
   ========================================================================== */

const PRESENTATION = {

  /* Cores dos modelos em toda a apresentação (gráficos, matrizes, legendas).
     O restante da interface é preto, branco e cinza. */
  theme: {
    naiveBayes: '#1c60f2',      // azul
    knn:        '#8a21f4',      // roxo
  },

  /* Logos: grandes na capa e no último slide, pequenos no canto dos demais. */
  logos: {
    onAllSlides: true,
    images: [
      { src: 'assets/images/logo-usp.png', alt: 'Universidade de São Paulo' },
      { src: 'assets/images/logo-dcm.png', alt: 'DCM' },
    ],
  },

  /* Capa */
  meta: {
    title: 'Demonstração interativa: Classificação de Dígitos do MNIST usando Naive Bayes e KNN',
    course: 'Inteligência Artificial',
  },

  /* Integrantes: aparecem no rodapé do último slide, em ordem alfabética. */
  members: [
    { name: 'Enzo Rocha' },
    { name: 'Giovana Leite' },
    { name: 'Rafael Oliveira' },
  ],

  /* Matrizes de confusão no TESTE (10.000 imagens), 10 × 10.
     Linha = classe real · Coluna = classe prevista.
     As taxas de erro e as maiores confusões são calculadas daqui. */
  // reports/NB_report_case_final.txt (BernoulliNB) e reports/KNN_report_case_final.txt (K = 3)
  confusion: {
    naiveBayes: [
      [ 886,    0,    4,    7,    2,   43,   16,    1,   21,    0],
      [   0, 1088,   10,    5,    0,    7,    6,    0,   19,    0],
      [  19,    8,  853,   28,   17,    4,   32,   14,   55,    2],
      [   5,   16,   33,  844,    0,   12,    9,   15,   50,   26],
      [   2,    6,    4,    0,  791,    4,   21,    1,   23,  130],
      [  23,   14,    5,  129,   30,  628,   16,    7,   20,   20],
      [  19,   18,   15,    2,   13,   35,  850,    0,    6,    0],
      [   1,   24,   14,    4,   14,    0,    0,  872,   27,   72],
      [  16,   22,   13,   74,   17,   23,    7,    6,  759,   37],
      [   9,   13,    5,   10,   76,    7,    0,   23,   25,  841],
    ],
    knn: [
      [ 975,    1,    1,    0,    0,    0,    1,    1,    1,    0],
      [   0, 1131,    2,    0,    0,    0,    2,    0,    0,    0],
      [  11,    9,  991,    3,    1,    0,    0,   15,    2,    0],
      [   0,    2,    4,  975,    1,   16,    1,    6,    3,    2],
      [   2,    8,    0,    0,  937,    0,    6,    3,    0,   26],
      [   7,    1,    0,   11,    2,  859,    4,    1,    1,    6],
      [   6,    4,    0,    0,    2,    2,  943,    0,    1,    0],
      [   0,   23,    5,    1,    3,    0,    0,  986,    0,   10],
      [   8,    4,    6,   18,    5,   19,    2,    5,  901,    6],
      [   6,    6,    3,    8,    8,    1,    1,   14,    1,  961],
    ],
  },

  /* Último slide */
  thanks: {
    title: 'Estamos abertos para dúvidas. Obrigado!',
  },

  /* Demonstração: pasta com os arquivos gerados por src/export_web_models.py */
  demo: {
    modelsPath: 'models/',
  },
};


/* ==========================================================================
   RESULTADOS SIMULADOS da demonstração — usados só quando os modelos não
   são encontrados e o botão "Dados fictícios" (ou "Simular") está ligado.
   Não representam previsões reais.
   probabilities: 10 valores (soma 1) · votes: 10 contagens (soma = k)
   ========================================================================== */
const EXAMPLE_DATA = {
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
