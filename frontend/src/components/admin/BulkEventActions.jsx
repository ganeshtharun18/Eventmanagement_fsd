import React, { useState, useEffect } from 'react';
import { getEvents, bulkEventAction } from '../../services/api';
import './BulkEventActions.css';

const BulkEventActions = () => {
  const [events, setEvents] = useState([]);
  const [selectedEvents, setSelectedEvents] = useState([]);
  const [action, setAction] = useState('delete');
  const [newLocation, setNewLocation] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);

  useEffect(() => {
    const fetchEvents = async () => {
      try {
        const data = await getEvents('', 'Admin'); // Get all events for admin
        setEvents(data);
      } catch (err) {
        setError(err.message || 'Failed to fetch events');
      }
    };
    fetchEvents();
  }, []);

  const toggleEventSelection = (eventId) => {
    setSelectedEvents(prev => 
      prev.includes(eventId) 
        ? prev.filter(id => id !== eventId) 
        : [...prev, eventId]
    );
  };

  const handleBulkAction = async () => {
    if (selectedEvents.length === 0) {
      setError('Please select at least one event');
      return;
    }

    if (action === 'update' && !newLocation.trim()) {
      setError('New location cannot be empty');
      return;
    }

    setLoading(true);
    setError(null);

    try {
      const response = await bulkEventAction({
        event_ids: selectedEvents,
        action,
        ...(action === 'update' && { new_location: newLocation })
      });

      if (response.success) {
        alert(`Successfully ${action}d ${response.affected} events`);
        const data = await getEvents('', 'Admin');
        setEvents(data);
        setSelectedEvents([]);
        setNewLocation('');
      } else {
        setError(response.message || 'Failed to perform bulk action');
      }
    } catch (err) {
      setError(err.message || 'Error performing bulk action');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="bulk-actions">
      <h2>Bulk Event Actions</h2>

      {error && <div className="error-message">{error}</div>}

      <div className="action-controls">
        <select 
          value={action} 
          onChange={(e) => setAction(e.target.value)}
        >
          <option value="delete">Delete Events</option>
          <option value="update">Update Location</option>
        </select>

        {action === 'update' && (
          <input
            type="text"
            placeholder="New location"
            value={newLocation}
            onChange={(e) => setNewLocation(e.target.value)}
          />
        )}

        <button 
          onClick={handleBulkAction}
          disabled={loading || selectedEvents.length === 0}
        >
          {loading ? 'Processing...' : 'Apply Action'}
        </button>
      </div>

      <div className="events-list">
        <h3>Select Events</h3>
        <div className="events-grid">
          {events.map(event => (
            <div 
              key={event.id} 
              className={`event-card ${selectedEvents.includes(event.id) ? 'selected' : ''}`}
              onClick={() => toggleEventSelection(event.id)}
            >
              <h4>{event.name}</h4>
              <p>{event.date} at {event.time}</p>
              <p>{event.location}</p>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
};

export default BulkEventActions;
