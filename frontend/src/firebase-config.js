import { initializeApp } from "firebase/app";
import { getAuth, GoogleAuthProvider } from "firebase/auth";

const firebaseConfig = {
  apiKey: "AIzaSyCnp0rk05VNd--Z8yfwEp2ca3xbjldyHoM",
  authDomain: "ai-home-project211.firebaseapp.com",
  projectId: "ai-home-project211",
  storageBucket: "ai-home-project211.firebasestorage.app",
  messagingSenderId: "913746132107",
  appId: "1:913746132107:web:2773a91d3b689a2a34288e",
  measurementId: "G-EPQZ82EZRC"
};

const app = initializeApp(firebaseConfig);
export const auth = getAuth(app);
export const googleProvider = new GoogleAuthProvider();