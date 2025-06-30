import React, { useState, useEffect } from 'react';
import { createEvent, updateEvent, getCategories } from '../../services/api';
import './EventForm.css';

const EventForm = ({ eventData, onEventCreated, onEventUpdated }) => {
  const [formData, setFormData] = useState({
    name: '',
    description: '',
    date: '',
    time: '',
    timePeriod: 'AM',
    location: '',
    categories: []
  });
  const [categories, setCategories] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');

  // Get today's date in YYYY-MM-DD format
  const getTodayDate = () => {
    const today = new Date();
    return today.toISOString().split('T')[0];
  };

  useEffect(() => {
    const today = getTodayDate();
    
    // Initialize form with event data if editing
    if (eventData) {
      const [time, period] = convertTo12HourFormat(eventData.time);
      setFormData({
        name: eventData.name || '',
        description: eventData.description || '',
        date: eventData.date || today,
        time: time || '',
        timePeriod: period || 'AM',
        location: eventData.location || '',
        categories: eventData.categories || []
      });
    } else {
      // Set default date to today for new events
      setFormData(prev => ({
        ...prev,
        date: today
      }));
    }

    // Fetch categories
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

  // Convert 24-hour time to 12-hour format
  const convertTo12HourFormat = (time24) => {
    if (!time24) return ['', 'AM'];
    const [hours, minutes] = time24.split(':');
    const hour = parseInt(hours);
    const period = hour >= 12 ? 'PM' : 'AM';
    const hour12 = hour % 12 || 12;
    return [`${hour12}:${minutes}`, period];
  };

  // Convert 12-hour time to 24-hour format
  const convertTo24HourFormat = (time12, period) => {
    if (!time12) return '';
    let [hours, minutes] = time12.split(':');
    hours = parseInt(hours);
    if (period === 'PM' && hours < 12) hours += 12;
    if (period === 'AM' && hours === 12) hours = 0;
    return `${hours.toString().padStart(2, '0')}:${minutes}`;
  };

  // Handle input changes
  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: value
    }));
  };

  // Handle category changes
  const handleCategoryChange = (e) => {
    const { value, checked } = e.target;
    setFormData(prev => ({
      ...prev,
      categories: checked
        ? [...prev.categories, value]
        : prev.categories.filter(id => id !== value)
    }));
  };

  // Validate if selected date is today or in the future
  const isValidDate = (selectedDate) => {
    const today = new Date(getTodayDate());
    const selected = new Date(selectedDate);
    return selected >= today;
  };

  // Handle form submission
  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    setError('');
    setSuccess('');

    try {
      // Validate date is today or in the future
      if (!isValidDate(formData.date)) {
        throw new Error('Event date must be today or a future date');
      }

      // Validate time input
      if (!formData.time.match(/^\d{1,2}:\d{2}$/)) {
        throw new Error('Please enter a valid time (e.g., 2:30)');
      }

      const username = localStorage.getItem('username');
      const event = {
        ...formData,
        username,
        time: convertTo24HourFormat(formData.time, formData.timePeriod),
        categories: formData.categories.map(id => parseInt(id))
      };

      let response;
      if (eventData) {
        response = await updateEvent(eventData.id, event);
        setSuccess('Event updated successfully!');
        if (onEventUpdated) onEventUpdated(response);
      } else {
        response = await createEvent(event);
        setSuccess('Event created successfully!');
        if (onEventUpdated) onEventUpdated(response);
      }

      // Reset form if creating new event
      if (!eventData) {
        setFormData({
          name: '',
          description: '',
          date: getTodayDate(),
          time: '',
          timePeriod: 'AM',
          location: '',
          categories: []
        });
      }
    } catch (err) {
      setError(err.message || 'Failed to create event. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  // Auto-clear messages after 5 seconds
  useEffect(() => {
    const timer = setTimeout(() => {
      if (success || error) {
        setSuccess('');
        setError('');
      }
    }, 5000);
    return () => clearTimeout(timer);
  }, [success, error]);

  return (
    <div className="event-form-container">
      <h2>{eventData ? 'Edit Event' : 'Create New Event'}</h2>
      
      {error && <div className="alert error">{error}</div>}
      {success && <div className="alert success">{success}</div>}
      
      <form onSubmit={handleSubmit}>
        <div className="form-group">
          <label>Event Name</label>
          <input
            type="text"
            name="name"
            value={formData.name}
            onChange={handleChange}
            required
            maxLength={100}
          />
        </div>
        
        <div className="form-group">
          <label>Description</label>
          <textarea
            name="description"
            value={formData.description}
            onChange={handleChange}
            required
            rows={4}
            maxLength={500}
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
              min={getTodayDate()}
              required
            />
          </div>
          
          <div className="form-group time-group">
            <label>Time</label>
            <div className="time-inputs">
              <input
                type="text"
                name="time"
                value={formData.time}
                onChange={handleChange}
                placeholder="2:30"
                pattern="\d{1,2}:\d{2}"
                title="Enter time in format HH:MM"
                required
              />
              <select
                name="timePeriod"
                value={formData.timePeriod}
                onChange={handleChange}
              >
                <option value="AM">AM</option>
                <option value="PM">PM</option>
              </select>
            </div>
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
            maxLength={100}
          />
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
        
        <button type="submit" disabled={loading} className="submit-btn">
          {loading ? (
            <>
              <span className="spinner"></span>
              {eventData ? 'Updating...' : 'Creating...'}
            </>
          ) : (
            eventData ? 'Update Event' : 'Create Event'
          )}
        </button>
      </form>
    </div>
  );
};

export default EventForm;