// Import the functions you need from the SDKs you need
import { initializeApp } from "https://www.gstatic.com/firebasejs/11.0.2/firebase-app.js";
import { getAnalytics } from "https://www.gstatic.com/firebasejs/11.0.2/firebase-analytics.js";
// TODO: Add SDKs for Firebase products that you want to use
// https://firebase.google.com/docs/web/setup#available-libraries

// Your web app's Firebase configuration
// For Firebase JS SDK v7.20.0 and later, measurementId is optional
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
const app = firebase.initializeApp(firebaseConfig);
export const auth = await firebase.auth();
export const db = await firebase.firestore();
export const authobj = await firebase.auth;
