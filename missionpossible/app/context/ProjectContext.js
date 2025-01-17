"use client";

import { createContext, useContext, useState, useEffect } from "react";
import { collection, addDoc, updateDoc, deleteDoc, onSnapshot, query } from "firebase/firestore";
import { db } from "../../firebaseConfig";

const ProjectContext = createContext();

export const ProjectProvider = ({ children }) => {
  const [projects, setProjects] = useState([]);

  useEffect(() => {
    const q = query(collection(db, "projects"));
    const unsubscribe = onSnapshot(q, (snapshot) => {
      const projectsData = snapshot.docs.map(doc => ({
        id: doc.id,
        ...doc.data()
      }));
      setProjects(projectsData);
    });

    return () => unsubscribe();
  }, []);

  const addProject = async (project) => {
    await addDoc(collection(db, "projects"), project);
  };

  const editProject = async (id, updatedProject) => {
    const projectRef = doc(db, "projects", id);
    await updateDoc(projectRef, updatedProject);
  };

  const deleteProject = async (id) => {
    const projectRef = doc(db, "projects", id);
    await deleteDoc(projectRef);
  };

  return (
    <ProjectContext.Provider value={{ 
      projects, 
      addProject, 
      editProject, 
      deleteProject 
    }}>
      {children}
    </ProjectContext.Provider>
  );
};

export const useProjects = () => useContext(ProjectContext);