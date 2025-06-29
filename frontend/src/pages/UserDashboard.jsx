// UserDashboard.jsx
import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { getEvents } from '../services/api'; // Add this import
import EventForm from '../components/common/EventForm';
import EventList from '../components/common/EventList';
import Reminders from '../components/common/Reminders';
import Announcements from '../components/admin/Announcements';
import './Dashboard.css';

const UserDashboard = () => {
  const [activeTab, setActiveTab] = useState('events');
  const [events, setEvents] = useState([]);
  const [loading, setLoading] = useState(true);
  const username = localStorage.getItem('username');
  const role = localStorage.getItem('role'); // Add role from localStorage
  const navigate = useNavigate();

  useEffect(() => {
    const fetchEvents = async () => {
      try {
        const data = await getEvents(username, role); // Use the imported getEvents
        setEvents(data);
        setLoading(false);
      } catch (error) {
        console.error('Error fetching events:', error);
        setLoading(false);
      }
    };


    fetchEvents();
  }, [username]);

  const handleLogout = () => {
    localStorage.clear();
    navigate('/');
  };

  const handleEventCreated = (newEvent) => {
    setEvents([...events, newEvent]);
  };

  const handleEventDeleted = (eventId) => {
    setEvents(events.filter(event => event.id !== eventId));
  };

  return (
    <div className="dashboard">
      <div className="sidebar">
        <h2>User Dashboard</h2>
        <p>Welcome, {username}</p>
        
        <div className="nav-links">
          <button 
            className={activeTab === 'events' ? 'active' : ''}
            onClick={() => setActiveTab('events')}
          >
            My Events
          </button>
          <button 
            className={activeTab === 'create' ? 'active' : ''}
            onClick={() => setActiveTab('create')}
          >
            Create Event
          </button>
          <button 
            className={activeTab === 'reminders' ? 'active' : ''}
            onClick={() => setActiveTab('reminders')}
          >
            Reminders
          </button>
          <button 
            className={activeTab === 'announcements' ? 'active' : ''}
            onClick={() => setActiveTab('announcements')}
          >
            Announcements
          </button>
        </div>
        
        <button className="logout-btn" onClick={handleLogout}>
          Logout
        </button>
      </div>

      <div className="main-content">
        {activeTab === 'events' && (
          <EventList 
            events={events} 
            loading={loading} 
            onDelete={handleEventDeleted} 
            isAdmin={false}
          />
        )}
        
        {activeTab === 'create' && (
          <EventForm onEventCreated={handleEventCreated} />
        )}
        
        {activeTab === 'reminders' && (
          <Reminders username={username} />
        )}
        
        {activeTab === 'announcements' && (
          <Announcements />
        )}
      </div>
    </div>
  );
};

export default UserDashboard;