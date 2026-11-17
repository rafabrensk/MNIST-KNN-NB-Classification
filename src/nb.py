import pandas as pd
import time
from sklearn.naive_bayes import GaussianNB, MultinomialNB, BernoulliNB
from sklearn.metrics import accuracy_score

caso = 2

ini_tempo = time.perf_counter()

train_dataset = pd.read_csv("data/mnist_train.csv", header=None)
test_dataset = pd.read_csv("data/mnist_test.csv", header=None)

X_train = train_dataset.drop(columns=[0])
Y_train = train_dataset.iloc[:, 0]

X_test = test_dataset.drop(columns=[0])
Y_test = test_dataset.iloc[:, 0]

model_NB = MultinomialNB()
model_NB.fit(X_train, Y_train)

results_train = model_NB.predict(X_train)
results_test = model_NB.predict(X_test)

train_accuracy = accuracy_score(Y_train, results_train)
test_accuracy = accuracy_score(Y_test, results_test)

fim_tempo = time.perf_counter()

with open(f"reports/NB_report_case_{caso}.txt", "w") as report_txt:
    report_txt.write(
        f"Relatório Naive Bayes para dataset MNIST caso: {caso}\n"
        f"Tempo de execução: {fim_tempo-ini_tempo:.3f} segundos\n"
        f"Precisão de acertos no conjunto de treinamento: {train_accuracy}\n"
        f"Precisão de acertos no conjunto de teste: {test_accuracy}\n"
        f"Distribuição utilizada: {type(model_NB).__name__}\n"
    )