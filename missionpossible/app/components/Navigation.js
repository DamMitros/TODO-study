"use client";

import { useRouter } from 'next/navigation';
import { useUser } from "../context/UserContext";
import { useTheme } from "../context/ThemeContext";
import { useState } from 'react';

export default function Navigation() {
  const [isMenuOpen, setIsMenuOpen] = useState(false);
  const { user, setUser } = useUser();
  const { theme, toggleTheme } = useTheme();
  const router = useRouter();
  const handleLogout = () => {
    localStorage.removeItem("user");
    setUser(null);
  };

  return (
    <nav className="bg-white dark:bg-gray-800 shadow-lg sticky top-0 w-full z-50">
      <div className="container mx-auto px-6"> 
        <div className="flex justify-between items-center py-6">
          <div className="flex-shrink-0"> 
            <h1 className="text-3xl font-bold text-indigo-600 dark:text-indigo-400">MissionPossible</h1>
          </div>

          <button onClick={() => setIsMenuOpen(!isMenuOpen)} className="md:hidden p-2">
            <svg className="w-6 h-6 text-gray-600 dark:text-gray-300" fill="none" strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" viewBox="0 0 24 24" stroke="currentColor">
              {isMenuOpen ? (
                <path d="M6 18L18 6M6 6l12 12" />
              ) : (
                <path d="M4 6h16M4 12h16M4 18h16" />
              )}
            </svg>
          </button>

          <div className="hidden md:flex md:items-center md:space-x-8">
            <button onClick={() => router.push("/")} className="text-xl nav-link hover:text-indigo-600 dark:hover:text-indigo-400">Strona Główna</button>
            <button onClick={() => router.push("/tasks")} className="text-xl nav-link hover:text-indigo-600 dark:hover:text-indigo-400">Zadania</button>
            <button onClick={() => router.push("/myprojects")} className="text-xl nav-link hover:text-indigo-600 dark:hover:text-indigo-400">Projekty</button>
            <button onClick={() => router.push("/calender")} className="text-xl nav-link hover:text-indigo-600 dark:hover:text-indigo-400">Kalendarz</button>

            <div className="flex items-center space-x-6"> 
              <button onClick={toggleTheme} className="p-3 text-xl rounded-lg bg-gray-200 dark:bg-gray-700 transition-colors duration-200">
                {theme === 'light' ? '🌙' : '☀️'}
              </button>
            </div>

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

        <div className={`${isMenuOpen ? 'block' : 'hidden'} md:hidden pb-6`}>
          <div className="flex flex-col space-y-4">
            <button onClick={() => {router.push("/"); setIsMenuOpen(false)}} className="text-lg nav-link hover:text-indigo-600 dark:hover:text-indigo-400">Strona Główna</button>
            <button onClick={() => {router.push("/tasks"); setIsMenuOpen(false)}} className="text-lg nav-link hover:text-indigo-600 dark:hover:text-indigo-400">Zadania</button>
            <button onClick={() => {router.push("/myprojects"); setIsMenuOpen(false)}} className="text-lg nav-link hover:text-indigo-600 dark:hover:text-indigo-400">Projekty</button>
            <button onClick={() => {router.push("/calender"); setIsMenuOpen(false)}} className="text-lg nav-link hover:text-indigo-600 dark:hover:text-indigo-400">Kalendarz</button>
            
            <div className="flex items-center justify-between pt-4">
              <button onClick={toggleTheme} className="p-2 rounded-lg bg-gray-200 dark:bg-gray-700">
                {theme === 'light' ? '🌙' : '☀️'}
              </button>
              {user ? (
                <>
                  {user.isAdmin && (
                    <button onClick={() => {router.push("/admin"); setIsMenuOpen(false)}} className="text-gray-600 dark:text-gray-400">Zarządzanie</button>
                  )}
                  <button onClick={() => {router.push("/profile"); setIsMenuOpen(false)}} className="text-gray-600 dark:text-gray-400">Profil</button>
                  <button onClick={() => {handleLogout(); setIsMenuOpen(false)}} className="bg-indigo-600 text-white px-4 py-2 rounded-lg">Wyloguj się</button>
                </>
              ) : (
                <button onClick={() => {router.push("/login"); setIsMenuOpen(false)}} className="bg-indigo-600 text-white px-4 py-2 rounded-lg">Zaloguj się</button>
              )}
            </div>
          </div>
        </div>
      </div>
    </nav>
  );
}