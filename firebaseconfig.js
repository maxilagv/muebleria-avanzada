import { initializeApp } from "https://www.gstatic.com/firebasejs/11.10.0/firebase-app.js";
import { getFirestore } from "https://www.gstatic.com/firebasejs/11.10.0/firebase-firestore.js";
import { getAuth } from "https://www.gstatic.com/firebasejs/11.10.0/firebase-auth.js";

const appId = typeof __app_id !== 'undefined' ? __app_id : 'default-app-id';
const firebaseConfig = typeof __firebase_config !== 'undefined' ? JSON.parse(__firebase_config) : {
  apiKey: "AIzaSyB5F8q5dModvUxclO6zsIgt05SyD5j21XA",
  authDomain: "muebleria-maxi.firebaseapp.com",
  projectId: "muebleria-maxi",
  storageBucket: "muebleria-maxi.firebasestorage.app",
  messagingSenderId: "241463440444",
  appId: "1:241463440444:web:2044ba5ee1b053c7067f39"
};

const app = initializeApp(firebaseConfig);
const db = getFirestore(app);
const auth = getAuth(app);
export { db, auth };