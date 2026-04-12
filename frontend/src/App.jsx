import { useState } from 'react'
import './index.css'
import SearchTab from './components/SearchTab'
import VibeTab from './components/VibeTab'

function App() {
  const [activeTab, setActiveTab] = useState('search');

  return (
    <div className="min-h-screen" style={{ background: '#0a0a0a' }}>
      {/* Navbar */}
      <nav className="sticky top-0 z-40" style={{ background: '#111', borderBottom: '0.5px solid #1a1a1a' }}>
        <div className="max-w-[720px] mx-auto px-5 py-3 flex items-center justify-between">
          <div className="flex items-center gap-2.5">
            <div className="w-7 h-7 rounded-full flex items-center justify-center" style={{ background: '#1DB954' }}>
              <svg className="w-3.5 h-3.5 text-black" viewBox="0 0 24 24" fill="currentColor">
                <path d="M12 0C5.4 0 0 5.4 0 12s5.4 12 12 12 12-5.4 12-12S18.66 0 12 0zm5.521 17.34c-.24.359-.66.48-1.021.24-2.82-1.74-6.36-2.101-10.561-1.141-.418.122-.779-.179-.899-.539-.12-.421.18-.78.54-.9 4.56-1.021 8.52-.6 11.64 1.32.42.18.479.659.301 1.02zm1.44-3.3c-.301.42-.841.6-1.262.3-3.239-1.98-8.159-2.58-11.939-1.38-.479.12-1.02-.12-1.14-.6-.12-.48.12-1.021.6-1.141C9.6 9.9 15 10.561 18.72 12.84c.361.181.54.78.241 1.2zm.12-3.36C15.24 8.4 8.82 8.16 5.16 9.301c-.6.179-1.2-.181-1.38-.721-.18-.601.18-1.2.72-1.381 4.26-1.26 11.28-1.02 15.721 1.621.539.3.719 1.02.419 1.56-.299.421-1.02.599-1.559.3z"/>
              </svg>
            </div>
            <span className="font-semibold text-white" style={{ fontSize: '14px' }}>Spotify Recommender</span>
          </div>
          <span style={{ color: '#555', fontSize: '11px' }}>KNN · 167K tracks</span>
        </div>
      </nav>

      {/* Main content */}
      <main className="max-w-[720px] mx-auto px-5 pt-0 pb-6" style={{ background: '#0d0d0d' }}>
        {/* Tab bar */}
        <div className="flex" style={{ background: '#111', borderBottom: '0.5px solid #1a1a1a' }}>
          <button
            onClick={() => setActiveTab('search')}
            className="flex-1 py-3 text-center transition-all cursor-pointer"
            style={{
              fontSize: '13px',
              fontWeight: 500,
              color: activeTab === 'search' ? '#1DB954' : '#555',
              background: activeTab === 'search' ? '#0d0d0d' : 'transparent',
              borderBottom: activeTab === 'search' ? '2px solid #1DB954' : '2px solid transparent',
            }}
          >
            Search by Song
          </button>
          <button
            onClick={() => setActiveTab('vibe')}
            className="flex-1 py-3 text-center transition-all cursor-pointer"
            style={{
              fontSize: '13px',
              fontWeight: 500,
              color: activeTab === 'vibe' ? '#1DB954' : '#555',
              background: activeTab === 'vibe' ? '#0d0d0d' : 'transparent',
              borderBottom: activeTab === 'vibe' ? '2px solid #1DB954' : '2px solid transparent',
            }}
          >
            Find by Vibe
          </button>
        </div>

        {/* Tab content */}
        <div className="pt-5">
          {activeTab === 'search' ? <SearchTab /> : <VibeTab />}
        </div>
      </main>

      {/* Footer */}
      <footer style={{ background: '#080808', borderTop: '0.5px solid #141414' }} className="py-5">
        <div className="flex items-center justify-center gap-2" style={{ fontSize: '11px', color: '#2a2a2a' }}>
          <span>Built with KNN + Cosine Similarity</span>
          <span className="inline-block w-1 h-1 rounded-full" style={{ background: '#222' }} />
          <span>167K+ tracks</span>
          <span className="inline-block w-1 h-1 rounded-full" style={{ background: '#222' }} />
          <span>Sem VI Project</span>
        </div>
      </footer>
    </div>
  );
}

export default App
