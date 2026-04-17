# Spotify Recommendation System

A full-stack music recommendation project built on Spotify audio feature data.

## Project Summary

- Developed a recommendation app using a dataset of ~170,000 Spotify tracks.
- Evaluated multiple algorithms and selected K-Nearest Neighbors (KNN) as the final recommendation engine for best audio similarity results.
- Added clustering support with K-Means and DBSCAN, plus popularity prediction baselines using Random Forest and Linear Regression.
- Built a React/Vite frontend with a Flask backend API for interactive song search and vibe-based recommendations.

## What it does

- Recommends similar tracks by comparing song audio features.
- Supports autocomplete search and custom-vibe recommendations.
- Uses pre-trained KNN on PCA-reduced audio embeddings.
- Includes API endpoints for song-based and feature-based recommendations.

## Tech stack

- Python, Flask, Flask-CORS
- scikit-learn, pandas, numpy
- React, Vite, Tailwind CSS, Axios

## Dataset

- `data.csv` contains the Spotify audio features dataset used for model training.
- The frontend displays recommendations for ~170K tracks.

## Project structure

- `backend/` — Flask API server with model loading and endpoints.
- `frontend/` — React application using Vite.
- `saved_models/` — Saved KNN model, scaler, PCA, and metadata.
- `analysis.ipynb` / `Spotify_5_Models_Fixed.ipynb` — EDA and model development notebooks.

## Local setup

### Backend

1. Open a terminal in `backend/`
2. Install dependencies:

```bash
pip install -r requirements.txt
```

3. Start the server:

```bash
python app.py
```

The backend runs on `http://localhost:5000`.

### Frontend

1. Open a terminal in `frontend/`
2. Install dependencies:

```bash
npm install
```

3. Start the dev server:

```bash
npm run dev
```

The frontend runs on `http://localhost:3000` and proxies API requests to the backend.

## Notes

- The app uses the saved KNN model and feature transformers from `saved_models/`.
- If you retrain models, update the saved artifacts accordingly.

## Usage

- Search for a song in the frontend to get top similar tracks.
- Use the vibe-based tab to recommend songs from custom audio feature inputs.
- The backend also exposes `/recommend`, `/recommend-features`, `/autocomplete`, and `/health` endpoints.
