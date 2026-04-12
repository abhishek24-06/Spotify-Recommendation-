import axios from 'axios';

const API_BASE = '/api';

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
