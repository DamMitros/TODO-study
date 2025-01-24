"use client";

import { useParams, useRouter } from 'next/navigation';
import { useProjects } from '../../../../context/ProjectContext';
import { useUser } from '../../../../context/UserContext';

export default function UserProjectsPage() {
  const { projects } = useProjects();
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

  const userProjects = projects.filter(project => project.createdBy === userId);

  return (
    <div className="max-w-7xl mx-auto p-6 space-y-6">
      <h2 className="text-3xl font-bold text-gray-900 dark:text-gray-100 bg-gradient-to-r from-indigo-600 via-purple-600 to-pink-600 text-transparent bg-clip-text">Projekty użytkownika</h2>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {userProjects.length === 0 ? (
          <p className="text-gray-600 dark:text-gray-400 col-span-full text-center py-4">Brak projektów do wyświetlenia</p>
        ) : (
          userProjects.map(project => (
            <div key={project.id} className="bg-white dark:bg-gray-800 rounded-xl shadow-md p-6 space-y-4 hover:shadow-lg transition-shadow duration-200">
              <h3 className="text-xl font-semibold text-gray-900 dark:text-gray-100">{project.name}</h3>
              <div className="space-y-2">
                <p className="text-sm text-gray-600 dark:text-gray-400">
                  <span className="font-medium">Data utworzenia:</span>{" "}
                  {new Date(project.createdAt).toLocaleDateString()}
                </p>
                <p className="text-sm text-gray-600 dark:text-gray-400">
                  <span className="font-medium">Liczba członków:</span>{" "}
                  {project.members?.length || 0}
                </p>
              </div>
              <button onClick={() => router.push(`/myprojects/${project.id}`)}className="w-full px-4 py-2 bg-indigo-600 text-white rounded-lg hover:bg-indigo-700 transition-colors duration-200">Zobacz szczegóły</button>
            </div>
          ))
        )}
      </div>
    </div>
  );
}