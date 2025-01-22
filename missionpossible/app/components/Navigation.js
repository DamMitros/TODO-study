"use client";

import { useRouter } from 'next/navigation';
import { useUser } from "../context/UserContext";
import { useTheme } from "../context/ThemeContext";

export default function Navigation() {
  const { user, setUser } = useUser();
  const { theme, toggleTheme } = useTheme();
  const router = useRouter();
  const handleLogout = () => {
    localStorage.removeItem("user");
    setUser(null);
  };

  return (
    <nav className="bg-white dark:bg-gray-800 shadow-lg">
      <div className="container mx-auto px-6"> 
        <div className="flex justify-between items-center py-6">
          <div className="flex items-center space-x-12"> 
            <h1 className="text-4xl font-bold text-indigo-600 dark:text-indigo-400 mr-8">MissionPossible</h1>
          
            <div className="hidden md:flex space-x-8"> 
              <button onClick={() => router.push("/")} className="text-xl nav-link hover:text-indigo-600 dark:hover:text-indigo-400">Strona Główna</button>
              <button onClick={() => router.push("/tasks")} className="text-xl nav-link hover:text-indigo-600 dark:hover:text-indigo-400">Zadania</button>
              <button onClick={() => router.push("/myprojects")} className="text-xl nav-link hover:text-indigo-600 dark:hover:text-indigo-400">Projekty</button>
              <button onClick={() => router.push("/calender")} className="text-xl nav-link hover:text-indigo-600 dark:hover:text-indigo-400">Kalendarz</button>
            </div>
          </div>

          <div className="flex items-center space-x-6"> 
            <button onClick={toggleTheme} className="p-3 text-xl rounded-lg bg-gray-200 dark:bg-gray-700 transition-colors duration-200" aria-label="Toggle theme">
              {theme === 'light' ? '🌙' : '☀️'}
            </button>

            {user ? (
              <div className="flex items-center space-x-6"> 
                {user.isAdmin && (
                  <button onClick={() => router.push("/admin")} className="text-xl text-gray-600 dark:text-gray-400 hover:text-gray-800 dark:hover:text-gray-300">Zarządzanie</button>
                )}
                <button onClick={() => router.push("/profile")} className="text-xl text-gray-600 dark:text-gray-400 hover:text-gray-800 dark:hover:text-gray-300">Profil</button>
                <button onClick={handleLogout} className="text-xl bg-indigo-600 text-white px-6 py-3 rounded-lg hover:bg-indigo-700">Wyloguj się</button>
              </div>
            ) : (
              <button onClick={() => router.push("/login")} className="text-xl bg-indigo-600 text-white px-6 py-3 rounded-lg hover:bg-indigo-700">Zaloguj się</button>
            )}
          </div>
        </div>
      </div>
    </nav>
  );
}