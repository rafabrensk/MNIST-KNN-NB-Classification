"""Exporta os classificadores treinados para a demonstração no navegador.

O navegador não lê arquivos .pkl. Este script salva os parâmetros dos
modelos em arquivos simples que o JavaScript da apresentação usa para
classificar o desenho de verdade, sem servidor:

    presentation/models/naive_bayes.json   parâmetros do Naive Bayes
    presentation/models/knn.json           K, métrica e tamanho do treino
    presentation/models/knn_train.bin.gz   imagens e rótulos de treino

Uso (a partir da raiz do repositório):

    # treina com os 60.000 exemplos e a configuração escolhida
    python src/export_web_models.py --nb bernoulli --k 1 --metric euclidean

    # ou exporta modelos já treinados e salvos com joblib/pickle
    python src/export_web_models.py --nb-pkl models/nb.pkl --knn-pkl models/knn.pkl
"""

import argparse
import gzip
import json
import pickle
from pathlib import Path

import numpy as np

NB_CLASSES = {
    "gaussian": "GaussianNB",
    "multinomial": "MultinomialNB",
    "bernoulli": "BernoulliNB",
}
OUT_DEFAULT = Path("presentation/models")


def load_pickle(path):
    try:
        import joblib
        return joblib.load(path)
    except Exception:
        with open(path, "rb") as f:
            return pickle.load(f)


def load_train(csv_path):
    import pandas as pd
    data = pd.read_csv(csv_path, header=None).to_numpy()
    return data[:, 1:], data[:, 0]


def export_naive_bayes(model, out_dir):
    kind = type(model).__name__
    payload = {
        "type": kind,
        "classes": model.classes_.tolist(),
        "class_log_prior": (
            np.log(model.class_prior_) if kind == "GaussianNB" else model.class_log_prior_
        ).tolist(),
    }
    if kind == "GaussianNB":
        payload["theta"] = model.theta_.tolist()
        payload["var"] = model.var_.tolist()
    elif kind in ("MultinomialNB", "BernoulliNB"):
        payload["feature_log_prob"] = model.feature_log_prob_.tolist()
        if kind == "BernoulliNB":
            payload["binarize"] = model.binarize
    else:
        raise ValueError(f"Naive Bayes não suportado: {kind}")

    path = out_dir / "naive_bayes.json"
    path.write_text(json.dumps(payload))
    print(f"{path}  ({kind}, {path.stat().st_size / 1e6:.1f} MB)")


def export_knn(model, out_dir):
    X = np.asarray(model._fit_X)
    y = np.asarray(model.classes_)[np.asarray(model._y)]
    if X.min() < 0 or X.max() > 255 or not np.allclose(X, np.round(X)):
        raise ValueError("O KNN precisa ter sido treinado com pixels inteiros de 0 a 255.")

    metric = model.effective_metric_
    params = dict(model.effective_metric_params_ or {})
    p = params.get("p", getattr(model, "p", 2))
    if metric == "minkowski":
        metric = {1: "manhattan", 2: "euclidean"}.get(p, "minkowski")
    if metric not in ("euclidean", "manhattan", "minkowski", "chebyshev"):
        raise ValueError(f"Métrica não suportada no navegador: {metric}")

    meta = {
        "k": int(model.n_neighbors),
        "metric": metric,
        "p": float(p),
        "weights": model.weights if isinstance(model.weights, str) else "uniform",
        "classes": np.asarray(model.classes_).tolist(),
        "n_samples": int(X.shape[0]),
        "n_features": int(X.shape[1]),
        "data_file": "knn_train.bin.gz",
    }
    (out_dir / "knn.json").write_text(json.dumps(meta, indent=2))

    # binário: n_samples × n_features pixels (uint8) seguidos de n_samples rótulos (uint8)
    raw = X.astype(np.uint8).tobytes() + y.astype(np.uint8).tobytes()
    path = out_dir / meta["data_file"]
    with gzip.open(path, "wb", compresslevel=9) as f:
        f.write(raw)
    print(f"{out_dir / 'knn.json'}  (K = {meta['k']}, {metric})")
    print(f"{path}  ({meta['n_samples']} exemplos, {path.stat().st_size / 1e6:.1f} MB)")


def main():
    parser = argparse.ArgumentParser(description=__doc__, formatter_class=argparse.RawDescriptionHelpFormatter)
    parser.add_argument("--nb", choices=NB_CLASSES, help="distribuição do Naive Bayes a treinar")
    parser.add_argument("--k", type=int, help="valor de K do KNN a treinar")
    parser.add_argument("--metric", default="euclidean", help="métrica do KNN (euclidean, manhattan, ...)")
    parser.add_argument("--nb-pkl", help="Naive Bayes já treinado (.pkl)")
    parser.add_argument("--knn-pkl", help="KNN já treinado (.pkl)")
    parser.add_argument("--train", default="data/mnist_train.csv", help="CSV de treino (60.000 exemplos)")
    parser.add_argument("--out", default=str(OUT_DEFAULT), help="pasta de saída")
    args = parser.parse_args()

    if not (args.nb or args.nb_pkl or args.k or args.knn_pkl):
        parser.error("informe --nb/--nb-pkl e/ou --k/--knn-pkl")

    out_dir = Path(args.out)
    out_dir.mkdir(parents=True, exist_ok=True)

    X = y = None
    if args.nb or args.k:
        X, y = load_train(args.train)

    if args.nb_pkl:
        export_naive_bayes(load_pickle(args.nb_pkl), out_dir)
    elif args.nb:
        from sklearn import naive_bayes
        model = getattr(naive_bayes, NB_CLASSES[args.nb])()
        export_naive_bayes(model.fit(X, y), out_dir)

    if args.knn_pkl:
        export_knn(load_pickle(args.knn_pkl), out_dir)
    elif args.k:
        from sklearn.neighbors import KNeighborsClassifier
        model = KNeighborsClassifier(n_neighbors=args.k, metric=args.metric)
        export_knn(model.fit(X, y), out_dir)


if __name__ == "__main__":
    main()
