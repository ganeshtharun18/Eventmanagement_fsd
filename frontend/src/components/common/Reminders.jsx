import { useEffect, useState } from 'react';
import { getUpcomingEvents } from '../../services/api';
import './Reminders.css';

const Reminders = ({ username }) => {
  const [upcomingEvents, setUpcomingEvents] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showPermissionPrompt, setShowPermissionPrompt] = useState(false);
  const [notificationSupported, setNotificationSupported] = useState(false);

  useEffect(() => {
    setNotificationSupported('Notification' in window);
    if ('Notification' in window && Notification.permission === 'default') {
      setShowPermissionPrompt(true);
    }
  }, []);

  useEffect(() => {
    const fetchUpcomingEvents = async () => {
      try {
        setLoading(true);
        const events = await getUpcomingEvents(username); // 🔁 FROM BACKEND
        setUpcomingEvents(events);

        if (Notification.permission === 'granted') {
          showNotifications(events);
        }
      } catch (error) {
        console.error('Error fetching reminders:', error);
      } finally {
        setLoading(false);
      }
    };

    fetchUpcomingEvents();

    const interval = setInterval(fetchUpcomingEvents, 60 * 60 * 1000); // every hour
    return () => clearInterval(interval);
  }, [username]);

  const requestNotificationPermission = async () => {
    try {
      const permission = await Notification.requestPermission();
      if (permission === 'granted') {
        setShowPermissionPrompt(false);
        showNotifications(upcomingEvents);
        return true;
      }
    } catch (error) {
      console.error('Notification permission error:', error);
    }
    return false;
  };

  const showNotifications = (events) => {
    if (!notificationSupported || Notification.permission !== 'granted') return;

    events.forEach(event => {
      try {
        new Notification(`Upcoming: ${event.name}`, {
          body: `At ${event.time} - ${event.location}`,
          icon: '/notification-icon.png',
          tag: `event-${event.id}`
        });
      } catch (error) {
        console.error('Notification error:', error);
      }
    });
  };

  return (
    <div className="reminders-container">
      <h3>Upcoming Events (Next 24 Hours)</h3>

      {notificationSupported && showPermissionPrompt && (
        <div className="notification-prompt">
          <span>Enable event notifications?</span>
          <button onClick={requestNotificationPermission}>
            Enable Notifications
          </button>
        </div>
      )}

      {loading ? (
        <div>Loading reminders...</div>
      ) : upcomingEvents.length === 0 ? (
        <div>No events within 24 hours.</div>
      ) : (
        <div className="reminders-list">
          {upcomingEvents.map(event => (
            <div key={event.id} className="reminder-item">
              <h4>{event.name}</h4>
              <p><strong>Date:</strong> {event.date} at {event.time}</p>
              <p><strong>Location:</strong> {event.location}</p>
              {event.description && <p>{event.description}</p>}
            </div>
          ))}
        </div>
      )}
    </div>
  );
};

export default Reminders;
