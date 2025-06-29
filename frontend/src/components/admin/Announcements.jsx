import React, { useState, useEffect } from 'react';
import { getAnnouncements, createAnnouncement } from '../../services/api';
import './Announcements.css';

const Announcements = () => {
  const [announcements, setAnnouncements] = useState([]);
  const [title, setTitle] = useState('');
  const [content, setContent] = useState('');
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    const fetchAnnouncements = async () => {
      const data = await getAnnouncements();
      setAnnouncements(data);
    };
    fetchAnnouncements();
  }, []);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    await createAnnouncement({ title, content });
    const data = await getAnnouncements();
    setAnnouncements(data);
    setTitle('');
    setContent('');
    setLoading(false);
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

      <h3>Recent Announcements</h3>
      {announcements.map(ann => (
        <div key={ann.id} className="announcement">
          <h4>{ann.title}</h4>
          <p>{ann.content}</p>
          <small>Posted by {ann.created_by} on {new Date(ann.created_at).toLocaleString()}</small>
        </div>
      ))}
    </div>
  );
};

export default Announcements;