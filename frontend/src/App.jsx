import { useState } from 'react';

export default function App() {
  const [content, setContent] = useState('');
  const [linkedin, setLinkedin] = useState(true);
  const [bluesky, setBluesky] = useState(true);
  const [loading, setLoading] = useState(false);
  const [results, setResults] = useState(null);

  const handlePost = async () => {
    const platforms = [];
    if (linkedin) platforms.push('linkedin');
    if (bluesky) platforms.push('bluesky');

    if (!content.trim() || platforms.length === 0) {
      alert('Enter content and select at least one platform');
      return;
    }

    setLoading(true);
    setResults(null);

    try {
      const res = await fetch('http://localhost:3001/publish', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ content, platforms }),
      });
      const data = await res.json();
      setResults(data.results);
    } catch (err) {
      setResults({ error: err.message });
    } finally {
      setLoading(false);
    }
  };

  return (
    <div>
      <h1>Multi-Post</h1>
      <textarea
        value={content}
        onChange={(e) => setContent(e.target.value)}
        placeholder="What's on your mind?"
        maxLength={280}
      />
      <div className="checkboxes">
        <label>
          <input type="checkbox" checked={linkedin} onChange={(e) => setLinkedin(e.target.checked)} />
          LinkedIn
        </label>
        <label>
          <input type="checkbox" checked={bluesky} onChange={(e) => setBluesky(e.target.checked)} />
          Bluesky
        </label>
      </div>
      <button onClick={handlePost} disabled={loading}>
        {loading ? 'Posting...' : 'Post Now'}
      </button>

      {results && (
        <div className="results">
          {results.linkedin && (
            <div className={`result ${results.linkedin.success ? 'success' : 'error'}`}>
              LinkedIn: {results.linkedin.success ? `Posted! ID: ${results.linkedin.id}` : `Error: ${results.linkedin.error}`}
            </div>
          )}
          {results.bluesky && (
            <div className={`result ${results.bluesky.success ? 'success' : 'error'}`}>
              Bluesky: {results.bluesky.success ? `Posted! ID: ${results.bluesky.id}` : `Error: ${results.bluesky.error}`}
            </div>
          )}
          {results.error && (
            <div className="result error">Error: {results.error}</div>
          )}
        </div>
      )}
    </div>
  );
}
