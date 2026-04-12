"""
Spotify Song Recommendation System
Using Content-Based Filtering with KNN + Cosine Similarity
"""

import pandas as pd
import numpy as np
import pickle
import os
from sklearn.preprocessing import StandardScaler
from sklearn.decomposition import PCA
from sklearn.neighbors import NearestNeighbors

# ============================================================
# 1. LOAD DATA
# ============================================================
print("Loading data...")
df = pd.read_csv('data.csv')
print(f"Original dataset: {df.shape[0]} tracks, {df.shape[1]} columns")

# ============================================================
# 2. DATA CLEANING
# ============================================================
print("\n--- Data Cleaning ---")

# Remove corrupted rows (tempo=0 or danceability=0)
before = len(df)
df = df[(df['tempo'] > 0) & (df['danceability'] > 0)]
print(f"Removed {before - len(df)} rows with zero tempo/danceability")

# Remove duration outliers using IQR (3x for lenient filtering)
Q1 = df['duration_ms'].quantile(0.25)
Q3 = df['duration_ms'].quantile(0.75)
IQR = Q3 - Q1
lower_bound = Q1 - 3 * IQR
upper_bound = Q3 + 3 * IQR

before = len(df)
df = df[(df['duration_ms'] >= lower_bound) & (df['duration_ms'] <= upper_bound)]
print(f"Removed {before - len(df)} duration outliers (bounds: {lower_bound:.0f}ms - {upper_bound:.0f}ms)")

# Reset index after cleaning (CRITICAL - prevents index mismatch)
df = df.reset_index(drop=True)
print(f"Clean dataset: {df.shape[0]} tracks")

# ============================================================
# 3. KEEP ORIGINAL DATA FOR LOOKUP (before dropping columns)
# ============================================================
# Store metadata columns for displaying recommendations later
song_metadata = df[['name', 'artists', 'popularity', 'year', 'id']].copy()

# ============================================================
# 4. FEATURE ENGINEERING
# ============================================================
print("\n--- Feature Engineering ---")

# Audio features for similarity computation
audio_features = [
    'valence', 'acousticness', 'danceability', 'energy',
    'instrumentalness', 'liveness', 'loudness', 'speechiness', 'tempo'
]

# One-hot encode 'key' (categorical: 0-11 representing musical keys)
key_dummies = pd.get_dummies(df['key'], prefix='key').astype(float)
print(f"One-hot encoded 'key' into {key_dummies.shape[1]} columns")

# Build feature matrix: audio features + one-hot key + binary features
feature_df = df[audio_features].copy()
feature_df = pd.concat([feature_df, key_dummies], axis=1)

# Add binary features (explicit, mode) — already 0/1, no scaling needed
feature_df['explicit'] = df['explicit'].values
feature_df['mode'] = df['mode'].values

print(f"Total features: {feature_df.shape[1]}")
print(f"Features: {list(feature_df.columns)}")

# ============================================================
# 5. FEATURE SCALING
# ============================================================
print("\n--- Scaling ---")

# Only scale continuous features (not binary/one-hot)
continuous_features = audio_features  # valence, acousticness, ..., tempo
binary_features = ['explicit', 'mode'] + list(key_dummies.columns)

scaler = StandardScaler()
feature_df[continuous_features] = scaler.fit_transform(feature_df[continuous_features])
print(f"Scaled {len(continuous_features)} continuous features with StandardScaler")
print(f"Left {len(binary_features)} binary features unscaled")

# ============================================================
# 6. PCA (Dimensionality Reduction)
# ============================================================
print("\n--- PCA ---")

pca = PCA(n_components=0.95, random_state=42)  # Keep 95% variance
X_pca = pca.fit_transform(feature_df.values)
print(f"Reduced from {feature_df.shape[1]} features to {X_pca.shape[1]} components")
print(f"Explained variance ratio: {pca.explained_variance_ratio_.sum():.4f}")

# ============================================================
# 7. BUILD KNN MODEL
# ============================================================
print("\n--- Training KNN ---")

knn = NearestNeighbors(
    n_neighbors=11,       # 10 recommendations + 1 (the song itself)
    metric='cosine',      # Cosine similarity for audio features
    algorithm='brute',    # Required for cosine metric
    n_jobs=-1             # Use all CPU cores
)
knn.fit(X_pca)
print("KNN model fitted successfully!")

# ============================================================
# 8. RECOMMENDATION FUNCTION
# ============================================================

def recommend(song_name, n_recommendations=10):
    """
    Recommend songs similar to the given song name.
    
    Parameters:
        song_name (str): Name of the song to find similar songs for
        n_recommendations (int): Number of recommendations to return
    
    Returns:
        DataFrame with recommended songs and their similarity scores
    """
    # Case-insensitive search
    matches = song_metadata[song_metadata['name'].str.lower() == song_name.lower()]
    
    if matches.empty:
        # Try partial match if exact match fails
        matches = song_metadata[song_metadata['name'].str.lower().str.contains(song_name.lower(), na=False)]
        if matches.empty:
            print(f"Song '{song_name}' not found in dataset.")
            return None
        print(f"Exact match not found. Showing results for: '{matches.iloc[0]['name']}'")
    
    # If multiple matches, pick the most popular one
    if len(matches) > 1:
        idx = matches['popularity'].idxmax()
        print(f"Multiple matches found. Using most popular: '{song_metadata.loc[idx, 'name']}' by {song_metadata.loc[idx, 'artists']} (popularity: {song_metadata.loc[idx, 'popularity']})")
    else:
        idx = matches.index[0]
    
    # Find nearest neighbors (using double brackets to preserve DataFrame format)
    distances, indices = knn.kneighbors([X_pca[idx]], n_neighbors=n_recommendations + 1)
    
    # Exclude the input song itself (first result)
    similar_indices = indices[0][1:]
    similarity_scores = 1 - distances[0][1:]  # Convert distance to similarity (1 = identical)
    
    # Build results DataFrame
    results = song_metadata.iloc[similar_indices][['name', 'artists', 'popularity', 'year']].copy()
    results['similarity'] = np.round(similarity_scores, 4)
    results = results.reset_index(drop=True)
    results.index = results.index + 1  # Start numbering from 1
    
    return results


def recommend_by_features(valence=0.5, energy=0.5, danceability=0.5, acousticness=0.5,
                          tempo=120, loudness=-8, speechiness=0.05, instrumentalness=0.0,
                          liveness=0.2, n_recommendations=10):
    """
    Recommend songs based on custom audio feature values.
    Useful when you want songs with a specific mood/feel.
    """
    # Create feature vector matching the training format
    custom_features = pd.DataFrame({
        'valence': [valence], 'acousticness': [acousticness],
        'danceability': [danceability], 'energy': [energy],
        'instrumentalness': [instrumentalness], 'liveness': [liveness],
        'loudness': [loudness], 'speechiness': [speechiness], 'tempo': [tempo]
    })
    
    # Scale continuous features
    custom_scaled = scaler.transform(custom_features)
    
    # Add zeros for key one-hot + binary features
    n_extra = feature_df.shape[1] - len(audio_features)
    custom_full = np.hstack([custom_scaled, np.zeros((1, n_extra))])
    
    # Apply PCA
    custom_pca = pca.transform(custom_full)
    
    # Find similar songs
    distances, indices = knn.kneighbors(custom_pca, n_neighbors=n_recommendations)
    similarity_scores = 1 - distances[0]
    
    results = song_metadata.iloc[indices[0]][['name', 'artists', 'popularity', 'year']].copy()
    results['similarity'] = np.round(similarity_scores, 4)
    results = results.reset_index(drop=True)
    results.index = results.index + 1
    
    return results

# ============================================================
# 9. SAVE MODEL (for reuse without retraining)
# ============================================================

model_dir = 'saved_models'
os.makedirs(model_dir, exist_ok=True)

with open(os.path.join(model_dir, 'knn_model.pkl'), 'wb') as f:
    pickle.dump(knn, f)

with open(os.path.join(model_dir, 'scaler.pkl'), 'wb') as f:
    pickle.dump(scaler, f)

with open(os.path.join(model_dir, 'pca.pkl'), 'wb') as f:
    pickle.dump(pca, f)

with open(os.path.join(model_dir, 'features_pca.pkl'), 'wb') as f:
    pickle.dump(X_pca, f)

song_metadata.to_csv(os.path.join(model_dir, 'song_metadata.csv'), index=False)

print(f"\nModel saved to '{model_dir}/' directory")

# ============================================================
# 10. TEST RECOMMENDATIONS
# ============================================================

print("\n" + "=" * 60)
print("TESTING RECOMMENDATIONS")
print("=" * 60)

test_songs = ["Blinding Lights", "Bohemian Rhapsody", "Shape of You"]

for song in test_songs:
    print(f"\n>> Recommendations for: '{song}'")
    print("-" * 50)
    result = recommend(song)
    if result is not None:
        print(result.to_string())

# Test custom feature recommendation
print(f"\n>> Recommendations for: High energy dance track")
print("-" * 50)
result = recommend_by_features(valence=0.8, energy=0.9, danceability=0.85, tempo=128)
print(result.to_string())
