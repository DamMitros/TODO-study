"use client";
import { useUser } from "../context/UserContext";
import { useRouter } from "next/navigation";

export default function AdminLayout({children}) {
  const { user } = useUser();
  const router = useRouter();

  if (!user?.isAdmin) {
    return (
      <div className="p-8 text-center">
        <p className="text-xl text-red-600 dark:text-red-400"> Odmowa dostępu. Wymagane uprawnienia administratora. </p>
      </div>
    );
  }

  return (
    <div className="max-w-7xl mx-auto px-4 py-8">
      <h1 className="text-3xl font-bold text-center mb-8 bg-gradient-to-r from-indigo-600 via-purple-600 to-pink-600 text-transparent bg-clip-text">Panel Administratora</h1>
      
      <nav className="mb-8 bg-white dark:bg-gray-800 rounded-xl shadow-md p-4">
        <div className="flex flex-wrap gap-4 justify-center">
          {[
            { path: "/admin", label: "Strona główna" },
            { path: "/admin/users", label: "Użytkownicy" },
            { path: "/admin/tasks", label: "Zadania" },
            { path: "/admin/projects", label: "Projekty" },
            { path: "/admin/stats", label: "Statystyki" },
            { path: "/admin/backups", label: "Backupy" }
          ].map(({ path, label }) => (
            <button key={path} onClick={() => router.push(path)} className="px-4 py-2 rounded-lg text-gray-700 dark:text-gray-300 hover:bg-indigo-50 dark:hover:bg-gray-700 transition-colors duration-200">{label}</button>
          ))}
        </div>
      </nav>
      
      <div className="bg-white dark:bg-gray-800 rounded-xl shadow-lg p-6">
        {children}
      </div>
    </div>
  );
}