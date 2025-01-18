"use client";

import { createContext, useContext, useState, useEffect } from "react";
import { collection, addDoc, onSnapshot, query, where, deleteDoc, doc } from "firebase/firestore";
import { db } from "../../firebaseConfig";
import { useUser } from "./UserContext";

const NoteContext = createContext();

export const NoteProvider = ({ children }) => {
  const [notes, setNotes] = useState([]);
  const { user } = useUser();

  useEffect(() => {
    if (!user) return;

    const q = query(
      collection(db, "notes"),
      where("userId", "==", user.uid)
    );

    const unsubscribe = onSnapshot(q, (snapshot) => {
      const noteData = snapshot.docs.map(doc => ({
        id: doc.id,
        ...doc.data()
      }));
      setNotes(noteData);
    });

    return () => unsubscribe();
  }, [user]);

  const addNote = async (note) => {
    await addDoc(collection(db, "notes"), {
      ...note,
      userId: user.uid,
      createdAt: new Date().toISOString()
    });
  };

  const deleteNote = async (noteId) => {
    await deleteDoc(doc(db, "notes", noteId));
  };

  return (
    <NoteContext.Provider value={{ notes, addNote, deleteNote }}>
      {children}
    </NoteContext.Provider>
  );
};

export const useNotes = () => useContext(NoteContext);