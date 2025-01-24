"use client";

import { useNotifications } from "../context/NotificationContext";
import { useState } from "react";

export default function HomeNotifications() {
  const { notifications, markAsRead, getNotificationColor } = useNotifications();
  const [typeFilter, setTypeFilter] = useState('all');
  const filteredNotifications = notifications
    .filter(n => !n.read)
    .filter(n => typeFilter === 'all' ? true : n.type === typeFilter)
    .sort((a, b) => new Date(b.timestamp) - new Date(a.timestamp)); 

  return (
    <div className="max-h-64 overflow-y-auto bg-white dark:bg-gray-800 p-4 rounded-xl shadow-lg mt-6">
      <div className="flex justify-between items-center mb-4">
        <h2 className="text-xl font-semibold">Nowe powiadomienia ({filteredNotifications.length})</h2>
        <select value={typeFilter} onChange={(e) => setTypeFilter(e.target.value)} className="p-2 rounded-lg bg-gray-200 dark:bg-gray-700">
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
          <li key={notification.id} className="mb-4 p-4 border-l-4"
            style={{ borderColor: getNotificationColor(notification.type, notification.priority),}}
          >
            <small className="text-gray-500 dark:text-gray-400">{new Date(notification.timestamp).toLocaleString()}</small>
            <h4 className="font-semibold">{notification.title}</h4>
            <p className="text-gray-600 dark:text-gray-300">{notification.message}</p>
            <button onClick={() => markAsRead(notification.id)} className="mt-2 text-indigo-600 dark:text-indigo-400 hover:underline">Oznacz jako przeczytane</button>
          </li>
        ))}
      </ul>
    </div>
  );
}