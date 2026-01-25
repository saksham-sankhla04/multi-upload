import { useState } from 'react';

export default function App() {
  const [content, setContent] = useState('');
  const [twitter, setTwitter] = useState(true);
  const [linkedin, setLinkedin] = useState(true);
  const [loading, setLoading] = useState(false);
  const [results, setResults] = useState(null);

  const handlePost = async () => {
    const platforms = [];
    if (twitter) platforms.push('twitter');
    if (linkedin) platforms.push('linkedin');

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
          <input type="checkbox" checked={twitter} onChange={(e) => setTwitter(e.target.checked)} />
          Twitter (X)
        </label>
        <label>
          <input type="checkbox" checked={linkedin} onChange={(e) => setLinkedin(e.target.checked)} />
          LinkedIn
        </label>
      </div>
      <button onClick={handlePost} disabled={loading}>
        {loading ? 'Posting...' : 'Post Now'}
      </button>

      {results && (
        <div className="results">
          {results.twitter && (
            <div className={`result ${results.twitter.success ? 'success' : 'error'}`}>
              Twitter: {results.twitter.success ? `Posted! ID: ${results.twitter.id}` : `Error: ${results.twitter.error}`}
            </div>
          )}
          {results.linkedin && (
            <div className={`result ${results.linkedin.success ? 'success' : 'error'}`}>
              LinkedIn: {results.linkedin.success ? `Posted! ID: ${results.linkedin.id}` : `Error: ${results.linkedin.error}`}
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
