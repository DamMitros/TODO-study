"use client";

import { createContext, useContext, useState, useEffect } from "react";
import { collection, addDoc, updateDoc, deleteDoc, onSnapshot, doc, query, where, getDocs, writeBatch, getDoc } from "firebase/firestore";
import { db } from "../../firebaseConfig";
import { useUser } from "./UserContext";

const ProjectContext = createContext();

export function ProjectProvider({ children }) {
  const [projects, setProjects] = useState([]);
  const { user } = useUser();

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

  const notifyProjectMembers = async (project, action, leavingMember = null) => {
    if (!user || !project) return;
    
    try {
      const usersToNotify = new Set(project.members || []);
      usersToNotify.delete(user.email); 

      const messages = {
        created: 'został utworzony',
        updated: 'został zaktualizowany',
        deleted: 'został usunięty',
        member_added: 'otrzymał nowego członka',
        member_removed: 'utracił członka',
        member_left: `został opuszczony przez ${leavingMember || user.email}`,
        task_added: 'otrzymał nowe zadanie',
        task_updated: 'ma zaktualizowane zadanie'
      };

      for (const recipientEmail of usersToNotify) {
        await addDoc(collection(db, 'notifications'), {
          userId: recipientEmail,
          projectId: project.id,
          type: 'project',
          title: `Aktualizacja projektu: ${project.name}`,
          message: `Projekt ${messages[action]}`,
          timestamp: new Date().toISOString(),
          read: false,
          priority: 'normal'
        });
      }
    } catch (error) {
      console.error("Error wysyłając projekt powiadomienia:", error);
    }
  };

  const addProject = async (projectData) => {
    try {
      const docRef = await addDoc(collection(db, 'projects'), {
        ...projectData,
        createdAt: new Date().toISOString()
      });
      await notifyProjectMembers({ ...projectData, id: docRef.id }, 'created');
      return docRef;
    } catch (error) {
      console.error("Error dodając projekt:", error);
      throw error;
    }
  };

  const updateProject = async (projectId, projectData) => {
    try {
      const projectRef = doc(db, 'projects', projectId);
      await updateDoc(projectRef, {
        ...projectData,
        updatedAt: new Date().toISOString()
      });
      await notifyProjectMembers({ ...projectData, id: projectId }, 'updated');
    } catch (error) {
      console.error("Error aktualizując projekt:", error);
      throw error;
    }
  };

  const deleteProject = async (id) => {
    try {
      const project = projects.find(p => p.id === id);
      if (project) {
        await notifyProjectMembers(project, 'deleted');
      }
      
      const projectRef = doc(db, "projects", id);
      await deleteDoc(projectRef);
      const batch = writeBatch(db);
      const tasksSnapshot = await getDocs(
        query(collection(db, "tasks"), where("projectId", "==", id))
      );

      tasksSnapshot.forEach((doc) => {
        batch.delete(doc.ref);
      });

      await batch.commit();
    } catch (error) {
      console.error("Error usuwając projekt:", error);
      throw error;
    }
  };

  const leaveProject = async (projectId) => {
    try {
      const projectRef = doc(db, 'projects', projectId);
      const projectDoc = await getDoc(projectRef);
      
      if (!projectDoc.exists()) {
        throw new Error('Projekt nie istnieje');
      }

      const projectData = projectDoc.data();
      const updatedMembers = projectData.members.filter(email => email !== user.email);

      await updateDoc(projectRef, {
        members: updatedMembers
      });
      await notifyProjectMembers(
        { ...projectData, id: projectId, members: updatedMembers },
        'member_left',
        user.email
      );

    } catch (error) {
      console.error("Error opuszczając projekt:", error);
      throw error;
    }
  };

  return (
    <ProjectContext.Provider value={{ 
      projects, 
      addProject, 
      updateProject, 
      deleteProject,
      leaveProject
    }}>
      {children}
    </ProjectContext.Provider>
  );
};

export const useProjects = () => useContext(ProjectContext);