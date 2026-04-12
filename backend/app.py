"""
Spotify Recommendation System — Flask API
Loads pre-trained KNN model and serves recommendations via REST endpoints.
"""

from flask import Flask, request, jsonify
from flask_cors import CORS
import pickle
import numpy as np
import pandas as pd
import os

app = Flask(__name__)
CORS(app)

# ============================================================
# LOAD SAVED MODEL ARTIFACTS AT STARTUP
# ============================================================
MODEL_DIR = os.path.join(os.path.dirname(__file__), '..', 'saved_models')

print("Loading model artifacts...")
with open(os.path.join(MODEL_DIR, 'knn_model.pkl'), 'rb') as f:
    knn_model = pickle.load(f)
with open(os.path.join(MODEL_DIR, 'scaler.pkl'), 'rb') as f:
    scaler = pickle.load(f)
with open(os.path.join(MODEL_DIR, 'pca.pkl'), 'rb') as f:
    pca = pickle.load(f)
with open(os.path.join(MODEL_DIR, 'features_pca.pkl'), 'rb') as f:
    X_pca = pickle.load(f)

song_metadata = pd.read_csv(os.path.join(MODEL_DIR, 'song_metadata.csv'))
print(f"Loaded {len(song_metadata)} songs. Model ready.")

# Audio feature names (must match training order)
AUDIO_FEATURES = [
    'valence', 'acousticness', 'danceability', 'energy',
    'instrumentalness', 'liveness', 'loudness', 'speechiness', 'tempo'
]

# Number of extra features in the full feature matrix (key one-hot + binary)
N_EXTRA_FEATURES = pca.n_features_in_ - len(AUDIO_FEATURES)


def generate_vibe_label(features):
    """Generate a human-readable vibe description from audio features."""
    labels = []
    energy = features.get('energy', 0.5)
    valence = features.get('valence', 0.5)
    danceability = features.get('danceability', 0.5)
    acousticness = features.get('acousticness', 0.5)
    speechiness = features.get('speechiness', 0.05)
    instrumentalness = features.get('instrumentalness', 0.0)
    tempo = features.get('tempo', 120)

    # Energy descriptor
    if energy >= 0.75:
        labels.append("High-energy")
    elif energy <= 0.3:
        labels.append("Calm")
    else:
        labels.append("Moderate")

    # Mood descriptor
    if valence >= 0.7:
        labels.append("upbeat")
    elif valence <= 0.3:
        labels.append("melancholic")

    # Style descriptor
    if danceability >= 0.7:
        labels.append("dance track")
    elif acousticness >= 0.7:
        labels.append("acoustic track")
    elif instrumentalness >= 0.5:
        labels.append("instrumental piece")
    elif speechiness >= 0.4:
        labels.append("spoken word / rap")
    elif tempo >= 140:
        labels.append("fast-paced track")
    elif tempo <= 80:
        labels.append("slow jam")
    else:
        labels.append("track")

    return " ".join(labels)


def format_results(indices, distances, n):
    """Format KNN results into JSON-serializable list."""
    similar_indices = indices[0][1:n + 1] if len(indices[0]) > n else indices[0][1:]
    similarity_scores = 1 - distances[0][1:n + 1] if len(distances[0]) > n else 1 - distances[0][1:]

    results = []
    for rank, (idx, sim) in enumerate(zip(similar_indices, similarity_scores), 1):
        row = song_metadata.iloc[idx]
        results.append({
            "rank": rank,
            "name": str(row["name"]),
            "artists": str(row["artists"]),
            "year": int(row["year"]),
            "popularity": int(row["popularity"]),
            "similarity": round(float(sim), 4)
        })
    return results


# ============================================================
# ENDPOINTS
# ============================================================

@app.route('/recommend', methods=['POST'])
def recommend():
    """Recommend songs similar to a given song name."""
    data = request.get_json()
    song_name = data.get('song_name', '').strip()
    n = min(data.get('n', 10), 10)

    if not song_name:
        return jsonify({"error": "song_name is required", "code": 400}), 400

    # Exact match (case-insensitive)
    matches = song_metadata[song_metadata['name'].str.lower() == song_name.lower()]
    partial = False

    # Partial match fallback
    if matches.empty:
        matches = song_metadata[song_metadata['name'].str.lower().str.contains(
            song_name.lower(), na=False, regex=False
        )]
        partial = True

    if matches.empty:
        return jsonify({"error": "Song not found", "code": 404}), 404

    # Pick most popular version
    idx = int(matches.loc[matches['popularity'].idxmax()].name)
    matched_row = song_metadata.iloc[idx]

    # KNN query
    distances, indices = knn_model.kneighbors([X_pca[idx]], n_neighbors=n + 1)
    results = format_results(indices, distances, n)

    response = {
        "matched_song": str(matched_row["name"]),
        "matched_artist": str(matched_row["artists"]),
        "partial_match": partial,
        "results": results
    }
    return jsonify(response)


@app.route('/recommend-features', methods=['POST'])
def recommend_features():
    """Recommend songs based on custom audio feature values."""
    data = request.get_json()
    n = min(data.get('n', 10), 10)

    # Extract feature values with defaults
    features = {
        'valence': data.get('valence', 0.5),
        'acousticness': data.get('acousticness', 0.5),
        'danceability': data.get('danceability', 0.5),
        'energy': data.get('energy', 0.5),
        'instrumentalness': data.get('instrumentalness', 0.0),
        'liveness': data.get('liveness', 0.2),
        'loudness': data.get('loudness', -8.0),
        'speechiness': data.get('speechiness', 0.05),
        'tempo': data.get('tempo', 120.0),
    }

    # Create feature vector in training order
    custom_array = np.array([[features[f] for f in AUDIO_FEATURES]])

    # Scale continuous features
    custom_scaled = scaler.transform(custom_array)

    # Pad with zeros for one-hot key + binary features
    custom_full = np.hstack([custom_scaled, np.zeros((1, N_EXTRA_FEATURES))])

    # Apply PCA
    custom_pca = pca.transform(custom_full)

    # KNN query
    distances, indices = knn_model.kneighbors(custom_pca, n_neighbors=n)

    # Format results (no +1 offset since there's no "self" to skip)
    results = []
    for rank, (idx, dist) in enumerate(zip(indices[0], distances[0]), 1):
        row = song_metadata.iloc[idx]
        results.append({
            "rank": rank,
            "name": str(row["name"]),
            "artists": str(row["artists"]),
            "year": int(row["year"]),
            "popularity": int(row["popularity"]),
            "similarity": round(float(1 - dist), 4)
        })

    response = {
        "vibe_label": generate_vibe_label(features),
        "results": results
    }
    return jsonify(response)


@app.route('/autocomplete', methods=['GET'])
def autocomplete():
    """Return top 5 song name matches for autocomplete."""
    query = request.args.get('q', '').strip().lower()

    if not query or len(query) < 2:
        return jsonify({"suggestions": []})

    # Find matching songs, sorted by popularity
    mask = song_metadata['name'].str.lower().str.contains(query, na=False, regex=False)
    matches = song_metadata[mask].sort_values('popularity', ascending=False)

    # Deduplicate by name, keep top 5
    unique_names = matches.drop_duplicates(subset='name').head(5)
    suggestions = []
    for _, row in unique_names.iterrows():
        suggestions.append({
            "name": str(row["name"]),
            "artists": str(row["artists"]),
            "popularity": int(row["popularity"])
        })

    return jsonify({"suggestions": suggestions})


@app.route('/health', methods=['GET'])
def health():
    """Health check endpoint."""
    return jsonify({
        "status": "ok",
        "songs_loaded": len(song_metadata),
        "pca_components": X_pca.shape[1]
    })


if __name__ == '__main__':
    app.run(debug=True, port=5000)
