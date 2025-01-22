"use client";

import { useUser } from "../context/UserContext";
import TaskDataManager from '../components/TaskDataManager';
import NotificationHistory from '../components/NotificationHistory';
import UserBackup from '../components/UserBackup';

export default function ProfilePage() {
  const { user } = useUser();

  if (!user) {
    return (
      <p>Wczytywanie danych użytkownika...</p>
      // <div className="flex justify-center items-center min-h-screen">
      //   <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-indigo-600"></div> Świetnie to wyglada| do sprawdzenia!
      // </div>
    );
  }

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
      <h1 className="text-4xl font-bold text-gray-900 dark:text-gray-100 mb-8 bg-gradient-to-r from-indigo-600 via-purple-600 to-pink-600 text-transparent bg-clip-text">Profil użytkownika</h1>
      
      <div className="bg-white dark:bg-gray-800 rounded-xl shadow-lg p-6 mb-8">
        <p className="text-xl text-gray-700 dark:text-gray-300 mb-4">Witaj na swoim profilu</p>
        <p className="text-gray-600 dark:text-gray-400 mb-2">
          Twoje adres email: <span className="font-semibold">{user.email}</span>
        </p>
        <p className="text-gray-600 dark:text-gray-400">W tej sekcji znajdziesz historię powiadomień oraz możliwość obsługi backupów, import/exportu zadań.</p>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
        <div className="bg-white dark:bg-gray-800 rounded-xl shadow-lg p-6 h-[600px] overflow-hidden">
          <UserBackup />
        </div>
        <div className="bg-white dark:bg-gray-800 rounded-xl shadow-lg p-6 h-[600px] overflow-hidden">
          <NotificationHistory />
        </div>
      </div>
      
      <div className="mt-8 bg-white dark:bg-gray-800 rounded-xl shadow-lg p-6">
        <TaskDataManager />
      </div>
    </div>
  );
}