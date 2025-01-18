"use client";

import { createContext, useContext, useState, useEffect } from "react";
import { collection, addDoc, updateDoc, deleteDoc, onSnapshot, doc, query, where, getDocs, writeBatch} from "firebase/firestore";
import { db } from "../../firebaseConfig";
import { useUser } from "./UserContext";

const ProjectContext = createContext();

export const ProjectProvider = ({ children }) => {
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

  const notifyUsers = async (project, action) => {
    if (!user || !project.members) return;

    try {
      for (const email of project.members) {
        if (email === user.email) continue;

        const usersRef = collection(db, "users");
        const q = query(usersRef, where("email", "==", email));
        const userSnapshot = await getDocs(q);

        if (!userSnapshot.empty) {
          const recipientId = userSnapshot.docs[0].id;

          const messages = {
            created: `Zostałeś dodany do nowego projektu: ${project.name}`,
            updated: `Projekt "${project.name}" został zaktualizowany`,
            deleted: `Projekt "${project.name}" został usunięty`,
          };

          await addDoc(collection(db, "notifications"), {
            userId: recipientId,
            projectId: project.id,
            type: 'project',
            title: `Zmiana w projekcie: ${project.name}`,
            message: messages[action],
            timestamp: new Date().toISOString(),
            read: false,
            createdBy: user.email
          });
        }
      }
    } catch (error) {
      console.error("Error tworząc powiadomienie(projekt):", error);
    }
  };

  const addProject = async (project) => {
    try {
      const projectRef = await addDoc(collection(db, "projects"), project);
      await notifyUsers({ id: projectRef.id, ...project }, 'created');
      return projectRef;
    } catch (error) {
      console.error("Error dodając projekt:", error);
      throw error;
    }
  };

  const editProject = async (id, updatedProject) => {
    try {
      const projectRef = doc(db, "projects", id);
      await updateDoc(projectRef, updatedProject);
      await notifyUsers({ id, ...updatedProject }, 'updated');
    } catch (error) {
      console.error("Error aktualizując projekt:", error);
      throw error;
    }
  };

  const deleteProject = async (id) => {
    try {
      const project = projects.find(p => p.id === id);
      if (project) {
        await notifyUsers(project, 'deleted');
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
    if (!user) return;
    
    const project = projects.find(p => p.id === projectId);
    if (!project) return;

    const updatedMembers = project.members.filter(email => email !== user.email);
    await updateDoc(doc(db, "projects", projectId), {
      members: updatedMembers
    });
    const batch = writeBatch(db);
    const tasksSnapshot = await getDocs(
      query(collection(db, "tasks"), where("projectId", "==", projectId))
    );

    tasksSnapshot.forEach((taskDoc) => {
      const task = taskDoc.data();
      if (task.sharedWith?.includes(user.email)) {
        const updatedSharedWith = task.sharedWith.filter(email => email !== user.email);
        batch.update(taskDoc.ref, { sharedWith: updatedSharedWith });
      }
    });

    await batch.commit();
  };

  return (
    <ProjectContext.Provider value={{ 
      projects, 
      addProject, 
      editProject, 
      deleteProject,
      leaveProject
    }}>
      {children}
    </ProjectContext.Provider>
  );
};

export const useProjects = () => useContext(ProjectContext);