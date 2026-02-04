import { useState, useEffect, useRef } from 'react';
import { useToast } from '../components/Toast';
import { ButtonSpinner } from '../components/Spinner';

const API = 'http://localhost:3001';
const MAX_CHARS = 280; // Bluesky limit

export default function PostPage() {
  const [content, setContent] = useState('');
  const [linkedin, setLinkedin] = useState(false);
  const [bluesky, setBluesky] = useState(false);
  const [connectedPlatforms, setConnectedPlatforms] = useState([]);
  const [loadingAccounts, setLoadingAccounts] = useState(true);
  const [posting, setPosting] = useState(false);
  const [files, setFiles] = useState([]);
  const fileInputRef = useRef(null);
  const toast = useToast();

  useEffect(() => {
    fetch(`${API}/settings/accounts`, { credentials: 'include' })
      .then((r) => r.json())
      .then((data) => {
        const platforms = data.accounts.map((a) => a.platform);
        setConnectedPlatforms(platforms);
        setLinkedin(platforms.includes('linkedin'));
        setBluesky(platforms.includes('bluesky'));
      })
      .catch(() => toast.error('Failed to load connected accounts'))
      .finally(() => setLoadingAccounts(false));
  }, []);

  const handleFiles = (e) => {
    const selected = Array.from(e.target.files);
    const newFiles = [...files, ...selected].slice(0, 4);
    setFiles(newFiles);
    if (selected.length > 0) {
      toast.info(`${selected.length} file(s) attached`);
    }
  };

  const removeFile = (index) => {
    setFiles((prev) => prev.filter((_, i) => i !== index));
  };

  const handlePost = async () => {
    const platforms = [];
    if (linkedin) platforms.push('linkedin');
    if (bluesky) platforms.push('bluesky');

    if ((!content.trim() && files.length === 0) || platforms.length === 0) {
      toast.warning('Enter content or attach media, and select at least one platform');
      return;
    }

    setPosting(true);

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

      // Show toast for each platform result
      if (data.results) {
        let hasSuccess = false;
        if (data.results.linkedin) {
          if (data.results.linkedin.success) {
            toast.success('Posted to LinkedIn!');
            hasSuccess = true;
          } else {
            toast.error(`LinkedIn: ${data.results.linkedin.error}`);
          }
        }
        if (data.results.bluesky) {
          if (data.results.bluesky.success) {
            toast.success('Posted to Bluesky!');
            hasSuccess = true;
          } else {
            toast.error(`Bluesky: ${data.results.bluesky.error}`);
          }
        }

        // Clear form on success
        if (hasSuccess) {
          setContent('');
          setFiles([]);
        }
      }
    } catch (err) {
      toast.error(err.message || 'Failed to post');
    } finally {
      setPosting(false);
    }
  };

  const isConnected = (platform) => connectedPlatforms.includes(platform);
  const charCount = content.length;
  const charCountClass = charCount > MAX_CHARS ? 'error' : charCount > MAX_CHARS - 20 ? 'warning' : '';

  if (loadingAccounts) {
    return (
      <div>
        <h1>Create Post</h1>
        <div className="skeleton" style={{ height: 120, marginBottom: 16 }} />
        <div className="skeleton" style={{ height: 44, width: 140, marginBottom: 16 }} />
        <div style={{ display: 'flex', gap: 12, marginBottom: 16 }}>
          <div className="skeleton" style={{ height: 50, flex: 1 }} />
          <div className="skeleton" style={{ height: 50, flex: 1 }} />
        </div>
        <div className="skeleton" style={{ height: 48 }} />
      </div>
    );
  }

  return (
    <div>
      <h1>Create Post</h1>
      <textarea
        value={content}
        onChange={(e) => setContent(e.target.value)}
        placeholder="What's on your mind?"
        disabled={posting}
      />
      <div className={`char-counter ${charCountClass}`}>
        {charCount} / {MAX_CHARS}
      </div>

      <div className="media-section">
        <button
          type="button"
          className="attach-btn"
          onClick={() => fileInputRef.current.click()}
          disabled={posting || files.length >= 4}
        >
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
        <span className="media-hint">
          {files.length > 0 ? `${files.length}/4 files` : 'Images (max 4)'}
        </span>
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
              <button
                className="remove-btn"
                onClick={() => removeFile(i)}
                disabled={posting}
                title="Remove"
              >
                ×
              </button>
              <span className="file-name">{file.name}</span>
            </div>
          ))}
        </div>
      )}

      <div className="platform-checkboxes">
        <label
          className={`platform-checkbox ${linkedin ? 'checked' : ''} ${!isConnected('linkedin') ? 'disabled' : ''}`}
        >
          <input
            type="checkbox"
            checked={linkedin}
            onChange={(e) => setLinkedin(e.target.checked)}
            disabled={!isConnected('linkedin') || posting}
          />
          <span className="platform-name">LinkedIn</span>
          {!isConnected('linkedin') && <span className="platform-status">Not connected</span>}
        </label>
        <label
          className={`platform-checkbox ${bluesky ? 'checked' : ''} ${!isConnected('bluesky') ? 'disabled' : ''}`}
        >
          <input
            type="checkbox"
            checked={bluesky}
            onChange={(e) => setBluesky(e.target.checked)}
            disabled={!isConnected('bluesky') || posting}
          />
          <span className="platform-name">Bluesky</span>
          {!isConnected('bluesky') && <span className="platform-status">Not connected</span>}
        </label>
      </div>

      {connectedPlatforms.length === 0 && (
        <div className="result warning">
          No accounts connected. Go to Settings to connect your social accounts.
        </div>
      )}

      <button
        onClick={handlePost}
        disabled={posting || connectedPlatforms.length === 0 || (!linkedin && !bluesky)}
      >
        {posting ? (
          <>
            <ButtonSpinner /> Posting...
          </>
        ) : (
          'Post Now'
        )}
      </button>
    </div>
  );
}
