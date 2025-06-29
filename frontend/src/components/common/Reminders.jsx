import { useEffect, useState } from 'react';
import { getEvents } from '../../services/api';
import './Reminders.css';

const Reminders = ({ username }) => {
  // State for storing upcoming events
  const [upcomingEvents, setUpcomingEvents] = useState([]);
  
  // Loading state
  const [loading, setLoading] = useState(true);
  
  // Notification permission states
  const [showPermissionPrompt, setShowPermissionPrompt] = useState(false);
  const [notificationSupported, setNotificationSupported] = useState(false);

  // Check if notifications are supported when component mounts
  useEffect(() => {
    setNotificationSupported('Notification' in window);
    if ('Notification' in window && Notification.permission === 'default') {
      setShowPermissionPrompt(true);
    }
  }, []);

  // Fetch upcoming events and set up refresh interval
  useEffect(() => {
    const fetchUpcomingEvents = async () => {
      try {
        setLoading(true);
        const allEvents = await getEvents(username, 'User');
        
        const now = new Date();
        const tomorrow = new Date(now);
        tomorrow.setDate(tomorrow.getDate() + 1);
        
        // Filter events happening in the next 24 hours
        const upcoming = allEvents.filter(event => {
          const eventDate = new Date(`${event.date}T${event.time}`);
          return eventDate > now && eventDate < tomorrow;
        });
        
        setUpcomingEvents(upcoming);
        
        // Show notifications if permission granted
        if (Notification.permission === 'granted') {
          showNotifications(upcoming);
        }
      } catch (error) {
        console.error('Error fetching upcoming events:', error);
      } finally {
        setLoading(false);
      }
    };
    
    fetchUpcomingEvents();
    
    // Set up interval to check for new events every hour
    const interval = setInterval(fetchUpcomingEvents, 60 * 60 * 1000);
    
    // Cleanup interval on component unmount
    return () => clearInterval(interval);
  }, [username]);

  // Request notification permission
  const requestNotificationPermission = async () => {
    try {
      const permission = await Notification.requestPermission();
      if (permission === 'granted') {
        setShowPermissionPrompt(false);
        showNotifications(upcomingEvents);
        return true;
      }
    } catch (error) {
      console.error('Error requesting notification permission:', error);
    }
    return false;
  };

  // Display notifications for events
  const showNotifications = (events) => {
    if (!notificationSupported || Notification.permission !== 'granted') return;
    
    events.forEach(event => {
      try {
        new Notification(`Upcoming: ${event.name}`, {
          body: `Happening at ${event.time} - ${event.location}`,
          icon: '/notification-icon.png',
          tag: `event-reminder-${event.id}`
        });
      } catch (error) {
        console.error('Error showing notification:', error);
      }
    });
  };

  // Render loading state
  if (loading) {
    return (
      <div className="reminders-container">
        <h3>Upcoming Events (Next 24 Hours)</h3>
        <div>Loading reminders...</div>
      </div>
    );
  }

  // Render main component
  return (
    <div className="reminders-container">
      <h3>Upcoming Events (Next 24 Hours)</h3>
      
      {/* Notification permission prompt */}
      {notificationSupported && showPermissionPrompt && (
        <div className="notification-prompt">
          <span>Get notified about upcoming events?</span>
          <button 
            onClick={requestNotificationPermission}
            aria-label="Enable notifications"
          >
            Enable Notifications
          </button>
        </div>
      )}
      
      {/* Empty state */}
      {upcomingEvents.length === 0 ? (
        <div>No upcoming events in the next 24 hours.</div>
      ) : (
        <div className="reminders-list">
          {upcomingEvents.map(event => (
            <div key={event.id} className="reminder-item">
              <h4>{event.name}</h4>
              <p>
                <strong>When:</strong> {event.date} at {event.time}
              </p>
              <p>
                <strong>Where:</strong> {event.location}
              </p>
              {event.description && <p>{event.description}</p>}
            </div>
          ))}
        </div>
      )}
    </div>
  );
};

export default Reminders;