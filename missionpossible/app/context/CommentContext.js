"use client";

import { createContext, useContext, useState, useEffect } from "react";
import { collection, addDoc, onSnapshot, query, where, orderBy } from "firebase/firestore";
import { db } from "../../firebaseConfig";
import { useUser } from "./UserContext";

const CommentContext = createContext();

export const CommentProvider = ({ children }) => {
  const [comments, setComments] = useState([]);
  const { user } = useUser();

  useEffect(() => {
    if (!user) return;

    const q = query(
      collection(db, "comments"),
      orderBy("createdAt", "desc")
    );

    const unsubscribe = onSnapshot(q, (snapshot) => {
      const commentData = snapshot.docs.map(doc => ({
        id: doc.id,
        ...doc.data()
      }));
      setComments(commentData);
    });

    return () => unsubscribe();
  }, [user]);

  const addComment = async (comment) => {
    await addDoc(collection(db, "comments"), {
      ...comment,
      createdAt: new Date().toISOString(),
      userId: user.uid,
      userEmail: user.email
    });
  };

  return (
    <CommentContext.Provider value={{ comments, addComment }}>
      {children}
    </CommentContext.Provider>
  );
};

export const useComments = () => useContext(CommentContext);