// Import the functions you need from the SDKs you need
import { initializeApp } from "firebase/app";
import { getFirestore } from "firebase/firestore";
import { getAuth } from "firebase/auth";

// Your web app's Firebase configuration
// For security, these are stored in environment variables
console.error("--- START FIREBASE DEBUG ---");
console.error("API_KEY:", import.meta.env.VITE_APP_FIREBASE_API_KEY);
console.error("AUTH_DOMAIN:", import.meta.env.VITE_APP_FIREBASE_AUTH_DOMAIN);
console.error("PROJECT_ID:", import.meta.env.VITE_APP_FIREBASE_PROJECT_ID);
console.error("STORAGE_BUCKET:", import.meta.env.VITE_APP_FIREBASE_STORAGE_BUCKET);
console.error("MESSAGING_SENDER_ID:", import.meta.env.VITE_APP_FIREBASE_MESSAGING_SENDER_ID);
console.error("APP_ID:", import.meta.env.VITE_APP_FIREBASE_APP_ID);
console.error("--- END FIREBASE DEBUG ---");

const firebaseConfig = {
  apiKey: import.meta.env.VITE_APP_FIREBASE_API_KEY,
  authDomain: import.meta.env.VITE_APP_FIREBASE_AUTH_DOMAIN,
  projectId: import.meta.env.VITE_APP_FIREBASE_PROJECT_ID,
  storageBucket: import.meta.env.VITE_APP_FIREBASE_STORAGE_BUCKET,
  messagingSenderId: import.meta.env.VITE_APP_FIREBASE_MESSAGING_SENDER_ID,
  appId: import.meta.env.VITE_APP_FIREBASE_APP_ID
};

// Initialize Firebase
const app = initializeApp(firebaseConfig);

// Initialize Cloud Firestore and get a reference to the service.
// We export this so we can use it in other parts of our app.
export const db = getFirestore(app);

// Initialize Firebase Authentication and get a reference to the service
export const auth = getAuth(app);