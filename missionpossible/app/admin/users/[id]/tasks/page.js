"use client";

import { useParams, useRouter } from 'next/navigation';
import { useTasks } from '../../../../context/TaskContext';
import { useUser } from '../../../../context/UserContext';

export default function UserTasksPage() {
  const { getAllTasks } = useTasks();
  const { user } = useUser();
  const params = useParams();
  const router = useRouter();
  const userId = params.id;

  if (!user?.isAdmin) {
    return (
      <div className="p-8 text-center">
        <p className="text-xl text-red-600 dark:text-red-400">Odmowa dostępu. Wymagane uprawnienia administratora.</p>
      </div>
    );
  }

  const userTasks = getAllTasks().filter(task => task.userId === userId);

  return (
    <div className="max-w-7xl mx-auto p-6 space-y-6">
      <h2 className="text-3xl font-bold text-gray-900 dark:text-gray-100 bg-gradient-to-r from-indigo-600 via-purple-600 to-pink-600 text-transparent bg-clip-text">Zadania użytkownika</h2>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {userTasks.length === 0 ? (
          <p className="col-span-full text-center text-gray-600 dark:text-gray-400 py-4">Brak zadań do wyświetlenia</p>
        ) : (
          userTasks.map(task => (
            <div key={task.id} className="bg-white dark:bg-gray-800 rounded-xl shadow-md p-6 space-y-4 hover:shadow-lg transition-shadow duration-200">
              <h3 className="text-xl font-semibold text-gray-900 dark:text-gray-100">{task.title}</h3>
              <div className="space-y-3">
                <div className="flex items-center justify-between">
                  <span className="text-sm text-gray-600 dark:text-gray-400">Status:</span>
                  <span className={`px-2 py-1 text-xs rounded-full ${
                    task.completed
                      ? 'bg-green-100 dark:bg-green-900 text-green-700 dark:text-green-300'
                      : 'bg-yellow-100 dark:bg-yellow-900 text-yellow-700 dark:text-yellow-300'
                  }`}>
                    {task.completed ? 'Wykonane' : 'W toku'}
                  </span>
                </div>
                <div>
                  <p className="text-sm text-gray-600 dark:text-gray-400 mb-1">Postęp:</p>
                  <div className="flex items-center gap-2">
                    <div className="flex-1 h-2 bg-gray-200 dark:bg-gray-700 rounded-full overflow-hidden">
                      <div className="h-full bg-indigo-600 dark:bg-indigo-500 transition-all duration-300" style={{ width: `${task.executionProgress}%` }}/>
                    </div>
                    <span className="text-sm font-medium text-gray-700 dark:text-gray-300">{task.executionProgress}%</span>
                  </div>
                </div>
              </div>
              <button onClick={() => router.push(`/tasks/${task.id}`)} className="w-full px-4 py-2 bg-indigo-600 text-white rounded-lg hover:bg-indigo-700 transition-colors duration-200">Zobacz szczegóły</button>
            </div>
          ))
        )}
      </div>
    </div>
  );
}