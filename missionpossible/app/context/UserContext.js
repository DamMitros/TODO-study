"use client";

import { createContext, useContext, useState, useEffect } from "react";
import { collection, query, where, getDocs } from "firebase/firestore";
import { db } from "../../firebaseConfig";

const UserContext = createContext();

export function UserProvider({ children }) {
  const [user, setUser] = useState(null);
  const updateUser = async (userData) => {
    if (userData) {
      try {
        const adminQuery = query(
          collection(db, "admin"),
          where("email", "==", userData.email)
        );
        
        const adminSnapshot = await getDocs(adminQuery);
        const isAdmin = !adminSnapshot.empty;
        const updatedUser = {
          ...userData,
          isAdmin: isAdmin
        };
        setUser(updatedUser);
      } catch (error) {
        setUser(userData);
      }
    } else {
      setUser(null);
    }
  };

  useEffect(() => {
    const storedUser = localStorage.getItem("user");
    if (storedUser) {
      updateUser(JSON.parse(storedUser));
    }
  }, []);

  return (
    <UserContext.Provider value={{ user, setUser: updateUser }}>
      {children}
    </UserContext.Provider>
  );
}

export const useUser = () => useContext(UserContext);