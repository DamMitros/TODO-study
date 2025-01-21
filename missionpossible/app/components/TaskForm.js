"use client";

import { useState, useCallback } from "react";
import { useFormik } from "formik";
import * as Yup from "yup";
import { useTasks } from "../context/TaskContext";
import { useUser } from "../context/UserContext";
import { useProjects } from "../context/ProjectContext";

export default function TaskForm() {
  const { addTask } = useTasks();
  const { user } = useUser();
  const { projects } = useProjects();
  const [dateRange, setDateRange] = useState(false);
  const [sharedWithEmail, setSharedWithEmail] = useState('');
  const [notification, setNotification] = useState(null);
  const showNotification = useCallback((message, type) => {
    setNotification({ message, type });
    setTimeout(() => setNotification(null), 5000);
  }, []);

  const handleSubmit = async (values) => {
    try {
      const task = {
        title: values.title,
        description: values.description,
        location: values.location || "",
        repeat: values.repeat || "",
        userId: user.uid,
        importance: Number(values.importance),
        deadline: values.deadline,
        completed: false,  
        executionProgress: 0,
        createdAt: new Date().toISOString(),
        sharedWith: values.sharedWith || [],
        projectId: values.projectId || ""
      };
      await addTask(task);
      formik.resetForm();
      setSharedWithEmail('');
      showNotification("Zadanie zostało utworzone", "success");
    } catch (error) {
      console.error("Error przy dodawaniu zadania:", error);
      showNotification("Wystąpił błąd podczas tworzenia zadania", "error");
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
      deadlineStart: "",
      deadlineEnd: "",
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
      deadline: dateRange 
        ? Yup.string().test(
            "both-dates",
            "Obie daty są wymagane",
            function (value) {
              const { deadlineStart, deadlineEnd } = this.parent;
              return dateRange ? deadlineStart && deadlineEnd : true;
            }
          )
        : Yup.date(),
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
    if (!sharedWithEmail) return;

    if (formik.values.projectId) {
      const selectedProject = projects.find(p => p.id === formik.values.projectId);
      if (selectedProject) {
        if (selectedProject.members.includes(sharedWithEmail)) {
          showNotification(
            "Ta osoba jest już członkiem projektu i automatycznie będzie miała dostęp do zadania.",
            "info"
          );
          if (!formik.values.sharedWith.includes(sharedWithEmail)) {
            formik.setFieldValue('sharedWith', [...formik.values.sharedWith, sharedWithEmail]);
          }
          setSharedWithEmail('');
          return;
        }
      }
    }

    if (!formik.values.sharedWith.includes(sharedWithEmail)) {
      formik.setFieldValue('sharedWith', [...formik.values.sharedWith, sharedWithEmail]);
    }
    setSharedWithEmail('');
  }, [sharedWithEmail, formik.values.projectId, formik.values.sharedWith, projects, showNotification]);

  if (!user) {
    return <p>Musisz być zalogowany, aby dodać nowe zadanie.</p>;
  }

  return (
    <form onSubmit={formik.handleSubmit}>
      <input
        type="text"
        name="title"
        placeholder="Tytuł zadania"
        onChange={formik.handleChange}
        onBlur={formik.handleBlur}
        value={formik.values.title}
      />
      {formik.touched.title && formik.errors.title ? <div>{formik.errors.title}</div> : null}

      <textarea
        name="description"
        placeholder="Opis zadania"
        onChange={formik.handleChange}
        onBlur={formik.handleBlur}
        value={formik.values.description}
      />

      <input
        type="text"
        name="location"
        placeholder="Miejsce"
        onChange={formik.handleChange}
        onBlur={formik.handleBlur}
        value={formik.values.location}
      />

      <select
        name="repeat"
        onChange={formik.handleChange}
        onBlur={formik.handleBlur}
        value={formik.values.repeat}
      >
        <option value="">Wybierz powtarzalność</option>
        <option value="daily">Codziennie</option>
        <option value="weekly">Co tydzień</option>
        <option value="biweekly">Co dwa tygodnie</option>
        <option value="monthly">Co miesiąc</option>
        <option value="quarterly">Co kwartał</option>
        <option value="yearly">Co rok</option>
      </select>

      <input
        type="number"
        name="importance"
        min="1"
        max="5"
        onChange={formik.handleChange}
        onBlur={formik.handleBlur}
        value={formik.values.importance}
      />

      <input
        type="date"
        name="deadline"
        onChange={formik.handleChange}
        onBlur={formik.handleBlur}
        value={formik.values.deadline}
      />

      <div>
        <label>
          Postęp wykonania (%)
          <input
            type="number"
            name="executionProgress"
            min="0"
            max="100"
            onChange={formik.handleChange}
            onBlur={formik.handleBlur}
            value={formik.values.executionProgress} 
          />
        </label>
      </div>

      {notification && (
        <div>
          {notification.message}
        </div>
      )}

      <div>
        <h3>Projekt</h3>
        <select
          name="projectId"
          onChange={formik.handleChange}
          value={formik.values.projectId}
        >
          <option value="">Brak projektu</option>
          {projects
            .filter(project => 
              project.createdBy === user.uid || 
              (project.members && project.members.includes(user.email))
            )
            .map(project => (
              <option key={project.id} value={project.id}>
                {project.name}
              </option>
            ))}
        </select>
      </div>

      <div>
        <h3>Udostępnij</h3>
        <div>
          <input
            type="email"
            placeholder="Email osoby"
            value={sharedWithEmail}
            onChange={(e) => setSharedWithEmail(e.target.value)}
          />
          <button type="button" onClick={handleShare}>
            Dodaj
          </button>
        </div>

        {formik.values.sharedWith.length > 0 && (
          <div>
            <h4>Udostępniono dla:</h4>
            {formik.values.sharedWith.map((email, index) => (
              <div key={index}>
                {email}
                <button
                  type="button"
                  onClick={() => {
                    formik.setFieldValue(
                      'sharedWith',
                      formik.values.sharedWith.filter((_, i) => i !== index)
                    );
                  }}
                >
                  Usuń
                </button>
              </div>
            ))}
          </div>
        )}
      </div>

      <button type="submit">Dodaj zadanie</button>
    </form>
  );
}
