"use client";

import { useNotifications } from '../context/NotificationContext';
import { useState } from 'react';

export default function HomeNotifications() {
  const { notifications, markAsRead, getNotificationColor } = useNotifications();
  const [typeFilter, setTypeFilter] = useState('all');
  const filteredNotifications = notifications
    .filter(n => !n.read)
    .filter(n => typeFilter === 'all' ? true : n.type === typeFilter)
    .sort((a, b) => new Date(b.timestamp) - new Date(a.timestamp)); 

  return (
    <div>
      <div>
        <h2>Nowe powiadomienia ({filteredNotifications.length})</h2>
        <select 
          value={typeFilter} 
          onChange={(e) => setTypeFilter(e.target.value)}
        >
          <option value="all">Wszystkie powiadomienia</option>
          <option value="deadline">Terminy</option>
          <option value="task">Zadania</option>
          <option value="project">Projekty</option>
          <option value="comment">Komentarze</option>
          <option value="backup">Kopie zapasowe</option>
        </select>
      </div>

      <ul>
        {filteredNotifications.map(notification => (
          <li 
            key={notification.id}
            style={{ 
              borderLeft: `4px solid ${getNotificationColor(notification.type, notification.priority)}`,
              marginBottom: '10px',
              padding: '10px'
            }}
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