import { initializeApp } from 'firebase/app';
import { initializeFirestore, collection, doc, addDoc, deleteDoc, getDocs, query, orderBy } from 'firebase/firestore';

const firebaseConfig = {
  apiKey: "AIzaSyAhfbjbzDila6dSvoQ8vANczm0Zuf5BKU0",
  authDomain: "gen-lang-client-0955235418.firebaseapp.com",
  projectId: "gen-lang-client-0955235418",
  storageBucket: "gen-lang-client-0955235418.firebasestorage.app",
  messagingSenderId: "125998820587",
  appId: "1:125998820587:web:eb78c8a9748f5da93f22ae"
};

const app = initializeApp(firebaseConfig);

// Initialize Firestore using the specific databaseId generated for this applet
export const db = initializeFirestore(app, {}, "ai-studio-protokkonserwacj-a32d9126-4901-446a-8a28-54458d8762c5");
