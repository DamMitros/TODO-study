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
    <div className="space-y-6">
      <div className="flex justify-between items-center mb-4">
        <h3 className="text-2xl font-semibold text-gray-900 dark:text-gray-100">Historia powiadomień</h3>
        <select value={filter}  onChange={(e) => setFilter(e.target.value)} className="px-4 py-2 rounded-lg bg-gray-100 dark:bg-gray-700 border-0">
          <option value="all">Wszystkie</option>
          <option value="read">Przeczytane</option>
          <option value="unread">Nieprzeczytane</option>
        </select>
      </div>
      
      <div className="overflow-y-auto max-h-[500px] pr-2">
        {filteredNotifications.length === 0 ? (
          <p className="text-gray-600 dark:text-gray-400 italic"> Brak powiadomień</p>
        ) : (
          <ul className="space-y-4">
            {filteredNotifications.map(notification => (
              <li key={notification.id} className="bg-gray-50 dark:bg-gray-700 rounded-lg p-4">
                <div className="flex justify-between items-start">
                  <div className="space-y-1">
                    <h4 className="font-medium text-gray-900 dark:text-gray-100">{notification.title}</h4>
                    <p className="text-gray-600 dark:text-gray-400">{notification.message}</p>
                    <small className="text-gray-500 dark:text-gray-500">{new Date(notification.timestamp).toLocaleString()}</small>
                  </div>
                  {!notification.read && (
                    <button onClick={() => markAsRead(notification.id)} className="text-sm text-indigo-600 hover:text-indigo-800 dark:text-indigo-400 dark:hover:text-indigo-200"> Oznacz jako przeczytane </button>
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