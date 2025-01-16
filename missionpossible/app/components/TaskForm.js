"use client";

import { useState, useEffect } from "react";
import { useFormik } from "formik";
import * as Yup from "yup";
import { useTasks } from "../context/TaskContext";
import { useUser } from "../context/UserContext";

export default function TaskForm() {
  const { addTask } = useTasks();
  const { user } = useUser();
  const [dateRange, setDateRange] = useState(false);

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
        .max(100, "Maximum to 100%")
    }),
    onSubmit: async (values) => {
      if (!user) return;
      try {
        const task = {
          ...values,
          userId: user.uid,
          createdAt: new Date().toISOString(),
          deadline: dateRange ? `${values.deadlineStart} do ${values.deadlineEnd}` : values.deadline,
          executionProgress: Number(values.executionProgress), 
        };
        await addTask(task);
        formik.resetForm();
      } catch (error) {
        console.error("Error przy dodawaniu zadania:", error);
      }
    }
  });

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

      <label>
        <input
          type="checkbox"
          checked={dateRange}
          onChange={() => setDateRange(!dateRange)}
        />
        Użyj zakresu dat
      </label>

      {!dateRange ? (
        <input
          type="date"
          name="deadline"
          onChange={formik.handleChange}
          onBlur={formik.handleBlur}
          value={formik.values.deadline}
        />
      ) : (
        <>
          <input
            type="date"
            name="deadlineStart"
            placeholder="Data rozpoczęcia"
            onChange={formik.handleChange}
            onBlur={formik.handleBlur}
            value={formik.values.deadlineStart}
          />
          <input
            type="date"
            name="deadlineEnd"
            placeholder="Data zakończenia"
            onChange={formik.handleChange}
            onBlur={formik.handleBlur}
            value={formik.values.deadlineEnd}
          />
        </>
      )}

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

      <button type="submit">Dodaj zadanie</button>
    </form>
  );
}
