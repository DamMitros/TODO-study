"use client";

import { useFormik } from "formik";
import * as Yup from "yup";
import { useTasks } from "../context/TaskContext";
import { useProjects } from '../context/ProjectContext';
import { useState } from 'react';
import { useUser } from '../context/UserContext';
import { useRouter } from 'next/navigation';

export default function TaskEditForm({ task, onCancelEdit, isOwner }) {
  const { editTask } = useTasks();
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
        await editTask(task.id, {
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
      
      await editTask(task.id, updatedTask);
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
    <form onSubmit={formik.handleSubmit}>
      <div>
        <input
          type="text"
          name="title"
          onChange={formik.handleChange}
          onBlur={formik.handleBlur}
          value={formik.values.title}
          placeholder="Tytuł zadania"
        />
        {formik.touched.title && formik.errors.title && (
          <div className="error">{formik.errors.title}</div>
        )}
      </div>

      <div>
        <textarea
          name="description"
          onChange={formik.handleChange}
          onBlur={formik.handleBlur}
          value={formik.values.description}
          placeholder="Opis zadania"
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
        />
      </div>

      <div>
        <select
          name="repeat"
          onChange={formik.handleChange}
          onBlur={formik.handleBlur}
          value={formik.values.repeat}
        >
          <option value="">Jednorazowe</option>
          <option value="daily">Codziennie</option>
          <option value="weekly">Co tydzień</option>
          <option value="biweekly">Co dwa tygodnie</option>
          <option value="monthly">Co miesiąc</option>
          <option value="quarterly">Co kwartał</option>
          <option value="yearly">Co rok</option>
        </select>
      </div>

      <div>
        <input
          type="number"
          name="importance"
          min="1"
          max="5"
          onChange={formik.handleChange}
          onBlur={formik.handleBlur}
          value={formik.values.importance}
        />
      </div>

      <div>
        <input
          type="date"
          name="deadline"
          onChange={formik.handleChange}
          onBlur={formik.handleBlur}
          value={formik.values.deadline}
        />
      </div>

      <div>
        <textarea
          name="details"
          onChange={formik.handleChange}
          onBlur={formik.handleBlur}
          value={formik.values.details}
          placeholder="Szczegóły zadania"
        />
      </div>

      <div>
        <label>Postęp wykonania (%)</label>
        <input
          type="number"
          name="executionProgress"
          min="0"
          max="100"
          onChange={formik.handleChange}
          onBlur={formik.handleBlur}
          value={formik.values.executionProgress}
        />

      </div>

      {isOwner && (
        <div>
          <h3>Udostępnianie</h3>
          <input
            type="email"
            placeholder="Dodaj użytkownika (email)"
            value={sharedWithEmail}
            onChange={(e) => setSharedWithEmail(e.target.value)}
          />
          <button type="button" onClick={handleShare}> Dodaj</button>
          
          <div>
            <h4>Udostępniono dla:</h4>
            {formik.values.sharedWith.map((email, index) => (
              <div key={index}>
                {email}
                <button
                  type="button"
                  onClick={async () => {
                    const newSharedWith = formik.values.sharedWith.filter((_, i) => i !== index);
                    await editTask(task.id, {
                      ...task,
                      sharedWith: newSharedWith
                    });
                    formik.setFieldValue('sharedWith', newSharedWith);
                  }}
                >
                  Usuń
                </button>
              </div>
            ))}
          </div>
        </div>
      )}

      <div>
        <h3>Projekt</h3>
        {isOwner ? (
          <select value={formik.values.projectId} onChange={formik.handleChange} name="projectId" >
            <option value="">Brak projektu</option>
            {projects.map(project => (
              <option key={project.id} value={project.id}>
                {project.name}
              </option>
            ))}
          </select>
        ) : (
          <div>
            {currentProject ? (
              <>
                <p><strong>Nazwa projektu:</strong> {currentProject.name}</p>
                <p><strong>Właściciel:</strong> {task.userId === currentProject.createdBy ? "Tak" : "Nie"}</p>
                <p><strong>Liczba członków:</strong> {currentProject.members?.length || 0}</p>
              </>
            ) : (
              <p>Brak przypisanego projektu</p>
            )}
          </div>
        )}
      </div>

      <div>
        <button type="submit">Zapisz zmiany</button>
        <button type="button" onClick={onCancelEdit}>Anuluj</button>
      </div>
    </form>
  );
}
