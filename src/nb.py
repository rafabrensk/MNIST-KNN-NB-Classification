import pandas as pd
from sklearn.naive_bayes import GaussianNB

train_dataset = pd.read_csv("data/mnist_train.csv", header=None)
test_dataset = pd.read_csv("data/mnist_test.csv", header=None)

X_train = train_dataset.drop(columns=[0])
Y_train = train_dataset.iloc[:, 0]

X_test = test_dataset.drop(columns=[0])

model_NB = GaussianNB()
model_NB.fit(X_train, Y_train)

results = model_NB.predict(X_test)