import { useState, useEffect, useRef } from 'react';
import { recommendBySong, autocomplete } from '../api/recommend';
import ResultsTable from './ResultsTable';

export default function SearchTab() {
  const [query, setQuery] = useState('');
  const [suggestions, setSuggestions] = useState([]);
  const [showSuggestions, setShowSuggestions] = useState(false);
  const [results, setResults] = useState(null);
  const [matchInfo, setMatchInfo] = useState(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [n, setN] = useState(10);
  const [copied, setCopied] = useState(false);
  const debounceRef = useRef(null);
  const wrapperRef = useRef(null);

  useEffect(() => {
    const handler = (e) => {
      if (wrapperRef.current && !wrapperRef.current.contains(e.target)) {
        setShowSuggestions(false);
      }
    };
    document.addEventListener('mousedown', handler);
    return () => document.removeEventListener('mousedown', handler);
  }, []);

  useEffect(() => {
    if (debounceRef.current) clearTimeout(debounceRef.current);
    if (!query || query.length < 2) {
      setSuggestions([]);
      return;
    }
    debounceRef.current = setTimeout(async () => {
      try {
        const data = await autocomplete(query);
        setSuggestions(data);
        setShowSuggestions(true);
      } catch {
        setSuggestions([]);
      }
    }, 300);
  }, [query]);

  const handleSearch = async (songName) => {
    const name = songName || query;
    if (!name.trim()) return;
    setLoading(true);
    setError('');
    setResults(null);
    setMatchInfo(null);
    setShowSuggestions(false);
    try {
      const data = await recommendBySong(name, n);
      setResults(data.results);
      setMatchInfo(data);
    } catch (err) {
      setError(err.response?.data?.error || 'Something went wrong. Is the backend running?');
    } finally {
      setLoading(false);
    }
  };

  const selectSuggestion = (name) => {
    setQuery(name);
    setShowSuggestions(false);
    handleSearch(name);
  };

  const handleExport = () => {
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  return (
    <div>
      {/* Search input row */}
      <div className="relative" ref={wrapperRef}>
        <div className="flex gap-2">
          <div className="relative flex-1">
            <svg className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4" style={{ color: '#444' }} fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
            </svg>
            <input
              type="text"
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              onKeyDown={(e) => e.key === 'Enter' && handleSearch()}
              placeholder="Search for a song..."
              style={{
                background: '#1a1a1a',
                border: '0.5px solid #2a2a2a',
                borderRadius: '10px',
                color: '#fff',
                fontSize: '13px',
              }}
              className="w-full pl-10 pr-4 py-3 placeholder-[#444] focus:outline-none focus:border-[#1DB954] transition-colors"
            />
          </div>
          <select
            value={n}
            onChange={(e) => setN(Number(e.target.value))}
            style={{
              background: '#1a1a1a',
              border: '0.5px solid #2a2a2a',
              borderRadius: '10px',
              color: '#888',
              fontSize: '13px',
              width: '68px',
            }}
            className="px-3 py-3 focus:outline-none cursor-pointer"
          >
            <option value={5}>5</option>
            <option value={10}>10</option>
          </select>
          <button
            onClick={() => handleSearch()}
            disabled={loading}
            style={{
              background: '#1DB954',
              borderRadius: '10px',
              border: 'none',
              color: '#000',
              fontSize: '13px',
              fontWeight: 500,
            }}
            className="px-6 py-3 hover:brightness-110 transition-all disabled:opacity-50 cursor-pointer"
          >
            {loading ? 'Searching...' : 'Search'}
          </button>
        </div>

        {/* Autocomplete dropdown */}
        {showSuggestions && suggestions.length > 0 && (
          <div
            className="absolute z-50 mt-1.5 w-full overflow-hidden"
            style={{
              background: '#1a1a1a',
              border: '0.5px solid #2a2a2a',
              borderRadius: '10px',
              boxShadow: '0 8px 32px rgba(0,0,0,0.5)',
            }}
          >
            {suggestions.map((s, i) => (
              <div
                key={i}
                onClick={() => selectSuggestion(s.name)}
                className="px-4 py-2.5 cursor-pointer flex justify-between items-center transition-colors"
                style={{ borderBottom: i < suggestions.length - 1 ? '0.5px solid #222' : 'none' }}
                onMouseEnter={(e) => e.currentTarget.style.background = '#222'}
                onMouseLeave={(e) => e.currentTarget.style.background = 'transparent'}
              >
                <div>
                  <div style={{ fontSize: '13px', color: '#e0e0e0' }}>{s.name}</div>
                  <div style={{ fontSize: '11px', color: '#555' }}>{s.artists}</div>
                </div>
                <span style={{ fontSize: '10px', color: '#3a3a3a' }}>pop: {s.popularity}</span>
              </div>
            ))}
          </div>
        )}
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
            <div key={i} className="skeleton h-14" style={{ borderRadius: '0' }} />
          ))}
        </div>
      )}

      {/* Results */}
      {!loading && results && (
        <ResultsTable
          results={results}
          matchInfo={matchInfo}
          onExport={handleExport}
        />
      )}

      {/* Copied toast */}
      {copied && (
        <div
          className="fixed bottom-6 right-6 px-4 py-2.5 font-medium text-sm shadow-lg"
          style={{ background: '#1DB954', color: '#000', borderRadius: '10px', fontSize: '12px' }}
        >
          Copied to clipboard!
        </div>
      )}
    </div>
  );
}
