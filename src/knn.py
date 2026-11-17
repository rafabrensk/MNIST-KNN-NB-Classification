import pandas as pd
import time
from sklearn.neighbors import KNeighborsClassifier
from sklearn.metrics import accuracy_score
from sklearn.model_selection import train_test_split

caso = 10

ini_tempo = time.perf_counter()

train_dataset = pd.read_csv("data/mnist_train.csv", header=None)

X_train_full = train_dataset.drop(columns=[0])
Y_train_full = train_dataset.iloc[:, 0]

X_train, X_val, Y_train, Y_val = train_test_split(
    X_train_full, Y_train_full, test_size=0.3, random_state=29
)

model_KNN = KNeighborsClassifier(n_neighbors=1, metric='euclidean')
model_KNN.fit(X_train, Y_train)

results_train = model_KNN.predict(X_train)
results_val = model_KNN.predict(X_val)

train_accuracy = accuracy_score(Y_train, results_train)
val_accuracy = accuracy_score(Y_val, results_val)

fim_tempo = time.perf_counter()

with open(f"reports/KNN_report_case_{caso}.txt", "w") as report_txt:
    report_txt.write(
        f"Relatório KNN para dataset MNIST caso: {caso}\n"
        f"Tempo de execução: {fim_tempo-ini_tempo:.3f} segundos\n"
        f"Acurácia no conjunto de treinamento: {train_accuracy}\n"
        f"Acurácia no conjunto de validação: {val_accuracy:.4f}\n"
        f"Número de vizinhos utilizados: {model_KNN.n_neighbors}\n"
        f"Métrica utilizada: {model_KNN.metric}\n"
    )