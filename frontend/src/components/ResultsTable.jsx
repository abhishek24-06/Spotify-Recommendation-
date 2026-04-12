export default function ResultsTable({ results, matchInfo, vibeLabel, onExport }) {
  if (!results || results.length === 0) return null;

  const getSimilarityStyle = (sim) => {
    const pct = (sim * 100).toFixed(1);
    if (sim >= 0.99) return { bg: '#0d2016', color: '#1DB954', border: '#1DB95430', text: `${pct}%` };
    if (sim >= 0.97) return { bg: '#1a1800', color: '#EF9F27', border: '#EF9F2730', text: `${pct}%` };
    return { bg: '#1a0e0e', color: '#E24B4A', border: '#E24B4A30', text: `${pct}%` };
  };

  const copyAsCSV = () => {
    const header = 'Rank,Name,Artist,Year,Popularity,Similarity';
    const rows = results.map(r =>
      `${r.rank},"${r.name}","${r.artists}",${r.year},${r.popularity},${r.similarity}`
    );
    navigator.clipboard.writeText([header, ...rows].join('\n'));
    if (onExport) onExport();
  };

  return (
    <div className="mt-5 animate-in">
      {/* Match banner */}
      {matchInfo && (
        <div
          className="mb-4 px-4 py-3 flex items-center gap-2.5"
          style={{
            background: matchInfo.partial_match ? '#1a1a0e' : '#1a2a1a',
            border: matchInfo.partial_match ? '0.5px solid #EF9F2730' : '0.5px solid #1DB95430',
            borderRadius: '10px',
          }}
        >
          <span
            className="inline-block w-1.5 h-1.5 rounded-full flex-shrink-0"
            style={{ background: matchInfo.partial_match ? '#EF9F27' : '#1DB954' }}
          />
          <span style={{ fontSize: '12px', color: '#aaa' }}>
            {matchInfo.partial_match ? 'Showing results for' : 'Recommendations for'}{' '}
            <strong style={{ color: '#e0e0e0' }}>{matchInfo.matched_song}</strong>{' '}
            by <strong style={{ color: '#e0e0e0' }}>{matchInfo.matched_artist}</strong>
          </span>
        </div>
      )}

      {/* Vibe label */}
      {vibeLabel && (
        <div
          className="mb-4 px-4 py-3 flex items-center gap-2.5"
          style={{
            background: '#1a2a1a',
            border: '0.5px solid #1DB95430',
            borderRadius: '10px',
          }}
        >
          <span
            className="inline-block w-1.5 h-1.5 rounded-full flex-shrink-0"
            style={{ background: '#1DB954' }}
          />
          <span style={{ fontSize: '12px', color: '#1DB954', fontWeight: 500 }}>{vibeLabel}</span>
        </div>
      )}

      {/* Header row */}
      <div className="flex justify-between items-center mb-2.5">
        <span style={{ fontSize: '10px', color: '#444', textTransform: 'uppercase', letterSpacing: '0.08em' }}>
          Results
        </span>
        <button
          onClick={copyAsCSV}
          className="cursor-pointer transition-colors"
          style={{
            fontSize: '11px',
            padding: '4px 12px',
            borderRadius: '6px',
            border: '0.5px solid #2a2a2a',
            background: 'transparent',
            color: '#555',
          }}
          onMouseEnter={(e) => { e.currentTarget.style.color = '#aaa'; e.currentTarget.style.borderColor = '#444'; }}
          onMouseLeave={(e) => { e.currentTarget.style.color = '#555'; e.currentTarget.style.borderColor = '#2a2a2a'; }}
        >
          Copy CSV
        </button>
      </div>

      {/* Table */}
      <div style={{ borderRadius: '12px', overflow: 'hidden', border: '0.5px solid #1e1e1e' }}>
        <table className="w-full" style={{ borderCollapse: 'collapse' }}>
          <thead>
            <tr style={{ background: '#141414', borderBottom: '0.5px solid #1e1e1e' }}>
              <th style={{ width: '32px', padding: '10px 12px', textAlign: 'left', fontSize: '10px', color: '#444', textTransform: 'uppercase', letterSpacing: '0.05em', fontWeight: 500 }}>#</th>
              <th style={{ padding: '10px 12px', textAlign: 'left', fontSize: '10px', color: '#444', textTransform: 'uppercase', letterSpacing: '0.05em', fontWeight: 500 }}>Title</th>
              <th style={{ width: '52px', padding: '10px 12px', textAlign: 'left', fontSize: '10px', color: '#444', textTransform: 'uppercase', letterSpacing: '0.05em', fontWeight: 500 }}>Year</th>
              <th style={{ width: '110px', padding: '10px 12px', textAlign: 'left', fontSize: '10px', color: '#444', textTransform: 'uppercase', letterSpacing: '0.05em', fontWeight: 500 }}>Popularity</th>
              <th style={{ width: '72px', padding: '10px 8px 10px 12px', textAlign: 'right', fontSize: '10px', color: '#444', textTransform: 'uppercase', letterSpacing: '0.05em', fontWeight: 500 }}>Match</th>
            </tr>
          </thead>
          <tbody>
            {results.map((song, i) => {
              const simStyle = getSimilarityStyle(song.similarity);
              return (
                <tr
                  key={i}
                  className="transition-colors group"
                  style={{
                    borderBottom: i < results.length - 1 ? '0.5px solid #161616' : 'none',
                    cursor: 'default',
                  }}
                  onMouseEnter={(e) => e.currentTarget.style.background = '#131313'}
                  onMouseLeave={(e) => e.currentTarget.style.background = 'transparent'}
                >
                  <td style={{ padding: '10px 12px', fontSize: '12px', color: '#3a3a3a', width: '32px' }}>{song.rank}</td>
                  <td style={{ padding: '10px 12px', maxWidth: 0 }}>
                    <div style={{ fontSize: '13px', color: '#e0e0e0', fontWeight: 500, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                      {song.name}
                    </div>
                    <div style={{ fontSize: '11px', color: '#555', marginTop: '1px', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                      {song.artists}
                    </div>
                  </td>
                  <td style={{ padding: '10px 12px', fontSize: '12px', color: '#3a3a3a', width: '52px' }}>{song.year}</td>
                  <td style={{ padding: '10px 12px', width: '110px' }}>
                    <div style={{ width: '100%', height: '3px', background: '#1e1e1e', borderRadius: '2px', overflow: 'hidden' }}>
                      <div style={{ width: `${song.popularity}%`, height: '100%', background: '#1DB954', borderRadius: '2px', transition: 'width 0.3s' }} />
                    </div>
                    <div style={{ fontSize: '10px', color: '#444', marginTop: '4px' }}>{song.popularity}</div>
                  </td>
                  <td style={{ padding: '10px 8px 10px 12px', width: '72px', textAlign: 'right' }}>
                    <span style={{
                      display: 'inline-block',
                      padding: '3px 8px',
                      borderRadius: '6px',
                      fontSize: '11px',
                      fontWeight: 500,
                      background: simStyle.bg,
                      color: simStyle.color,
                      border: `0.5px solid ${simStyle.border}`,
                    }}>
                      {simStyle.text}
                    </span>
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>
    </div>
  );
}
