"use client";

import { useState, useCallback, useRef } from "react"; 
import { useFormik } from "formik";
import * as Yup from "yup";
import { useTasks } from "../context/TaskContext";
import { useUser } from "../context/UserContext";
import { useProjects } from "../context/ProjectContext";
import { useRouter } from "next/navigation";

export default function TaskForm() {
  const { addTask } = useTasks();
  const { user } = useUser();
  const { projects } = useProjects();
  const router = useRouter();
  const [sharedWithEmail, setSharedWithEmail] = useState('');
  const [notification, setNotification] = useState(null);
  const titleInputRef = useRef(null);
  const sharedEmailInputRef = useRef(null);

  const accessibleProjects = projects.filter(project => 
    project.createdBy === user.uid || 
    (project.members && project.members.includes(user.email))
  );

  const showNotification = (message, type) => {
    setNotification({ message, type });
    setTimeout(() => setNotification(null), 5000);
  };

  const handleSubmit = async (values) => {
    try {
      let sharedWithUsers = [...values.sharedWith];
      if (values.projectId) {
        const selectedProject = projects.find(p => p.id === values.projectId);
        if (selectedProject && selectedProject.members) {
          sharedWithUsers = [...new Set([
            ...sharedWithUsers,
            ...selectedProject.members.filter(member => member !== user.email)
          ])];
        }
      }

      const taskData = {
        ...values,
        userId: user.uid,
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
        completed: false,
        completedAt: null,
        sharedWith: sharedWithUsers,
      };

      const taskId = await addTask(taskData);
      showNotification("Zadanie zostało utworzone", "success");
      router.push(`/tasks/${taskId}`);
    } catch (error) {
      showNotification("Wystąpił błąd podczas tworzenia zadania", "error");
      titleInputRef.current?.focus();
    }
  };

  const formik = useFormik({
    initialValues: {
      title: "",
      description: "",
      location: "",
      repeat: "",
      importance: 1,
      deadline: "",
      completed: false,
      completedAt: null,
      executionProgress: 0,
      projectId: "",
      sharedWith: [],
    },
    validationSchema: Yup.object({
      title: Yup.string().required("Tytuł jest wymagany"),
      description: Yup.string(),
      location: Yup.string(),
      repeat: Yup.string(),
      importance: Yup.number().min(1).max(5).required("Istotność jest wymagana"),
      deadline: Yup.date(),
      executionProgress: Yup.number()
        .required("Postęp wykonania jest wymagany")
        .min(0, "Minimum to 0%")
        .max(100, "Maximum to 100%"),
      projectId: Yup.string(),
      sharedWith: Yup.array().of(Yup.string().email()),
    }),
    onSubmit: handleSubmit
  });

  const handleShare = useCallback(async () => {
    if (!sharedWithEmail) {
      sharedEmailInputRef.current?.focus();
      return;
    }

    if (formik.values.projectId) {
      const selectedProject = projects.find(p => p.id === formik.values.projectId);
      if (selectedProject) {
        if (selectedProject.members.includes(sharedWithEmail)) {
          showNotification("Ta osoba jest już członkiem projektu i automatycznie będzie miała dostęp do zadania.", "info");
          setSharedWithEmail('');
          return;
        }
      }
    }

    if (!formik.values.sharedWith.includes(sharedWithEmail)) {
      formik.setFieldValue('sharedWith', [...formik.values.sharedWith, sharedWithEmail]);
    }
    setSharedWithEmail('');
    sharedEmailInputRef.current?.focus();
  }, [sharedWithEmail, formik.values.projectId, formik.values.sharedWith, projects]);

  if (!user) {
    return (
    <div className="text-center py-12">
      <p className="text-lg text-gray-600 dark:text-gray-400 mb-4">Musisz być zalogowany, aby dodać nowe zadanie.</p>
      <button onClick={() => router.push('/login')} className="px-4 py-2 bg-indigo-600 text-white rounded-lg hover:bg-indigo-700 transition-colors">Przejdź do logowania</button>
    </div>);
  }

  return (
    <form onSubmit={formik.handleSubmit} className="max-w-2xl mx-auto space-y-6 p-6">
      <div className="space-y-4">
        <div>
          <input
            ref={titleInputRef}
            type="text"
            name="title"
            placeholder="Tytuł zadania"
            onChange={formik.handleChange}
            onBlur={formik.handleBlur}
            value={formik.values.title}
            className="w-full px-4 py-3 rounded-lg bg-gray-50 dark:bg-gray-700 border border-gray-300 dark:border-gray-600 focus:ring-2 focus:ring-indigo-500 dark:focus:ring-indigo-400 focus:border-transparent transition-all duration-200"
          />
          {formik.touched.title && formik.errors.title && (
            <p className="mt-2 text-sm text-red-600 dark:text-red-400">{formik.errors.title}</p>
          )}
        </div>

        <div>
          <textarea
            name="description"
            placeholder="Opis zadania"
            onChange={formik.handleChange}
            onBlur={formik.handleBlur}
            value={formik.values.description}
            rows={4}
            className="w-full px-4 py-3 rounded-lg bg-gray-50 dark:bg-gray-700 border border-gray-300 dark:border-gray-600 focus:ring-2 focus:ring-indigo-500 dark:focus:ring-indigo-400 focus:border-transparent transition-all duration-200 resize-y"
          />
        </div>

        <div>
          <input
            type="text"
            name="location"
            placeholder="Miejsce"
            onChange={formik.handleChange}
            onBlur={formik.handleBlur}
            value={formik.values.location}
            className="w-full px-4 py-3 rounded-lg bg-gray-50 dark:bg-gray-700 border border-gray-300 dark:border-gray-600 focus:ring-2 focus:ring-indigo-500 dark:focus:ring-indigo-400 focus:border-transparent transition-all duration-200"
          />
        </div>

        <div>
          <select id="projectId" name="projectId" value={formik.values.projectId || ''} onChange={formik.handleChange} className="w-full px-4 py-3 rounded-lg bg-gray-50 dark:bg-gray-700 border border-gray-300 dark:border-gray-600 focus:ring-2 focus:ring-indigo-500 dark:focus:ring-indigo-400 focus:border-transparent transition-all duration-200">
            <option value="">Wybierz projekt</option>
            {accessibleProjects.map(project => (
              <option key={project.id} value={project.id}>
                {project.name}
              </option>
            ))}
          </select>
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

        <div className="space-y-4">
          <div className="flex gap-4">
            <input
              ref={sharedEmailInputRef}
              type="email"
              value={sharedWithEmail}
              onChange={(e) => setSharedWithEmail(e.target.value)}
              placeholder="Email użytkownika do udostępnienia"
              className="flex-1 px-4 py-3 rounded-lg bg-gray-50 dark:bg-gray-700 border border-gray-300 dark:border-gray-600 focus:ring-2 focus:ring-indigo-500 dark:focus:ring-indigo-400 focus:border-transparent transition-all duration-200"
            />
            <button type="button" onClick={handleShare} className="px-6 py-3 bg-indigo-600 hover:bg-indigo-700 text-white rounded-lg transition-colors duration-200">Dodaj</button>
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

        <div className="flex gap-4">
          <button type="button" onClick={() => router.push('/tasks')} className="flex-1 px-6 py-3 bg-gray-600 hover:bg-gray-700 text-white font-semibold rounded-lg transition-colors duration-200 shadow-lg hover:shadow-xl">Anuluj</button>
          <button type="submit" className="flex-1 px-6 py-3 bg-indigo-600 hover:bg-indigo-700 text-white font-semibold rounded-lg transition-colors duration-200 shadow-lg hover:shadow-xl">{formik.isSubmitting ? 'Dodawanie...' : 'Dodaj zadanie'}</button>
        </div>
        
      </div>
    </form>
  );
}
