# Machine Learning: Naive Bayes e K-NN para o dataset MNIST

**Integrantes:** Enzo Rocha, Giovana Leite, Rafael Oliveira

## Como rodar

1. Instale as dependências:
   ```bash
   pip install -r requirements.txt
   ```
2. Coloque `mnist_train.csv` e `mnist_test.csv` dentro da pasta `data/`.
3. Rode os classificadores a partir da raiz do projeto (os relatórios são salvos em `reports/`):
   ```bash
   python src/nb.py
   python src/knn.py
   ```
4. Abra a apresentação com o teste ao vivo:
   ```bash
   cd presentation
   python -m http.server 8000
   ```
   Depois acesse **http://localhost:8000** no navegador.

## Motivação

O **MNIST** é um conjunto de dados composto por imagens de dígitos manuscritos, representadas em escala de cinza e com resolução de 28 × 28 pixels.

- **Objetivo:** desenvolver classificadores supervisionados capazes de reconhecer dígitos de 0 a 9, comparando o desempenho dos algoritmos Naive Bayes e K-Nearest Neighbors (KNN).
- **Restrição metodológica:** utilizar diretamente os valores dos pixels como atributos de entrada, sem técnicas de pré-processamento ou extração de características.

## Metodologia

- **Divisão dos dados:** os 60.000 exemplos de treinamento do MNIST foram divididos em 70 % para treinamento (42.000 imagens) e 30 % para validação (18.000 imagens), com `train_test_split` e `random_state=29`.
- **Fluxo de decisão:** o conjunto de validação foi usado exclusivamente para avaliar os modelos e orientar as escolhas de projeto: a distribuição de probabilidade do Naive Bayes, a métrica de distância e os hiperparâmetros do KNN.
- **Conjunto de teste:** os 10.000 exemplos de teste foram reservados para a avaliação final, sendo usados na geração das matrizes de confusão e no cálculo das taxas de erro.

## Investigação de hiperparâmetros

### Naive Bayes

| Distribuição | Acurácia no treino | Acurácia na validação | Tempo (s) |
|---|---:|---:|---:|
| GaussianNB | 0,5817 | 0,5802 | 3,216 |
| MultinomialNB | 0,8263 | 0,8205 | 1,133 |
| **BernoulliNB** | **0,8324** | **0,8269** | **1,885** |

### KNN

Acurácia no conjunto de validação:

| K | Euclidiana | Minkowski | Manhattan |
|---|---:|---:|---:|
| 1 | 0,9711 | 0,9711 | 0,9641 |
| 2 | 0,9642 | 0,9642 | 0,9547 |
| **3** | **0,9712** | **0,9712** | 0,9644 |
| 4 | 0,9701 | 0,9701 | 0,9638 |

Tempo de execução (s):

| K | Euclidiana | Minkowski | Manhattan |
|---|---:|---:|---:|
| 1 | 48,371 | 38,337 | 477,727 |
| 2 | 39,769 | 38,269 | 480,932 |
| 3 | 37,867 | 37,774 | 474,206 |
| 4 | 40,169 | 38,983 | 477,621 |

## Modelos finais

- **Naive Bayes:** implementado em scikit-learn (Python) com a distribuição de **Bernoulli** (`BernoulliNB`).
- **KNN:** implementado em scikit-learn (Python) com **K = 3** (3 vizinhos) e métrica de distância **Minkowski** (`KNeighborsClassifier(n_neighbors=3, metric='minkowski')`).

## Conclusão

### Taxa de erro no conjunto de teste

| Taxa de erro | 0 | 1 | 2 | 3 | 4 | 5 | 6 | 7 | 8 | 9 | Total |
|---|---:|---:|---:|---:|---:|---:|---:|---:|---:|---:|---:|
| NB | 9,59 % | 4,14 % | 17,34 % | 16,44 % | 19,45 % | 29,60 % | 11,27 % | 15,18 % | 22,07 % | 16,65 % | **15,88 %** |
| KNN | 0,51 % | 0,35 % | 3,97 % | 3,47 % | 4,58 % | 3,70 % | 1,57 % | 4,09 % | 7,49 % | 4,76 % | **3,41 %** |

### Matriz de confusão: KNN

| KNN | 0 | 1 | 2 | 3 | 4 | 5 | 6 | 7 | 8 | 9 |
|---|---:|---:|---:|---:|---:|---:|---:|---:|---:|---:|
| **0** | 975 | 1 | 1 | 0 | 0 | 0 | 1 | 1 | 1 | 0 |
| **1** | 0 | 1131 | 2 | 0 | 0 | 0 | 2 | 0 | 0 | 0 |
| **2** | 11 | 9 | 991 | 3 | 1 | 0 | 0 | 15 | 2 | 0 |
| **3** | 0 | 2 | 4 | 975 | 1 | 16 | 1 | 6 | 3 | 2 |
| **4** | 2 | 8 | 0 | 0 | 937 | 0 | 6 | 3 | 0 | 26 |
| **5** | 7 | 1 | 0 | 11 | 2 | 859 | 4 | 1 | 1 | 6 |
| **6** | 6 | 4 | 0 | 0 | 2 | 2 | 943 | 0 | 1 | 0 |
| **7** | 0 | 23 | 5 | 1 | 3 | 0 | 0 | 986 | 0 | 10 |
| **8** | 8 | 4 | 6 | 18 | 5 | 19 | 2 | 5 | 901 | 6 |
| **9** | 6 | 6 | 3 | 8 | 8 | 1 | 1 | 14 | 1 | 961 |

### Matriz de confusão: Naive Bayes

| NB | 0 | 1 | 2 | 3 | 4 | 5 | 6 | 7 | 8 | 9 |
|---|---:|---:|---:|---:|---:|---:|---:|---:|---:|---:|
| **0** | 886 | 0 | 4 | 7 | 2 | 43 | 16 | 1 | 21 | 0 |
| **1** | 0 | 1088 | 10 | 5 | 0 | 7 | 6 | 0 | 19 | 0 |
| **2** | 19 | 8 | 853 | 28 | 17 | 4 | 32 | 14 | 55 | 2 |
| **3** | 5 | 16 | 33 | 844 | 0 | 12 | 9 | 15 | 50 | 26 |
| **4** | 2 | 6 | 4 | 0 | 791 | 4 | 21 | 1 | 23 | 130 |
| **5** | 23 | 14 | 5 | 129 | 30 | 628 | 16 | 7 | 20 | 20 |
| **6** | 19 | 18 | 15 | 2 | 13 | 35 | 850 | 0 | 6 | 0 |
| **7** | 1 | 24 | 14 | 4 | 14 | 0 | 0 | 872 | 27 | 72 |
| **8** | 16 | 22 | 13 | 74 | 17 | 23 | 7 | 6 | 759 | 37 |
| **9** | 9 | 13 | 5 | 10 | 76 | 7 | 0 | 23 | 25 | 841 |

## Teste ao vivo

A pasta `presentation/` contém uma demonstração interativa em que se desenha um dígito e os dois classificadores o reconhecem.
