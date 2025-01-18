"use client";

import { useNotifications } from '../context/NotificationContext';
import { useState } from 'react';

export default function NotificationHistory() {
  const { notifications, markAsRead } = useNotifications();
  const [filter, setFilter] = useState('all'); // all, read, unread

  const filteredNotifications = notifications.filter(notification => {
    if (filter === 'read') return notification.read;
    if (filter === 'unread') return !notification.read;
    return true;
  });

  return (
    <div>
      <h2>Historia Powiadomień</h2>
      <div>
        <select value={filter} onChange={(e) => setFilter(e.target.value)}>
          <option value="all">Wszystkie</option>
          <option value="read">Przeczytane</option>
          <option value="unread">Nieprzeczytane</option>
        </select>
      </div>

      <div>
        {filteredNotifications.length === 0 ? (
          <p>Brak powiadomień</p>
        ) : (
          <ul>
            {filteredNotifications.map(notification => (
              <li key={notification.id}>
                <div>
                  <h4>{notification.title}</h4>
                  <p>{notification.message}</p>
                  <small>{new Date(notification.timestamp).toLocaleString()}</small>
                  {!notification.read && (
                    <button onClick={() => markAsRead(notification.id)}>Oznacz jako przeczytane</button>
                  )}
                </div>
              </li>
            ))}
          </ul>
        )}
      </div>
    </div>
  );
}