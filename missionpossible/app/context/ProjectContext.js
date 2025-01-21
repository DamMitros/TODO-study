"use client";

import { createContext, useContext, useState, useEffect } from "react";
import { collection, addDoc, updateDoc, deleteDoc, onSnapshot, doc, query, where, getDocs, writeBatch, getDoc } from "firebase/firestore";
import { db } from "../../firebaseConfig";
import { useUser } from "./UserContext";
import { useNotifications } from "./NotificationContext";

const ProjectContext = createContext();

export function ProjectProvider({ children }) {
  const [projects, setProjects] = useState([]);
  const { user } = useUser();
  const { addNotification } = useNotifications();

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
    const recipientEmails = new Set(project.members || []);
    let message = '';
    switch (action) {
      case 'created':
        message = 'utworzony';
        break;
      case 'updated':
        message = 'zaktualizowany';
        break;
      case 'deleted':
        message = 'usunięty';
        break;
      case 'member_left':
        message = `opuszczony przez ${leavingMember}`;
        break;
      default:
        message = action;
    }

    for (const recipientEmail of recipientEmails) {
      await addNotification({
        userId: recipientEmail,
        projectId: project.id,
        type: 'project',
        title: `Aktualizacja projektu: ${project.name}`,
        message: `Projekt został ${message}`,
        priority: 'normal'
      });
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

      if (user && user.email) {
        for (const member of updatedMembers) {
          if (member) { 
            await addNotification({
              userId: member,
              projectId: projectId,
              type: 'project',
              title: `Członek opuścił projekt: ${projectData.name}`,
              message: `Użytkownik ${user.email} opuścił projekt`,
              priority: 'normal',
              timestamp: new Date().toISOString()
            });
          }
        }
      }
    } catch (error) {
      console.error("Error opuszczając projekt:", error);
      throw error;
    }
  };

  const addProjectMember = async (projectId, memberEmail) => {
    try {
      const projectRef = doc(db, 'projects', projectId);
      const projectDoc = await getDoc(projectRef);
      
      if (!projectDoc.exists()) {
        throw new Error('Projekt nie istnieje');
      }

      const projectData = projectDoc.data();
      const updatedMembers = [...(projectData.members || []), memberEmail];

      await updateDoc(projectRef, {
        members: updatedMembers
      });

      if (memberEmail) {
        await addNotification({
          userId: memberEmail,
          projectId: projectId,
          type: 'project',
          title: 'Nowy członek projektu',
          message: `Zostałeś dodany do projektu: ${projectData.name}`,
          priority: 'normal',
          timestamp: new Date().toISOString()
        });
      }
    } catch (error) {
      console.error("Error dodając członka projektu:", error);
      throw error;
    }
  };

  return (
    <ProjectContext.Provider value={{ 
      projects, 
      addProject, 
      updateProject, 
      deleteProject,
      leaveProject,
      addProjectMember
    }}>
      {children}
    </ProjectContext.Provider>
  );
};

export const useProjects = () => useContext(ProjectContext);