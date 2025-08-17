import { initializeApp } from "https://www.gstatic.com/firebasejs/9.22.1/firebase-app.js";
import {
  getFirestore,
  collection,
  doc,
  getDocs,
} from "https://www.gstatic.com/firebasejs/9.22.1/firebase-firestore.js";
import {
  getAuth,
  GoogleAuthProvider,
} from "https://www.gstatic.com/firebasejs/9.22.1/firebase-auth.js";

// Your web app's Firebase configuration
const firebaseConfig = {
  apiKey: "AIzaSyCdJDeiLRBtL9JAMlDVBXIRshpPDP_W8r8",
  authDomain: "faculty-records-64210.firebaseapp.com",
  databaseURL: "https://faculty-records-64210-default-rtdb.firebaseio.com",
  projectId: "faculty-records-64210",
  storageBucket: "faculty-records-64210.firebasestorage.app",
  messagingSenderId: "472029805604",
  appId: "1:472029805604:web:3866ecc6998c58d85e2cb1",
  measurementId: "G-8N1WMYX0SJ",
};

// Initialize Firebase
const app = initializeApp(firebaseConfig);

// Initialize Firestore
const db = getFirestore(app);

// Initialize Auth
const auth = getAuth(app);

// Create an object to hold auth-related exports
const authobj = {
  GoogleAuthProvider, // Include GoogleAuthProvider here
};

// Export Firebase services and methods
export {
  db,
  auth,
  collection,
  doc,
  getDocs,
  authobj, // Export the authobj
};
