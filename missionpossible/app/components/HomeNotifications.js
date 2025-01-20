"use client";

import { useNotifications } from '../context/NotificationContext';

export default function HomeNotifications() {
  const { notifications, markAsRead, getNotificationColor } = useNotifications();
  
  const unreadNotifications = notifications
    .filter(n => !n.read)
    .sort((a, b) => {
      if (a.type === 'deadline' && b.type !== 'deadline') return -1;
      if (a.type !== 'deadline' && b.type === 'deadline') return 1;
      if (a.priority === 'high' && b.priority !== 'high') return -1;
      if (a.priority !== 'high' && b.priority === 'high') return 1;
      return new Date(b.timestamp) - new Date(a.timestamp);
    });

  return (
    <div>
      <h2>Nowe powiadomienia ({unreadNotifications.length})</h2>
      <ul>
        {unreadNotifications.map(notification => (
          <li 
            key={notification.id}
            style={{ borderLeft: `4px solid ${getNotificationColor(notification.type, notification.priority)}`}}
          >
            <h4>{notification.title}</h4>
            <p>{notification.message}</p>
            <small>{new Date(notification.timestamp).toLocaleString()}</small>
            <button onClick={() => markAsRead(notification.id)}>
              Oznacz jako przeczytane
            </button>
          </li>
        ))}
      </ul>
    </div>
  );
}