# Classificação de Dígitos MNIST

## Objetivo

Este projeto tem como objetivo implementar e comparar dois algoritmos de aprendizado de máquina, **Naive Bayes** e **K-Nearest Neighbors (KNN)**, na classificação de dígitos manuscritos utilizando a base de dados MNIST.

A comparação busca avaliar o desempenho dos algoritmos na identificação dos números de 0 a 9, analisando seus resultados e os erros cometidos durante a classificação.

## Estrutura do projeto

```
MNIST-KNN-NB-Classification/
├── data/                   # Arquivos da base MNIST (não versionados)
├── reports/                # Resultados e relatórios gerados
├── src/
│   ├── knn.py              # Classificador K-Nearest Neighbors
│   ├── nb.py               # Classificador Naive Bayes
│   └── export_web_models.py # Exporta os modelos para rodarem na apresentação
├── presentation/           # Apresentação em slides (HTML, CSS e JS)
├── generate_mnist_csv.py   # Converte os arquivos IDX do MNIST para CSV
├── requirements.txt
└── README.md
```

## Como executar

### 1. Clone o repositório

```bash
git clone https://github.com/rafabrensk/MNIST-KNN-NB-Classification.git
cd MNIST-KNN-NB-Classification
```

### 2. Crie e ative um ambiente virtual

```bash
python -m venv .venv
```

Windows:
```bash
.venv\Scripts\activate
```

Linux/macOS:
```bash
source .venv/bin/activate
```

### 3. Instale as dependências

```bash
pip install -r requirements.txt
```

### 4. Prepare a base de dados

A pasta `data/` não é versionada. Baixe os quatro arquivos originais do MNIST (formato IDX, descompactados) e coloque-os em `data/`:

- `train-images.idx3-ubyte`
- `train-labels.idx1-ubyte`
- `t10k-images.idx3-ubyte`
- `t10k-labels.idx1-ubyte`

Em seguida, gere os arquivos CSV executando o script de conversão a partir da pasta `data/`:

```bash
cd data
python ../generate_mnist_csv.py
cd ..
```

Serão criados `data/mnist_train.csv` (60.000 amostras) e `data/mnist_test.csv` (10.000 amostras). Em cada linha, a primeira coluna é o rótulo (0–9) e as 784 colunas seguintes são os pixels da imagem 28×28.

### 5. Execute os classificadores

Os scripts devem ser executados a partir da raiz do repositório:

```bash
python src/nb.py
python src/knn.py
```

## Resultados

### 1. Matriz de confusão

**Naive Bayes**

| Classe real / Predita | 0 | 1 | 2 | 3 | 4 | 5 | 6 | 7 | 8 | 9 |
|---|---|---|---|---|---|---|---|---|---|---|
| 0 | | | | | | | | | | |
| 1 | | | | | | | | | | |
| 2 | | | | | | | | | | |
| 3 | | | | | | | | | | |
| 4 | | | | | | | | | | |
| 5 | | | | | | | | | | |
| 6 | | | | | | | | | | |
| 7 | | | | | | | | | | |
| 8 | | | | | | | | | | |
| 9 | | | | | | | | | | |

**K-Nearest Neighbors (KNN)**

| Classe real / Predita | 0 | 1 | 2 | 3 | 4 | 5 | 6 | 7 | 8 | 9 |
|---|---|---|---|---|---|---|---|---|---|---|
| 0 | | | | | | | | | | |
| 1 | | | | | | | | | | |
| 2 | | | | | | | | | | |
| 3 | | | | | | | | | | |
| 4 | | | | | | | | | | |
| 5 | | | | | | | | | | |
| 6 | | | | | | | | | | |
| 7 | | | | | | | | | | |
| 8 | | | | | | | | | | |
| 9 | | | | | | | | | | |

### 2. Taxa de erro por classe e geral

| Classe | Erro Naive Bayes | Erro KNN |
|---|---:|---:|
| 0 | | |
| 1 | | |
| 2 | | |
| 3 | | |
| 4 | | |
| 5 | | |
| 6 | | |
| 7 | | |
| 8 | | |
| 9 | | |
| **Geral** | | |

### 3. Configurações utilizadas

**Naive Bayes**

- Distribuição utilizada: Gaussiana (`GaussianNB`)
- Justificativa da escolha:
- Biblioteca/implementação: scikit-learn (`sklearn.naive_bayes.GaussianNB`)

**KNN**

- Valor de K: 3
- Métrica de distância: Euclidiana
- Justificativa das escolhas:
- Biblioteca/implementação: scikit-learn (`sklearn.neighbors.KNeighborsClassifier`)

### 4. Conclusões

*Preencher com a análise comparativa dos resultados, destacando o desempenho dos algoritmos, suas diferenças e possíveis dificuldades na classificação dos dígitos.*

## Apresentação

A pasta `presentation/` contém os slides do trabalho em HTML, CSS e JavaScript puro, sem frameworks nem backend. São 9 slides de conteúdo e uma demonstração interativa em que se desenha um dígito e os dois classificadores o reconhecem.

### Como abrir

Abra `presentation/index.html` no navegador. Funciona direto do arquivo, sem servidor.

### Navegação

| Tecla | Ação |
|---|---|
| → ↓ Espaço PageDown | próximo slide |
| ← ↑ PageUp | slide anterior |
| Home / End | primeiro / último slide |
| D | demonstração interativa |
| F | tela cheia |
| P | exportar PDF |

- A barra inferior (navegação, **Dados fictícios** e **Exportar PDF**) aparece só fora da tela cheia.
- O endereço guarda o slide atual (`index.html#6`).

### Exportar em PDF

O botão **Exportar PDF** (ou a tecla P) abre a impressão do navegador. Escolha **Salvar como PDF** como destino. Cada slide vira uma página 16:9; a demonstração interativa fica de fora. O PDF sai com os dados que estiverem na tela, então confira o botão **Dados fictícios** antes de exportar.

### Dados fictícios

O botão **Dados fictícios**, na barra inferior, serve para visualizar o layout antes de haver resultados:

- **Desligado (padrão):** blocos sem resultados reais aparecem vazios ("Aguardando resultados").
- **Ligado:** blocos ainda sem dados reais recebem valores fictícios, marcados com o selo amarelo **Dados de exemplo**. Se os modelos não estiverem disponíveis, a demonstração mostra resultados **simulados**.

Os valores fictícios não representam resultados dos modelos.

### Como atualizar o conteúdo

Todo o conteúdo variável fica em **`presentation/js/data.js`**:

| Seção em `data.js` | Slide | O que preencher |
|---|---|---|
| `theme` | todos | cores dos modelos (Naive Bayes e KNN) |
| `meta`, `members` | 1 | título, instituição e integrantes (ordenados automaticamente) |
| `dataset.sampleImages` | 2 | PNGs reais do MNIST em `assets/images/` (opcional) |
| `split` | 3 | proporção treino/validação |
| `naiveBayes` | 4 | distribuição escolhida, justificativa e erro na validação |
| `knn` | 5 | métrica, K, justificativa e erro na validação por K e métrica |
| `confusion` | 6, 7, 9 | matrizes de confusão 10 × 10 do teste |
| `extras` | 8 | análises extras (`enabled: true` para exibir) |
| `conclusions` | 9 | textos das conclusões |
| `demo` | 10 | pasta dos modelos exportados (`models/`) |

- Valores `null` aparecem no slide como **[a preencher]**.
- Os dados fictícios ficam separados, em `EXAMPLE_DATA`, no fim do arquivo. Eles são usados só onde o dado real ainda está vazio.
- A partir das matrizes de confusão, a apresentação calcula sozinha:
  - as taxas de erro (slide 7);
  - as confusões mais frequentes (slide 6);
  - o melhor classificador (slide 9).
- Os textos fixos (títulos e tópicos) estão em `index.html`.

### Estrutura

```
presentation/
├── index.html
├── css/style.css          # estilo (interface em preto, branco e cinza)
├── js/
│   ├── data.js            # conteúdo editável e dados fictícios
│   ├── charts.js          # gráficos SVG, matrizes de confusão e imagens 28×28
│   ├── models.js          # Naive Bayes e KNN rodando no navegador
│   ├── drawing.js         # canvas de desenho e ClassifierService
│   └── presentation.js    # montagem dos slides e navegação
├── models/                # modelos exportados (gerados pelo script abaixo)
└── assets/images/
```

### Modelos na demonstração

A demonstração classifica o desenho com os modelos reais, **rodando no próprio navegador**, sem servidor Python. O navegador não lê `.pkl`, por isso os parâmetros dos modelos são exportados para arquivos simples:

```bash
python src/export_web_models.py --nb bernoulli --k 1 --metric euclidean
```

- O script treina com os 60.000 exemplos de `data/mnist_train.csv` e grava em `presentation/models/`:
  - `naive_bayes.json`: parâmetros do Naive Bayes;
  - `knn.json`: K e métrica;
  - `knn_train.bin.gz`: imagens de treino compactadas, usadas pelo KNN.
- Troque `--nb`, `--k` e `--metric` pela configuração escolhida na validação. Para exportar modelos já salvos, use `--nb-pkl` e `--knn-pkl`.
- As contas em `js/models.js` reproduzem as do scikit-learn: o Naive Bayes dá as mesmas probabilidades e o KNN os mesmos votos.

Quando a apresentação é publicada (GitHub Pages, por exemplo), os modelos são carregados sozinhos ao abrir a demonstração. Abrindo o `index.html` direto do disco, o navegador bloqueia essa leitura automática. Nesse caso, clique em **Selecionar arquivos** na demonstração e escolha os três arquivos de `presentation/models/`.

`DrawingPad.getPixels()` entrega os 784 pixels (0–255) no formato do MNIST: o dígito é redimensionado para caber em 20 × 20 e centralizado pelo centro de massa numa imagem 28 × 28.
