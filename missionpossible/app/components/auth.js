import {
  createUserWithEmailAndPassword,
  signInWithEmailAndPassword,
  sendEmailVerification,
  signInWithPopup,
  GoogleAuthProvider,
  FacebookAuthProvider,
} from "firebase/auth";
import { auth, db } from "../../firebaseConfig";
import { doc, setDoc, serverTimestamp, getDoc } from "firebase/firestore";

const createUserDocument = async (user) => {
  try {
    const userDocRef = doc(db, "users", user.uid);
    await setDoc(userDocRef, {
      uid: user.uid,
      email: user.email,
      createdAt: serverTimestamp(),
      lastLoginAt: serverTimestamp(),
      emailVerified: user.emailVerified,
      displayName: user.displayName || null,
      photoURL: user.photoURL || null
    }, { merge: true });
  } catch (error) {
    console.error("Błąd podczas tworzenia dokumentu użytkownika:", error);
  }
};

export const registerWithEmail = async (email, password) => {
  try {
    const userCredential = await createUserWithEmailAndPassword(auth, email, password);
    await sendEmailVerification(userCredential.user);
    await createUserDocument(userCredential.user);
    return userCredential.user;
  } catch (error) {
    console.error("Błąd podczas rejestracji za pomocą email", error);
    throw error;
  }
};

export const updateLoginTimestamp = async (user) => {
  if (!user) return;
  try {
    const userDocRef = doc(db, "users", user.uid);
    await setDoc(userDocRef, {
      lastLoginAt: serverTimestamp()
    }, { merge: true });
  } catch (error) {
    console.error("Błąd podczas aktualizacji znacznika czasu logowania:", error);
  }
};

export const loginWithEmail = async (email, password) => {
  try {
    const userCredential = await signInWithEmailAndPassword(auth, email, password);
    const userDoc = await getDoc(doc(db, "users", userCredential.user.uid));
    if (userDoc.exists() && userDoc.data().isBanned) {
      await auth.signOut();
      throw new Error("To konto zostało zablokowane");
    }
    
    await updateLoginTimestamp(userCredential.user);
    return userCredential.user;
  } catch (error) {
    console.error("Błąd podczas logowania za pomocą email", error);
    throw error;
  }
};

export const loginWithGoogle = async () => {
  try {
    const provider = new GoogleAuthProvider();
    const userCredential = await signInWithPopup(auth, provider);
    await createUserDocument(userCredential.user);
    await updateLoginTimestamp(userCredential.user);
    return userCredential.user;
  } catch (error) {
    console.error("Błąd podczas logowania za pomocą Google", error);
    throw error;
  }
};

export const loginWithFacebook = async () => {
  try {
    const provider = new FacebookAuthProvider();
    const userCredential = await signInWithPopup(auth, provider);
    await createUserDocument(userCredential.user);
    await updateLoginTimestamp(userCredential.user);
    return userCredential.user;
  } catch (error) {
    console.error("Błąd podczas logowania za pomocą Facebook", error);
    throw error;
  }
};