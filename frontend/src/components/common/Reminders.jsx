import { useEffect, useState } from 'react';
import { getUpcomingEvents } from '../../services/api';
import './Reminders.css';

const Reminders = ({ username }) => {
  const [upcomingEvents, setUpcomingEvents] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [notificationPermission, setNotificationPermission] = useState('default');
  const [showPermissionPrompt, setShowPermissionPrompt] = useState(false);

  // Check notification support and permission status
  useEffect(() => {
    if ('Notification' in window) {
      setNotificationPermission(Notification.permission);
      setShowPermissionPrompt(Notification.permission === 'default');
    }
  }, []);

  // Fetch upcoming events (next 24 hours)
  useEffect(() => {
    const fetchUpcomingEvents = async () => {
      try {
        setLoading(true);
        setError(null);
        
        // Get current time and time 24 hours from now
        const now = new Date();
        const twentyFourHoursLater = new Date(now.getTime() + 24 * 60 * 60 * 1000);
        
        // Format dates for API call
        const formatDate = (date) => date.toISOString().split('T')[0];
        const formatTime = (date) => date.toTimeString().substring(0, 5);
        
        const events = await getUpcomingEvents(
          username,
          formatDate(now),
          formatTime(now),
          formatDate(twentyFourHoursLater),
          formatTime(twentyFourHoursLater)
        );
        
        setUpcomingEvents(events);
        
        // Show notifications if permission granted
        if (notificationPermission === 'granted') {
          showNotifications(events);
        }
      } catch (err) {
        console.error('Error fetching reminders:', err);
        setError('Failed to load upcoming events');
      } finally {
        setLoading(false);
      }
    };

    fetchUpcomingEvents();

    // Refresh every hour
    const interval = setInterval(fetchUpcomingEvents, 60 * 60 * 1000);
    return () => clearInterval(interval);
  }, [username, notificationPermission]);

  const requestNotificationPermission = async () => {
    try {
      const permission = await Notification.requestPermission();
      setNotificationPermission(permission);
      setShowPermissionPrompt(permission === 'default');
      
      if (permission === 'granted') {
        showNotifications(upcomingEvents);
      }
    } catch (err) {
      console.error('Notification permission error:', err);
    }
  };

  const showNotifications = (events) => {
    if (notificationPermission !== 'granted' || !events.length) return;

    events.forEach(event => {
      try {
        const notification = new Notification(`Upcoming Event: ${event.name}`, {
          body: `Starts at ${event.time} | Location: ${event.location}`,
          icon: '/notification-icon.png',
          tag: `event-reminder-${event.id}`
        });
        
        // Close notification after 10 seconds
        setTimeout(() => notification.close(), 10000);
      } catch (err) {
        console.error('Failed to show notification:', err);
      }
    });
  };

  // Format time to display (e.g., "2:30 PM")
  const formatDisplayTime = (timeString) => {
    if (!timeString) return '';
    const [hours, minutes] = timeString.split(':');
    const hour = parseInt(hours);
    return `${hour > 12 ? hour - 12 : hour}:${minutes} ${hour >= 12 ? 'PM' : 'AM'}`;
  };

  return (
    <div className="reminders-container">
      <h3>Upcoming Events (Next 24 Hours)</h3>

      {error && <div className="error-message">{error}</div>}

      {('Notification' in window) && showPermissionPrompt && (
        <div className="notification-prompt">
          <p>Get notified about upcoming events?</p>
          <button 
            onClick={requestNotificationPermission}
            className="enable-notifications-btn"
          >
            Enable Notifications
          </button>
        </div>
      )}

      {loading ? (
        <div className="loading-message">Loading events...</div>
      ) : upcomingEvents.length === 0 ? (
        <div className="no-events-message">No upcoming events in the next 24 hours</div>
      ) : (
        <ul className="reminders-list">
          {upcomingEvents.map(event => (
            <li key={event.id} className="reminder-item">
              <div className="event-header">
                <h4 className="event-name">{event.name}</h4>
                <span className="event-time">
                  {event.date} • {formatDisplayTime(event.time)}
                </span>
              </div>
              {event.location && (
                <p className="event-location">
                  <span className="label">Location:</span> {event.location}
                </p>
              )}
              {event.description && (
                <p className="event-description">{event.description}</p>
              )}
            </li>
          ))}
        </ul>
      )}
    </div>
  );
};

export default Reminders;