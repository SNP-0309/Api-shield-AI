import argparse
import os

import joblib
import numpy as np
import pandas as pd
from sklearn.ensemble import IsolationForest
from sklearn.preprocessing import StandardScaler

from ml_model import FEATURE_NAMES, SentinelIsolationForest


def train_model(data_path, models_dir, contamination='auto'):
    if not os.path.exists(data_path):
        raise FileNotFoundError(
            f"Training data not found at {data_path}. Export a baseline of real request features first."
        )

    df = pd.read_csv(data_path)
    missing = [name for name in FEATURE_NAMES if name not in df.columns]
    if missing:
        raise ValueError(f"Training data is missing feature columns: {', '.join(missing)}")

    os.makedirs(models_dir, exist_ok=True)
    features = df[FEATURE_NAMES].astype(float).values

    scaler = StandardScaler()
    scaled_features = scaler.fit_transform(features)
    model = IsolationForest(
        n_estimators=int(os.getenv('MODEL_ESTIMATORS', '200')),
        max_samples='auto',
        contamination=contamination,
        random_state=42,
        n_jobs=-1
    )
    model.fit(scaled_features)

    model_path = os.path.join(models_dir, 'model.pkl')
    scaler_path = os.path.join(models_dir, 'scaler.pkl')
    joblib.dump(model, model_path)
    joblib.dump(scaler, scaler_path)

    sentinel = SentinelIsolationForest(model_path=model_path, scaler_path=scaler_path)
    raw_scores = model.decision_function(scaled_features)
    normalized_scores = np.array([sentinel.normalize_score(score) for score in raw_scores])

    print(f"Loaded {len(df)} real traffic observations")
    print(f"Exported model: {model_path}")
    print(f"Exported scaler: {scaler_path}")
    print(f"Normalized score range: {normalized_scores.min():.4f} - {normalized_scores.max():.4f}")

    # Labels are optional. If an offline validation export includes them,
    # report the result without making labels part of the training contract.
    if 'is_anomaly' in df.columns:
        predicted = (normalized_scores >= 0.50).astype(int)
        actual = df['is_anomaly'].astype(int).values
        print(f"Validation agreement: {(predicted == actual).mean() * 100:.2f}%")


if __name__ == '__main__':
    current_dir = os.path.dirname(os.path.abspath(__file__))
    parser = argparse.ArgumentParser(description='Train API Shield on real traffic feature exports')
    parser.add_argument('--data', default=os.path.join(current_dir, 'data', 'traffic_baseline.csv'))
    parser.add_argument('--models-dir', default=os.path.join(current_dir, 'models'))
    parser.add_argument('--contamination', default=os.getenv('MODEL_CONTAMINATION', 'auto'))
    args = parser.parse_args()

    contamination = args.contamination
    if contamination != 'auto':
        contamination = float(contamination)
    train_model(args.data, args.models_dir, contamination)
