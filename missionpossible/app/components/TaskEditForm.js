"use client";

import { useFormik } from "formik";
import * as Yup from "yup";
import { useTasks } from "../context/TaskContext";
import { useProjects } from '../context/ProjectContext';
import { useState } from 'react';
import { useUser } from '../context/UserContext';
import { useRouter } from 'next/navigation';

export default function TaskEditForm({ task, onCancelEdit, isOwner }) {
  const { updateTask } = useTasks(); 
  const { projects } = useProjects();
  const { user } = useUser();
  const router = useRouter();
  const [sharedWithEmail, setSharedWithEmail] = useState('');
  const [notification, setNotification] = useState(null);
  const showNotification = (message, type) => {
    setNotification({ message, type });
    setTimeout(() => setNotification(null), 5000);
  };

  const handleShare = async () => {
    if (sharedWithEmail && !formik.values.sharedWith.includes(sharedWithEmail)) {
      try {
        const updatedSharedWith = [...formik.values.sharedWith, sharedWithEmail];
        await updateTask(task.id, { 
          ...task,
          sharedWith: updatedSharedWith
        });
        formik.setFieldValue('sharedWith', updatedSharedWith);
        setSharedWithEmail('');
      } catch (error) {
        console.error("Error udostępniając taska:", error);
      }
    }
  };

  const handleSubmit = async (values) => {
    try {
      let sharedWithUsers = [...values.sharedWith];
      if (isOwner && values.projectId) {
        const selectedProject = projects.find(p => p.id === values.projectId);
        if (selectedProject && selectedProject.members) {
          sharedWithUsers = [...new Set([
            ...sharedWithUsers,
            ...selectedProject.members.filter(member => member !== user.email)
          ])];
        }
      }

      const updatedTask = {
        ...task,
        ...values,
        projectId: isOwner ? values.projectId : task.projectId, 
        sharedWith: sharedWithUsers,
        updatedAt: new Date().toISOString()
      };
      await updateTask(task.id, updatedTask); 
      showNotification("Zadanie zostało zaktualizowane", "success");
      router.push(`/tasks/${task.id}`); 
    } catch (error) {
      console.error("Error modyfikując zadanie:", error);
      showNotification("Wystąpił błąd podczas aktualizacji zadania", "error");
    }
  };

  const formik = useFormik({
    initialValues: {
      title: task.title || "",
      description: task.description || "",
      location: task.location || "",
      repeat: task.repeat || "",
      importance: task.importance || 1,
      deadline: task.deadline || "",
      details: task.details || "",
      executionProgress: typeof task.executionProgress === 'number' ? task.executionProgress : 0,
      sharedWith: task.sharedWith || [],
      projectId: task.projectId || '',
    },
    validationSchema: Yup.object({
      title: Yup.string().required("Tytuł jest wymagany"),
      importance: Yup.number().min(1).max(5).required("Istotność jest wymagana"),
      deadline: Yup.string(),
      description: Yup.string(),
      location: Yup.string(),
      repeat: Yup.string(),
      details: Yup.string(),
      executionProgress: Yup.number().min(0).max(100).required("Postęp wykonania jest wymagany"),
      sharedWith: Yup.array().of(Yup.string().email()),
      projectId: Yup.string(),
    }),
    onSubmit: handleSubmit,
  });

  const currentProject = projects.find(p => p.id === formik.values.projectId);

  return (
    <div className="max-w-4xl mx-auto p-6">
      {notification && (
        <div className={`mb-4 p-4 rounded-lg ${
          notification.type === 'success' 
            ? 'bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-200' 
            : 'bg-red-100 text-red-800 dark:bg-red-900 dark:text-red-200'
        }`}>
          {notification.message}
        </div>
      )}

      <form onSubmit={formik.handleSubmit} className="space-y-6">
        <div>
          <input
            type="text"
            name="title"
            onChange={formik.handleChange}
            onBlur={formik.handleBlur}
            value={formik.values.title}
            placeholder="Tytuł zadania"
            className="w-full px-4 py-3 rounded-lg bg-gray-50 dark:bg-gray-700 border border-gray-300 dark:border-gray-600 focus:ring-2 focus:ring-indigo-500 dark:focus:ring-indigo-400 focus:border-transparent transition-all duration-200"
          />
          {formik.touched.title && formik.errors.title && (
            <p className="mt-2 text-sm text-red-600 dark:text-red-400">{formik.errors.title}</p>
          )}
        </div>

        <div>
          <textarea
            name="description"
            onChange={formik.handleChange}
            onBlur={formik.handleBlur}
            value={formik.values.description}
            placeholder="Opis zadania"
            rows="4"
            className="w-full px-4 py-3 rounded-lg bg-gray-50 dark:bg-gray-700 border border-gray-300 dark:border-gray-600 focus:ring-2 focus:ring-indigo-500 dark:focus:ring-indigo-400 focus:border-transparent transition-all duration-200 resize-y"
          />
        </div>

        <div>
          <input
            type="text"
            name="location"
            onChange={formik.handleChange}
            onBlur={formik.handleBlur}
            value={formik.values.location}
            placeholder="Miejsce"
            className="w-full px-4 py-3 rounded-lg bg-gray-50 dark:bg-gray-700 border border-gray-300 dark:border-gray-600 focus:ring-2 focus:ring-indigo-500 dark:focus:ring-indigo-400 focus:border-transparent transition-all duration-200"
          />
        </div>

        <div className="grid grid-cols-2 gap-6">
          <div>
            <select name="importance" onChange={formik.handleChange} onBlur={formik.handleBlur} value={formik.values.importance} className="w-full px-4 py-3 rounded-lg bg-gray-50 dark:bg-gray-700 border border-gray-300 dark:border-gray-600 focus:ring-2 focus:ring-indigo-500 dark:focus:ring-indigo-400 focus:border-transparent transition-all duration-200">
              <option value="1">Najniższy</option>
              <option value="2">Niski</option>
              <option value="3">Średni</option>
              <option value="4">Wysoki</option>
              <option value="5">Krytyczny</option>
            </select>
          </div>

          <div>
            <input
              type="datetime-local"
              name="deadline"
              onChange={formik.handleChange}
              onBlur={formik.handleBlur}
              value={formik.values.deadline}
              className="w-full px-4 py-3 rounded-lg bg-gray-50 dark:bg-gray-700 border border-gray-300 dark:border-gray-600 focus:ring-2 focus:ring-indigo-500 dark:focus:ring-indigo-400 focus:border-transparent transition-all duration-200"
            />
          </div>
        </div>

        <div>
          <select name="repeat" onChange={formik.handleChange} onBlur={formik.handleBlur} value={formik.values.repeat} className="w-full px-4 py-3 rounded-lg bg-gray-50 dark:bg-gray-700 border border-gray-300 dark:border-gray-600 focus:ring-2 focus:ring-indigo-500 dark:focus:ring-indigo-400 focus:border-transparent transition-all duration-200">
            <option value="">Wybierz powtarzalność</option>
            <option value="daily">Codziennie</option>
            <option value="weekly">Co tydzień</option>
            <option value="biweekly">Co dwa tygodnie</option>
            <option value="monthly">Co miesiąc</option>
            <option value="quarterly">Co kwartał</option>
            <option value="yearly">Co rok</option>
          </select>
        </div>

        <div>
          <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">Postęp wykonania (%)</label>
          <input
            type="number"
            name="executionProgress"
            min="0"
            max="100"
            onChange={formik.handleChange}
            onBlur={formik.handleBlur}
            value={formik.values.executionProgress}
            className="w-full px-4 py-3 rounded-lg bg-gray-50 dark:bg-gray-700 border border-gray-300 dark:border-gray-600 focus:ring-2 focus:ring-indigo-500 dark:focus:ring-indigo-400 focus:border-transparent transition-all duration-200"
          />
        </div>

        {isOwner && (
          <div className="space-y-4">
            <div className="flex gap-4">
              <input
                type="email"
                value={sharedWithEmail}
                onChange={(e) => setSharedWithEmail(e.target.value)}
                placeholder="Email użytkownika do udostępnienia"
                className="flex-1 px-4 py-3 rounded-lg bg-gray-50 dark:bg-gray-700 border border-gray-300 dark:border-gray-600 focus:ring-2 focus:ring-indigo-500 dark:focus:ring-indigo-400 focus:border-transparent transition-all duration-200"
              />
              <button type="button" onClick={handleShare} className="px-6 py-3 bg-indigo-600 hover:bg-indigo-700 text-white rounded-lg transition-colors duration-200">Udostępnij</button>
            </div>

            {formik.values.sharedWith.length > 0 && (
              <div className="flex flex-wrap gap-2">
                {formik.values.sharedWith.map((email, index) => (
                  <div key={index} className="flex items-center gap-2 px-3 py-1 bg-indigo-100 dark:bg-indigo-900 rounded-full">
                    <span className="text-sm text-indigo-800 dark:text-indigo-200">{email}</span>
                    <button
                      type="button"
                      onClick={() => {
                        formik.setFieldValue(
                          'sharedWith',
                          formik.values.sharedWith.filter((_, i) => i !== index)
                        );
                      }}
                      className="text-indigo-600 dark:text-indigo-400 hover:text-indigo-800 dark:hover:text-indigo-200"
                    >×</button>
                  </div>
                ))}
              </div>
            )}
          </div>
        )}

        <div className="flex justify-end space-x-4 pt-6">
          <button type="button" onClick={onCancelEdit} className="px-6 py-3 bg-gray-200 hover:bg-gray-300 dark:bg-gray-700 dark:hover:bg-gray-600 text-gray-700 dark:text-gray-300 rounded-lg transition-colors duration-200"> Anuluj</button>
          <button type="submit" className="px-6 py-3 bg-indigo-600 hover:bg-indigo-700 text-white rounded-lg transition-colors duration-200">Zapisz zmiany</button>
        </div>
      </form>
    </div>
  );
}
