import { useState, useEffect, useRef } from 'react';

const API = 'http://localhost:3001';

export default function PostPage() {
  const [content, setContent] = useState('');
  const [linkedin, setLinkedin] = useState(false);
  const [bluesky, setBluesky] = useState(false);
  const [connectedPlatforms, setConnectedPlatforms] = useState([]);
  const [loading, setLoading] = useState(false);
  const [results, setResults] = useState(null);
  const [files, setFiles] = useState([]);
  const fileInputRef = useRef(null);

  useEffect(() => {
    fetch(`${API}/settings/accounts`, { credentials: 'include' })
      .then((r) => r.json())
      .then((data) => {
        const platforms = data.accounts.map((a) => a.platform);
        setConnectedPlatforms(platforms);
        setLinkedin(platforms.includes('linkedin'));
        setBluesky(platforms.includes('bluesky'));
      });
  }, []);

  const handleFiles = (e) => {
    const selected = Array.from(e.target.files);
    setFiles((prev) => [...prev, ...selected].slice(0, 4));
  };

  const removeFile = (index) => {
    setFiles((prev) => prev.filter((_, i) => i !== index));
  };

  const handlePost = async () => {
    const platforms = [];
    if (linkedin) platforms.push('linkedin');
    if (bluesky) platforms.push('bluesky');

    if ((!content.trim() && files.length === 0) || platforms.length === 0) {
      alert('Enter content or attach media, and select at least one platform');
      return;
    }

    setLoading(true);
    setResults(null);

    try {
      const formData = new FormData();
      formData.append('content', content);
      formData.append('platforms', JSON.stringify(platforms));
      files.forEach((file) => formData.append('media', file));

      const res = await fetch(`${API}/publish`, {
        method: 'POST',
        credentials: 'include',
        body: formData,
      });
      const data = await res.json();
      setResults(data.results);
    } catch (err) {
      setResults({ error: err.message });
    } finally {
      setLoading(false);
    }
  };

  const isConnected = (platform) => connectedPlatforms.includes(platform);

  return (
    <div>
      <h1>Create Post</h1>
      <textarea
        value={content}
        onChange={(e) => setContent(e.target.value)}
        placeholder="What's on your mind?"
      />

      <div className="media-section">
        <button type="button" className="attach-btn" onClick={() => fileInputRef.current.click()}>
          + Attach Media
        </button>
        <input
          ref={fileInputRef}
          type="file"
          multiple
          accept="image/*,video/*"
          onChange={handleFiles}
          style={{ display: 'none' }}
        />
        <span className="media-hint">Images (max 4)</span>
      </div>

      {files.length > 0 && (
        <div className="preview-grid">
          {files.map((file, i) => (
            <div key={i} className="preview-item">
              {file.type.startsWith('video/') ? (
                <video src={URL.createObjectURL(file)} className="preview-thumb" />
              ) : (
                <img src={URL.createObjectURL(file)} className="preview-thumb" alt="" />
              )}
              <button className="remove-btn" onClick={() => removeFile(i)}>x</button>
              <span className="file-name">{file.name}</span>
            </div>
          ))}
        </div>
      )}

      <div className="checkboxes">
        <label className={!isConnected('linkedin') ? 'disabled' : ''}>
          <input
            type="checkbox"
            checked={linkedin}
            onChange={(e) => setLinkedin(e.target.checked)}
            disabled={!isConnected('linkedin')}
          />
          LinkedIn {!isConnected('linkedin') && '(not connected)'}
        </label>
        <label className={!isConnected('bluesky') ? 'disabled' : ''}>
          <input
            type="checkbox"
            checked={bluesky}
            onChange={(e) => setBluesky(e.target.checked)}
            disabled={!isConnected('bluesky')}
          />
          Bluesky {!isConnected('bluesky') && '(not connected)'}
        </label>
      </div>

      {connectedPlatforms.length === 0 && (
        <div className="result error">No accounts connected. Go to Settings to connect your socials.</div>
      )}

      <button onClick={handlePost} disabled={loading || connectedPlatforms.length === 0}>
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
