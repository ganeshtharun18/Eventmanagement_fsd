import React, { useState, useEffect } from 'react';
import { getAnnouncements, createAnnouncement } from '../../services/api';
import './Announcements.css';

const Announcements = () => {
  const [announcements, setAnnouncements] = useState([]);
  const [title, setTitle] = useState('');
  const [content, setContent] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');

  // Fetch recent announcements on mount
  const fetchAnnouncements = async () => {
    try {
      const data = await getAnnouncements();
      setAnnouncements(data);
    } catch (err) {
      console.error('Failed to fetch announcements:', err);
      setError('Failed to load announcements.');
    }
  };

  useEffect(() => {
    fetchAnnouncements();
  }, []);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    setError('');
    setSuccess('');

    try {
      const response = await createAnnouncement({ title, content });

      if (response.success) {
        setSuccess('Announcement posted successfully!');
        setTitle('');
        setContent('');
        fetchAnnouncements(); // Refresh list
      } else {
        setError(response.message || 'Failed to create announcement');
      }
    } catch (err) {
      console.error('Create error:', err);
      setError('Error sending announcement.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="announcements">
      <h3>Create Announcement</h3>
      <form onSubmit={handleSubmit}>
        <input
          type="text"
          placeholder="Title"
          value={title}
          onChange={(e) => setTitle(e.target.value)}
          required
        />
        <textarea
          placeholder="Content"
          value={content}
          onChange={(e) => setContent(e.target.value)}
          required
        />
        <button type="submit" disabled={loading}>
          {loading ? 'Sending...' : 'Send Announcement'}
        </button>
      </form>

      {error && <p className="error-msg">{error}</p>}
      {success && <p className="success-msg">{success}</p>}

      <h3>Recent Announcements</h3>
      {announcements.length === 0 ? (
        <p>No announcements yet.</p>
      ) : (
        announcements.map((ann) => (
          <div key={ann.id} className="announcement">
            <h4>{ann.title}</h4>
            <p>{ann.content}</p>
            <small>
              Posted by {ann.created_by ?? 'Unknown'} on{' '}
              {ann.created_at
                ? new Date(ann.created_at).toLocaleString()
                : 'Unknown time'}
            </small>
          </div>
        ))
      )}
    </div>
  );
};

export default Announcements;
