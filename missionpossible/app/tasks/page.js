"use client";

import { TaskProvider } from "../context/TaskContext";
import TaskList from "../components/TaskList";
import { useRouter } from "next/navigation";

export default function TasksPage() {
  const router = useRouter();

  return (
    <TaskProvider>
      <h1 className="text-4xl md:text-5xl font-bold mb-8 text-center bg-gradient-to-r from-indigo-600 via-purple-600 to-pink-600 text-transparent bg-clip-text animate-gradient-x transition-all duration-300">Twoja lista zadań do zrobienia (albo nie...)</h1>
      <div className="container mx-auto px-4 py-8">
        <div className="flex justify-between items-center mb-8">
          <h1 className="text-3xl font-bold bg-indigo-600 text-transparent bg-clip-text">Lista zadań</h1>
          <button onClick={() => router.push('/tasks/new')} className="inline-flex items-center px-6 py-3 text-lg font-semibold text-white bg-indigo-600 rounded-lg hover:bg-indigo-700 transition-all duration-300 transform hover:scale-105 shadow-lg">Dodaj nowe zadanie</button>
        </div>
        <div className="bg-white dark:bg-gray-800 rounded-2xl shadow-xl p-8 transition-all duration-300">
          <TaskList />
        </div>
      </div>
    </TaskProvider>
  );
}