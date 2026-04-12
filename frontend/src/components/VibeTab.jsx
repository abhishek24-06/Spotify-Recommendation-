import { useState, useRef } from 'react';
import { recommendByFeatures } from '../api/recommend';
import ResultsTable from './ResultsTable';

const SLIDERS = [
  { key: 'valence', label: 'Valence', min: 0, max: 1, step: 0.01, default: 0.5, desc: 'Musical positiveness' },
  { key: 'energy', label: 'Energy', min: 0, max: 1, step: 0.01, default: 0.5, desc: 'Perceptual intensity' },
  { key: 'danceability', label: 'Danceability', min: 0, max: 1, step: 0.01, default: 0.5, desc: 'Dance suitability' },
  { key: 'acousticness', label: 'Acousticness', min: 0, max: 1, step: 0.01, default: 0.5, desc: 'Acoustic confidence' },
  { key: 'tempo', label: 'Tempo', min: 60, max: 200, step: 1, default: 120, desc: 'BPM' },
  { key: 'loudness', label: 'Loudness', min: -60, max: 0, step: 0.5, default: -8, desc: 'Volume dB' },
  { key: 'speechiness', label: 'Speechiness', min: 0, max: 1, step: 0.01, default: 0.05, desc: 'Spoken word' },
  { key: 'instrumentalness', label: 'Instrumentalness', min: 0, max: 1, step: 0.01, default: 0.0, desc: 'Vocal absence' },
  { key: 'liveness', label: 'Liveness', min: 0, max: 1, step: 0.01, default: 0.2, desc: 'Live feel' },
];

const PRESETS = {
  Workout: { valence: 0.8, energy: 0.95, danceability: 0.8, acousticness: 0.05, tempo: 140, loudness: -5, speechiness: 0.06, instrumentalness: 0.0, liveness: 0.15 },
  Chill: { valence: 0.4, energy: 0.25, danceability: 0.45, acousticness: 0.8, tempo: 85, loudness: -15, speechiness: 0.04, instrumentalness: 0.3, liveness: 0.1 },
  Focus: { valence: 0.3, energy: 0.35, danceability: 0.3, acousticness: 0.6, tempo: 100, loudness: -18, speechiness: 0.03, instrumentalness: 0.8, liveness: 0.08 },
  Party: { valence: 0.9, energy: 0.85, danceability: 0.9, acousticness: 0.08, tempo: 128, loudness: -4, speechiness: 0.08, instrumentalness: 0.0, liveness: 0.25 },
};

function getVibeLabel(f) {
  const parts = [];
  if (f.energy >= 0.75) parts.push('High-energy');
  else if (f.energy <= 0.3) parts.push('Calm');
  else parts.push('Moderate');

  if (f.valence >= 0.7) parts.push('upbeat');
  else if (f.valence <= 0.3) parts.push('melancholic');

  if (f.danceability >= 0.7) parts.push('dance track');
  else if (f.acousticness >= 0.7) parts.push('acoustic track');
  else if (f.instrumentalness >= 0.5) parts.push('instrumental piece');
  else if (f.speechiness >= 0.4) parts.push('spoken word / rap');
  else parts.push('track');

  return parts.join(' ');
}

function getVibeDescription(f) {
  if (f.energy >= 0.8 && f.danceability >= 0.7) return 'Perfect for moving and grooving';
  if (f.energy <= 0.3 && f.acousticness >= 0.6) return 'Soft and reflective mood';
  if (f.instrumentalness >= 0.5) return 'Pure instrumental soundscape';
  if (f.valence >= 0.7) return 'Bright and feel-good energy';
  if (f.valence <= 0.3) return 'Deep and moody atmosphere';
  return 'Balanced listening experience';
}

export default function VibeTab() {
  const defaultFeatures = {};
  SLIDERS.forEach(s => { defaultFeatures[s.key] = s.default; });

  const [features, setFeatures] = useState(defaultFeatures);
  const [results, setResults] = useState(null);
  const [vibeLabel, setVibeLabel] = useState(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [n, setN] = useState(10);
  const [activePreset, setActivePreset] = useState(null);
  const [copied, setCopied] = useState(false);

  const updateFeature = (key, value) => {
    setFeatures(prev => ({ ...prev, [key]: Number(value) }));
    setActivePreset(null);
  };

  const applyPreset = (name) => {
    setFeatures({ ...PRESETS[name] });
    setActivePreset(name);
  };

  const handleSubmit = async () => {
    setLoading(true);
    setError('');
    setResults(null);
    try {
      const data = await recommendByFeatures(features, n);
      setResults(data.results);
      setVibeLabel(data.vibe_label);
    } catch (err) {
      setError(err.response?.data?.error || 'Something went wrong. Is the backend running?');
    } finally {
      setLoading(false);
    }
  };

  const handleExport = () => {
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const currentVibe = getVibeLabel(features);
  const vibeDesc = getVibeDescription(features);

  // Calculate slider fill percentage
  const getFillPercent = (slider, value) => {
    return ((value - slider.min) / (slider.max - slider.min)) * 100;
  };

  return (
    <div>
      {/* Section label */}
      <div style={{ fontSize: '10px', color: '#444', textTransform: 'uppercase', letterSpacing: '0.08em', marginBottom: '10px' }}>
        Presets
      </div>

      {/* Preset chips */}
      <div className="flex flex-wrap gap-2 mb-5">
        {Object.keys(PRESETS).map((name) => (
          <button
            key={name}
            onClick={() => applyPreset(name)}
            className="cursor-pointer transition-all"
            style={{
              padding: '7px 14px',
              borderRadius: '20px',
              fontSize: '12px',
              fontWeight: 500,
              border: activePreset === name ? '0.5px solid #1DB95450' : '0.5px solid #2a2a2a',
              background: activePreset === name ? '#1a2a1a' : 'transparent',
              color: activePreset === name ? '#1DB954' : '#666',
            }}
            onMouseEnter={(e) => {
              if (activePreset !== name) {
                e.currentTarget.style.color = '#999';
                e.currentTarget.style.borderColor = '#444';
              }
            }}
            onMouseLeave={(e) => {
              if (activePreset !== name) {
                e.currentTarget.style.color = '#666';
                e.currentTarget.style.borderColor = '#2a2a2a';
              }
            }}
          >
            {name}
          </button>
        ))}
      </div>

      {/* Vibe label banner */}
      <div
        className="mb-5 px-4 py-3 flex items-center justify-between"
        style={{
          background: '#111',
          border: '0.5px solid #222',
          borderRadius: '10px',
        }}
      >
        <span style={{ fontSize: '12px', color: '#1DB954', fontWeight: 500 }}>{currentVibe}</span>
        <span style={{ fontSize: '11px', color: '#444' }}>{vibeDesc}</span>
      </div>

      {/* Section label */}
      <div style={{ fontSize: '10px', color: '#444', textTransform: 'uppercase', letterSpacing: '0.08em', marginBottom: '10px' }}>
        Audio Features
      </div>

      {/* Sliders */}
      <div style={{ marginBottom: '0' }}>
        {SLIDERS.map((s) => {
          const fillPct = getFillPercent(s, features[s.key]);
          return (
            <div key={s.key} style={{ marginBottom: '14px' }}>
              <div className="flex justify-between items-center" style={{ marginBottom: '8px' }}>
                <div>
                  <span style={{ fontSize: '13px', fontWeight: 500, color: '#e0e0e0' }}>{s.label}</span>
                  <span style={{ fontSize: '11px', color: '#3a3a3a', marginLeft: '6px' }}>{s.desc}</span>
                </div>
                <span style={{ fontSize: '12px', fontFamily: 'monospace', color: '#1DB954', minWidth: '40px', textAlign: 'right' }}>
                  {s.step < 1 ? features[s.key].toFixed(2) : features[s.key]}
                </span>
              </div>
              <div style={{ position: 'relative' }}>
                {/* Green fill track */}
                <div style={{
                  position: 'absolute',
                  top: '50%',
                  left: 0,
                  transform: 'translateY(-50%)',
                  width: `${fillPct}%`,
                  height: '3px',
                  background: '#1DB954',
                  borderRadius: '2px',
                  pointerEvents: 'none',
                  zIndex: 1,
                }} />
                <input
                  type="range"
                  min={s.min}
                  max={s.max}
                  step={s.step}
                  value={features[s.key]}
                  onChange={(e) => updateFeature(s.key, e.target.value)}
                  style={{ position: 'relative', zIndex: 2 }}
                />
              </div>
            </div>
          );
        })}
      </div>

      {/* Action row */}
      <div className="flex gap-2 items-center" style={{ borderTop: '0.5px solid #1a1a1a', paddingTop: '18px', marginTop: '20px' }}>
        <button
          onClick={handleSubmit}
          disabled={loading}
          className="flex-1 cursor-pointer hover:brightness-110 transition-all disabled:opacity-50"
          style={{
            background: '#1DB954',
            color: '#000',
            fontSize: '14px',
            fontWeight: 500,
            borderRadius: '10px',
            padding: '12px',
            border: 'none',
          }}
        >
          {loading ? 'Finding songs...' : 'Get Recommendations'}
        </button>
        <select
          value={n}
          onChange={(e) => setN(Number(e.target.value))}
          style={{
            background: '#1a1a1a',
            border: '0.5px solid #2a2a2a',
            borderRadius: '10px',
            color: '#888',
            fontSize: '13px',
            width: '70px',
          }}
          className="px-3 py-3 focus:outline-none cursor-pointer"
        >
          <option value={5}>5</option>
          <option value={10}>10</option>
        </select>
      </div>

      {/* Error */}
      {error && (
        <div
          className="mt-4 px-4 py-3"
          style={{
            background: '#1a0e0e',
            border: '0.5px solid #E24B4A30',
            borderRadius: '10px',
            color: '#E24B4A',
            fontSize: '12px',
          }}
        >
          {error}
        </div>
      )}

      {/* Loading skeleton */}
      {loading && (
        <div className="mt-5 space-y-1.5">
          {[...Array(n)].map((_, i) => (
            <div key={i} className="skeleton h-14" />
          ))}
        </div>
      )}

      {/* Results */}
      {!loading && results && (
        <ResultsTable results={results} vibeLabel={vibeLabel} onExport={handleExport} />
      )}

      {copied && (
        <div
          className="fixed bottom-6 right-6 px-4 py-2.5 font-medium shadow-lg"
          style={{ background: '#1DB954', color: '#000', borderRadius: '10px', fontSize: '12px' }}
        >
          Copied to clipboard!
        </div>
      )}
    </div>
  );
}
