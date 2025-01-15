// Import the functions you need from the SDKs you need
import { initializeApp } from "firebase/app";
import { getAuth } from "firebase/auth";
import { getAnalytics } from "firebase/analytics";
import { getFirestore } from "firebase/firestore";
import { getDatabase } from "firebase/database";

// TODO: Add SDKs for Firebase products that you want to use
// https://firebase.google.com/docs/web/setup#available-libraries

// Your web app's Firebase configuration
// For Firebase JS SDK v7.20.0 and later, measurementId is optional
const firebaseConfig = {
  apiKey: "AIzaSyDcULO54AZr_j-31m0su0cCRFZaniGJHxw",
  authDomain: "fronted-73897.firebaseapp.com",
  projectId: "fronted-73897",
  storageBucket: "fronted-73897.firebasestorage.app",
  messagingSenderId: "673894702436",
  appId: "1:673894702436:web:ac0ae6044e46fd969dae71",
  measurementId: "G-6D8TDKKMQV"
};

// Initialize Firebase
const app = initializeApp(firebaseConfig);
export const auth = getAuth(app);
export const firestore = getFirestore(app);
export const realtimeDatabase = getDatabase(app);
