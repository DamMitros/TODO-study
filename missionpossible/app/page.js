"use client"

import { useUser } from './context/UserContext';
import HomeNotifications from './components/HomeNotifications';
import { useRouter } from 'next/navigation';

export default function Page() {
  const { user } = useUser();
  const router = useRouter();
  
  return (
      <div className="max-w-4xl mx-auto pt-16 pb-12 flex-grow">
        <h1 className="text-5xl font-bold text-center mb-8 bg-gradient-to-r from-indigo-600 to-purple-600 text-transparent bg-clip-text">Twój wirtualny planer</h1>
        
        {user && <HomeNotifications />}
        
        <div className="mt-12 space-y-8">
          <div className="bg-white dark:bg-gray-800 rounded-2xl shadow-xl p-8 transition-all duration-300 hover:shadow-2xl">
            <p className="text-xl text-gray-700 dark:text-gray-300 mb-4 leading-relaxed">Masz za dużo istotnych planów? Nie możesz odnaleźć się w natłoku zadań?</p>
            <p className="text-lg text-gray-600 dark:text-gray-400 leading-relaxed">Witaj w naszym planerze! Dzięki niemu będziesz mógł zapanować nad swoim czasem i zrealizować wszystkie swoje plany.</p>
          </div>

          {!user &&
            <div className="grid md:grid-cols-3 gap-8 mt-16">
              <div className="bg-white dark:bg-gray-800 p-6 rounded-xl shadow-lg">
                <h3 className="text-xl font-semibold mb-3 text-indigo-600 dark:text-indigo-400">Organizuj</h3>
                <p className="text-gray-600 dark:text-gray-300">Zarządzaj zadaniami i projektami w jednym miejscu</p>
              </div>
              <div className="bg-white dark:bg-gray-800 p-6 rounded-xl shadow-lg">
                <h3 className="text-xl font-semibold mb-3 text-indigo-600 dark:text-indigo-400">Współpracuj</h3>
                <p className="text-gray-600 dark:text-gray-300">Dziel się zadaniami i projektami z innymi</p>
              </div>
              <div className="bg-white dark:bg-gray-800 p-6 rounded-xl shadow-lg">
                <h3 className="text-xl font-semibold mb-3 text-indigo-600 dark:text-indigo-400">Realizuj</h3>
                <p className="text-gray-600 dark:text-gray-300">Śledź postępy i osiągaj swoje cele</p>
              </div>
            </div>
          }

          <div className="text-center mt-8">
            <button onClick={() => user ? router.push("/tasks") : router.push("/login")} className="inline-flex items-center px-8 py-4 text-lg font-semibold text-white bg-indigo-600 rounded-lg hover:bg-indigo-700 transition-colors duration-300 transform hover:scale-105">
              {user ? "Przejdź do swoich zadań" : "Zarejestruj się i zacznij planować z nami już teraz"}
            </button>
          </div>
        </div>
      </div>
  );
}