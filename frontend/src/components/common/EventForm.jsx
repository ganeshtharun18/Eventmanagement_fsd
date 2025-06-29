import React, { useState, useEffect } from 'react';
import { createEvent, updateEvent, getCategories } from '../../services/api';
import LocationPicker from './LocationPicker';
import './EventForm.css';

const EventForm = ({ eventData, onEventCreated, onEventUpdated }) => {
  const [formData, setFormData] = useState({
    name: '',
    description: '',
    date: '',
    time: '',
    location: '',
    categories: []
  });
  const [categories, setCategories] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [location, setLocation] = useState(null);

  useEffect(() => {
    if (eventData) {
      setFormData({
        name: eventData.name || '',
        description: eventData.description || '',
        date: eventData.date || '',
        time: eventData.time || '',
        location: eventData.location || '',
        categories: eventData.categories || []
      });
    }

    const fetchCategories = async () => {
      try {
        const data = await getCategories();
        setCategories(data);
      } catch (err) {
        console.error('Error fetching categories:', err);
      }
    };

    fetchCategories();
  }, [eventData]);

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: value
    }));
  };

  const handleCategoryChange = (e) => {
    const { value, checked } = e.target;
    setFormData(prev => ({
      ...prev,
      categories: checked
        ? [...prev.categories, value]
        : prev.categories.filter(id => id !== value)
    }));
  };

  const handleLocationSelect = (selectedLocation) => {
    setLocation(selectedLocation);
    setFormData(prev => ({
      ...prev,
      location: selectedLocation.address
    }));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    setError('');

    try {
      const username = localStorage.getItem('username');
      const event = {
        ...formData,
        username,
        categories: formData.categories.map(id => parseInt(id))
      };

      let response;
      if (eventData) {
        response = await updateEvent(eventData.id, event);
        if (onEventUpdated) onEventUpdated(response);
      } else {
        response = await createEvent(event);
        if (onEventCreated) onEventCreated(response);
      }

      // Reset form if creating new event
      if (!eventData) {
        setFormData({
          name: '',
          description: '',
          date: '',
          time: '',
          location: '',
          categories: []
        });
        setLocation(null);
      }
    } catch (err) {
      setError(err.message || 'An error occurred');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="event-form-container">
      <h2>{eventData ? 'Edit Event' : 'Create New Event'}</h2>
      
      {error && <div className="error-message">{error}</div>}
      
      <form onSubmit={handleSubmit}>
        <div className="form-group">
          <label>Event Name</label>
          <input
            type="text"
            name="name"
            value={formData.name}
            onChange={handleChange}
            required
          />
        </div>
        
        <div className="form-group">
          <label>Description</label>
          <textarea
            name="description"
            value={formData.description}
            onChange={handleChange}
            required
          />
        </div>
        
        <div className="form-row">
          <div className="form-group">
            <label>Date</label>
            <input
              type="date"
              name="date"
              value={formData.date}
              onChange={handleChange}
              required
            />
          </div>
          
          <div className="form-group">
            <label>Time</label>
            <input
              type="time"
              name="time"
              value={formData.time}
              onChange={handleChange}
              required
            />
          </div>
        </div>
        
        <div className="form-group">
          <label>Location</label>
          <input
            type="text"
            name="location"
            value={formData.location}
            onChange={handleChange}
            required
          />
          <LocationPicker onLocationSelect={handleLocationSelect} />
        </div>
        
        {categories.length > 0 && (
          <div className="form-group">
            <label>Categories</label>
            <div className="category-checkboxes">
              {categories.map(category => (
                <label key={category.id} className="checkbox-label">
                  <input
                    type="checkbox"
                    value={category.id}
                    checked={formData.categories.includes(category.id.toString())}
                    onChange={handleCategoryChange}
                  />
                  <span 
                    className="category-tag" 
                    style={{ backgroundColor: category.color }}
                  >
                    {category.name}
                  </span>
                </label>
              ))}
            </div>
          </div>
        )}
        
        <button type="submit" disabled={loading}>
          {loading ? 'Saving...' : 'Save Event'}
        </button>
      </form>
    </div>
  );
};

export default EventForm;