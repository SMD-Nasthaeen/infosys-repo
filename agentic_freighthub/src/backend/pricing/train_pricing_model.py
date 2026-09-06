"""
Milestone 3 (M3) — Phase 4: Advanced ML Freight Pricing Training Script
Utilizes NumPy, Pandas, Scikit-Learn, LightGBM, and XGBoost for high-accuracy regression.

Target: Actual_Freight_Price_INR
Engineered Features (NumPy & Pandas):
  - Categorical: Origin, Destination, Transport_Mode, Cargo_Type, Container_Type, Season, Carrier
  - Numerical: Weight_KG, Volume_CBM, Distance_KM, Fuel_Price, Transit_Days
  - Domain Interactions:
      * Ton_KM = (Weight_KG / 1000) * Distance_KM
      * Fuel_Burn_Index = (Distance_KM / 100) * (Fuel_Price / 90)
      * Chargeable_Weight_KG = max(Weight_KG, Volume_CBM * 167)
      * Density_KG_CBM = Weight_KG / max(Volume_CBM, 0.1)
      * Velocity_KM_Day = Distance_KM / max(Transit_Days, 1)
"""

import os
import sys
import json
import numpy as np
import pandas as pd
from pathlib import Path
import joblib

from sklearn.model_selection import train_test_split, KFold, cross_val_score
from sklearn.preprocessing import OneHotEncoder, StandardScaler, RobustScaler
from sklearn.compose import ColumnTransformer
from sklearn.pipeline import Pipeline
from sklearn.metrics import (
    mean_absolute_error,
    mean_squared_error,
    r2_score,
    mean_absolute_percentage_error,
    median_absolute_error,
)
from sklearn.ensemble import GradientBoostingRegressor, RandomForestRegressor
from sklearn.linear_model import Ridge

# Optional high-performance gradient boosting libraries
try:
    from lightgbm import LGBMRegressor
    USE_LIGHTGBM = True
except ImportError:
    USE_LIGHTGBM = False

try:
    from xgboost import XGBRegressor
    USE_XGBOOST = True
except ImportError:
    USE_XGBOOST = False


def get_dataset_path() -> Path:
    """Finds the CSV training dataset."""
    base_dir = Path(__file__).parent
    csv_path = base_dir / "data" / "freight_pricing_training_dataset_5000.csv"
    if csv_path.exists():
        return csv_path
    
    # Fallback to local search
    root_csv = Path("freight_pricing_training_dataset_5000.csv")
    if root_csv.exists():
        return root_csv
    return csv_path


def load_and_preprocess_with_pandas(file_path: Path) -> pd.DataFrame:
    """
    Loads raw CSV into Pandas DataFrame and applies domain feature engineering
    using vectorized NumPy and Pandas operations.
    """
    print(f"[*] [Pandas] Ingesting CSV dataset from: {file_path}")
    df = pd.read_csv(file_path)
    print(f"[+] Loaded {len(df)} records with {len(df.columns)} initial columns.")

    # 1. Clean missing values and assert numerical types
    num_cols = ["Weight_KG", "Volume_CBM", "Distance_KM", "Fuel_Price", "Transit_Days", "Actual_Freight_Price_INR"]
    for col in num_cols:
        df[col] = pd.to_numeric(df[col], errors="coerce")
    df = df.dropna().reset_index(drop=True)

    # 2. NumPy Vectorized Feature Engineering
    print("[*] [NumPy & Pandas] Generating domain interaction features...")
    
    # Ton-Kilometers (Standard freight work unit)
    df["Ton_KM"] = (df["Weight_KG"] / 1000.0) * df["Distance_KM"]
    
    # Fuel Burn Index
    df["Fuel_Burn_Index"] = (df["Distance_KM"] / 100.0) * (df["Fuel_Price"] / 90.0)
    
    # Volumetric vs Gross Weight (IATA / IMO Rule)
    is_air = df["Transport_Mode"].str.lower() == "air"
    vol_factor = np.where(is_air, 167.0, 1000.0)
    df["Chargeable_Weight_KG"] = np.maximum(df["Weight_KG"], df["Volume_CBM"] * vol_factor)
    
    # Density ratio (KG / CBM)
    df["Density_KG_CBM"] = df["Weight_KG"] / np.maximum(df["Volume_CBM"], 0.1)
    
    # Corridor Speed (KM per day)
    df["Velocity_KM_Day"] = df["Distance_KM"] / np.maximum(df["Transit_Days"], 1)

    # Log transformations to reduce skewness in distance and price
    df["Log_Distance_KM"] = np.log1p(df["Distance_KM"])
    df["Log_Weight_KG"] = np.log1p(df["Weight_KG"])

    print(f"[+] Engineered DataFrame now has {len(df.columns)} features.")
    return df


def build_ml_pipeline():
    """
    Constructs a Scikit-Learn ColumnTransformer and Regressor pipeline.
    """
    categorical_features = [
        "Origin",
        "Destination",
        "Transport_Mode",
        "Cargo_Type",
        "Container_Type",
        "Season",
        "Carrier",
    ]
    
    numerical_features = [
        "Weight_KG",
        "Volume_CBM",
        "Distance_KM",
        "Fuel_Price",
        "Transit_Days",
        "Ton_KM",
        "Fuel_Burn_Index",
        "Chargeable_Weight_KG",
        "Density_KG_CBM",
        "Velocity_KM_Day",
        "Log_Distance_KM",
        "Log_Weight_KG",
    ]

    preprocessor = ColumnTransformer(
        transformers=[
            ("num", RobustScaler(), numerical_features),
            ("cat", OneHotEncoder(handle_unknown="ignore", sparse_output=False), categorical_features),
        ],
        remainder="drop",
    )

    # Regressor Selection
    if USE_LIGHTGBM:
        print("[*] Using LightGBM Regressor (350 trees, max_depth=7)...")
        regressor = LGBMRegressor(
            n_estimators=350,
            learning_rate=0.04,
            num_leaves=31,
            subsample=0.85,
            colsample_bytree=0.85,
            random_state=42,
            verbose=-1,
        )
    elif USE_XGBOOST:
        print("[*] Using XGBoost Regressor (350 trees, max_depth=6)...")
        regressor = XGBRegressor(
            n_estimators=350,
            learning_rate=0.04,
            max_depth=6,
            subsample=0.85,
            colsample_bytree=0.85,
            random_state=42,
        )
    else:
        print("[*] Using Scikit-Learn GradientBoostingRegressor...")
        regressor = GradientBoostingRegressor(
            n_estimators=300,
            learning_rate=0.05,
            max_depth=5,
            random_state=42,
        )

    pipeline = Pipeline(
        steps=[
            ("preprocessor", preprocessor),
            ("regressor", regressor),
        ]
    )

    return pipeline, categorical_features, numerical_features


def train_and_evaluate(df: pd.DataFrame, output_dir: Path):
    """
    Performs 80/20 train/test split, 5-fold cross validation, and saves serialized artifacts.
    """
    target_col = "Actual_Freight_Price_INR"
    feature_cols = [c for c in df.columns if c not in ["Shipment_ID", target_col]]

    X = df[feature_cols]
    y = df[target_col]

    X_train, X_test, y_train, y_test = train_test_split(
        X, y, test_size=0.20, random_state=42, shuffle=True
    )

    print(f"[*] Training Samples: {len(X_train)} | Testing Samples: {len(X_test)}")

    pipeline, cat_cols, num_cols = build_ml_pipeline()

    print("[*] Fitting NumPy/Pandas Pipeline & Optimizing Weights...")
    pipeline.fit(X_train, y_train)

    # In-sample and Out-of-sample predictions
    y_pred_train = pipeline.predict(X_train)
    y_pred_test = pipeline.predict(X_test)

    # NumPy Metrics Calculation
    mae_train = mean_absolute_error(y_train, y_pred_train)
    rmse_train = np.sqrt(mean_squared_error(y_train, y_pred_train))
    r2_train = r2_score(y_train, y_pred_train)
    mape_train = mean_absolute_percentage_error(y_train, y_pred_train) * 100

    mae_test = mean_absolute_error(y_test, y_pred_test)
    rmse_test = np.sqrt(mean_squared_error(y_test, y_pred_test))
    r2_test = r2_score(y_test, y_pred_test)
    mape_test = mean_absolute_percentage_error(y_test, y_pred_test) * 100
    medae_test = median_absolute_error(y_test, y_pred_test)

    # 5-Fold Cross Validation
    print("[*] Running 5-Fold Cross Validation...")
    kfold = KFold(n_splits=5, shuffle=True, random_state=42)
    cv_scores = cross_val_score(pipeline, X_train, y_train, cv=kfold, scoring="r2", n_jobs=-1)

    print("\n" + "=" * 65)
    print("      ML PRICING REGRESSION BENCHMARK REPORT (NUMPY & PANDAS)")
    print("=" * 65)
    print(f" Train Samples:          {len(X_train):,}")
    print(f" Test Samples:           {len(X_test):,}")
    print(f" 5-Fold CV Mean R²:      {np.mean(cv_scores):.4f} (±{np.std(cv_scores):.4f})")
    print("-" * 65)
    print(f" Test R² Score:          {r2_test:.4f}  (Target: >= 0.940)")
    print(f" Test MAE:               INR {mae_test:,.2f}")
    print(f" Test RMSE:              INR {rmse_test:,.2f}")
    print(f" Test MAPE:              {mape_test:.2f}%")
    print(f" Test Median Error:      INR {medae_test:,.2f}")
    print("=" * 65 + "\n")

    # Serialize Model Artifact
    output_dir.mkdir(parents=True, exist_ok=True)
    artifact_path = output_dir / "freight_pricing_pipeline.joblib"
    joblib.dump(pipeline, artifact_path)

    metadata = {
        "model_architecture": type(pipeline.named_steps["regressor"]).__name__,
        "dataset_rows": len(df),
        "train_samples": len(X_train),
        "test_samples": len(X_test),
        "cv_mean_r2": float(np.mean(cv_scores)),
        "test_r2": float(r2_test),
        "test_mae_inr": float(mae_test),
        "test_rmse_inr": float(rmse_test),
        "test_mape_pct": float(mape_test),
        "test_medae_inr": float(medae_test),
        "categorical_features": cat_cols,
        "numerical_features": num_cols,
    }

    with open(output_dir / "model_metadata.json", "w") as f:
        json.dump(metadata, f, indent=2)

    print(f"[+] Saved model artifact to: {artifact_path}")
    print(f"[+] Saved model metadata to: {output_dir / 'model_metadata.json'}")

    return pipeline, metadata


if __name__ == "__main__":
    ds_path = get_dataset_path()
    processed_df = load_and_preprocess_with_pandas(ds_path)
    models_dir = Path(__file__).parent / "models"
    train_and_evaluate(processed_df, models_dir)
