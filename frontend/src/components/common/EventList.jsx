import React, { useState } from 'react';
import { FaEdit, FaTrash, FaCalendarAlt, FaClock, FaMapMarkerAlt } from 'react-icons/fa';
import { getEvents, deleteEvent } from '../../services/api';
import EventForm from './EventForm';
import './EventList.css';

const EventList = ({ events, loading, onDelete, isAdmin }) => {
  const [editingEvent, setEditingEvent] = useState(null);

  const handleDelete = async (eventId) => {
    if (window.confirm('Are you sure you want to delete this event?')) {
      try {
        await deleteEvent(eventId);
        onDelete(eventId);
      } catch (error) {
        console.error('Error deleting event:', error);
      }
    }
  };

  const handleEditComplete = (updatedEvent) => {
    setEditingEvent(null);
    if (onDelete) {
      onDelete(updatedEvent.id); // Triggers parent to refresh events
    }
  };

  if (loading) {
    return (
      <div className="loading-container">
        <div className="loading-spinner"></div>
        <p>Loading events...</p>
      </div>
    );
  }

  if (!events || events.length === 0) {
    return (
      <div className="no-events">
        <p>No events found. Create your first event!</p>
      </div>
    );
  }

  return (
    <div className="event-list-container">
      {editingEvent ? (
        <div className="edit-event-container">
          <h3>Edit Event</h3>
          <EventForm 
            eventData={editingEvent} 
            onEventUpdated={handleEditComplete} 
            onCancel={() => setEditingEvent(null)}
          />
        </div>
      ) : (
        <>
          <div className="event-list-header">
            <h2>{isAdmin ? 'All Events' : 'My Events'}</h2>
            <p className="event-count">{events.length} {events.length === 1 ? 'event' : 'events'} found</p>
          </div>
          
          <div className="events-grid">
            {events.map(event => (
              <div key={event.id} className="event-card">
                <div className="event-card-header">
                  <h3 className="event-title">{event.name}</h3>
                  <div className="event-actions">
                    <button 
                      className="action-btn edit-btn"
                      onClick={() => setEditingEvent(event)}
                      aria-label="Edit event"
                    >
                      <FaEdit />
                    </button>
                    <button 
                      className="action-btn delete-btn"
                      onClick={() => handleDelete(event.id)}
                      aria-label="Delete event"
                    >
                      <FaTrash />
                    </button>
                  </div>
                </div>
                
                <p className="event-description">{event.description}</p>
                
                <div className="event-details">
                  <div className="detail-item">
                    <FaCalendarAlt className="detail-icon" />
                    <span>{event.date}</span>
                  </div>
                  <div className="detail-item">
                    <FaClock className="detail-icon" />
                    <span>{event.time}</span>
                  </div>
                  <div className="detail-item">
                    <FaMapMarkerAlt className="detail-icon" />
                    <span>{event.location}</span>
                  </div>
                </div>
                
                {event.categories && event.categories.length > 0 && (
                  <div className="event-categories">
                    {event.categories.map((cat, index) => (
                      <span 
                        key={index} 
                        className="category-tag"
                        style={{ 
                          backgroundColor: cat.color || '#e0f7fa',
                          color: cat.color ? '#fff' : '#00838f'
                        }}
                      >
                        {cat.name || cat}
                      </span>
                    ))}
                  </div>
                )}
              </div>
            ))}
          </div>
        </>
      )}
    </div>
  );
};

export default EventList;