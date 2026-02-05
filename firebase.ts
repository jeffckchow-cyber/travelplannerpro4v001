
import { initializeApp } from "firebase/app";
import { getAuth, GoogleAuthProvider } from "firebase/auth";
import { getFirestore, enableIndexedDbPersistence } from "firebase/firestore";

const firebaseConfig = {
  apiKey: "AIzaSyDhqhh4vmuMEkTm2k2TQaBt6WHZlVA-79o",
  authDomain: "travelplannerpro4.firebaseapp.com",
  projectId: "travelplannerpro4",
  storageBucket: "travelplannerpro4.firebasestorage.app",
  messagingSenderId: "839370373003",
  appId: "1:839370373003:web:8443a91689f3184fa4a18e",
  measurementId: "G-4WG9GBXBW2"
};

const app = initializeApp(firebaseConfig);
const auth = getAuth(app);
const db = getFirestore(app);
const googleProvider = new GoogleAuthProvider();

// Enable offline persistence with a check to prevent errors during build or SSR
if (typeof window !== 'undefined') {
  enableIndexedDbPersistence(db).catch((err) => {
      if (err.code === 'failed-precondition') {
          console.warn('Persistence failed: multiple tabs open');
      } else if (err.code === 'unimplemented') {
          console.warn('Persistence failed: browser not supported');
      }
  });
}

export { auth, db, googleProvider };
