"use client";

import { useState } from 'react';
import { useNotifications } from '../context/NotificationContext';
import Link from 'next/link';

const getNotificationIcon = (type) => {
  switch (type) {
    case 'deadline': return '⏰';
    case 'task': return '📋';
    case 'project': return '📁';
    default: return '🔔';
  }
};

export default function HomeNotifications() {
  const { notifications, markAsRead, isLoading } = useNotifications();
  const unreadNotifications = notifications
    .filter(n => !n.read)
    .sort((a, b) => new Date(b.timestamp) - new Date(a.timestamp));

  return (
    <div>
      <h2>Nowe powiadomienia ({unreadNotifications.length})</h2>
      {isLoading ? (
        <p>Ładowanie powiadomień...</p>
      ) : (
        <ul>
          {unreadNotifications.map(notification => (
            <li key={notification.id}>
              <h4>{notification.title}</h4>
              <p>{notification.message}</p>
              <small>{new Date(notification.timestamp).toLocaleString()}</small>
              <button onClick={() => markAsRead(notification.id)}>✕</button>
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}