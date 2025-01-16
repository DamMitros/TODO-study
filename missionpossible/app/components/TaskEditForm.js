"use client";

import { useFormik } from "formik";
import * as Yup from "yup";
import { useTasks } from "../context/TaskContext";

export default function TaskEditForm({ task, onCancelEdit }) {
  const { editTask } = useTasks();
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
    }),
    onSubmit: async (values) => {
      try {
        const updatedTask = {
          ...task,
          ...values,
          details: values.details || null,
          executionProgress: Number(values.executionProgress),
          updatedAt: new Date().toISOString()
        };
        
        await editTask(updatedTask.id, updatedTask);
        onCancelEdit();
      } catch (error) {
        console.error("Error modyfikując zadanie:", error);
      }
    },
  });

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

      <div>
        <button type="submit">Zapisz zmiany</button>
        <button type="button" onClick={onCancelEdit}>
          Anuluj
        </button>
      </div>
    </form>
  );
}
