import axios from 'axios';

// In production, VITE_API_URL should point to your deployed backend
// e.g. https://spotify-recommendation-api.onrender.com
// In dev mode, falls back to '/api' which Vite proxies to localhost:5000
const API_BASE = import.meta.env.VITE_API_URL || '/api';

export async function recommendBySong(songName, n = 10) {
  const res = await axios.post(`${API_BASE}/recommend`, { song_name: songName, n });
  return res.data;
}

export async function recommendByFeatures(features, n = 10) {
  const res = await axios.post(`${API_BASE}/recommend-features`, { ...features, n });
  return res.data;
}

export async function autocomplete(query) {
  if (!query || query.length < 2) return [];
  const res = await axios.get(`${API_BASE}/autocomplete`, { params: { q: query } });
  return res.data.suggestions || [];
}
