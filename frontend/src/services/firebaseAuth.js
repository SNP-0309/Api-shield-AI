import { createUserWithEmailAndPassword, getAuth, onAuthStateChanged, signInWithEmailAndPassword, signOut, updateProfile } from 'firebase/auth';
import { initializeApp } from 'firebase/app';

const firebaseConfig = {
  apiKey: import.meta.env.VITE_FIREBASE_API_KEY,
  authDomain: import.meta.env.VITE_FIREBASE_AUTH_DOMAIN,
  projectId: import.meta.env.VITE_FIREBASE_PROJECT_ID,
  storageBucket: import.meta.env.VITE_FIREBASE_STORAGE_BUCKET,
  messagingSenderId: import.meta.env.VITE_FIREBASE_MESSAGING_SENDER_ID,
  appId: import.meta.env.VITE_FIREBASE_APP_ID
};

const requiredConfig = [
  firebaseConfig.apiKey,
  firebaseConfig.authDomain,
  firebaseConfig.projectId,
  firebaseConfig.appId
];

export const isFirebaseConfigured = requiredConfig.every(Boolean);
const firebaseAuth = isFirebaseConfigured ? getAuth(initializeApp(firebaseConfig)) : null;

export function waitForFirebaseAuth() {
  if (!firebaseAuth) return Promise.resolve(null);

  return new Promise((resolve) => {
    const unsubscribe = onAuthStateChanged(firebaseAuth, (user) => {
      unsubscribe();
      resolve(user);
    });
  });
}

export async function getFirebaseIdToken() {
  if (!firebaseAuth?.currentUser) return null;
  return firebaseAuth.currentUser.getIdToken();
}

export async function registerWithFirebase({ name, email, password }) {
  if (!firebaseAuth) throw new Error('Firebase Authentication is not configured');
  const credential = await createUserWithEmailAndPassword(firebaseAuth, email, password);
  if (name) {
    await updateProfile(credential.user, { displayName: name });
    await credential.user.getIdToken(true);
  }
  return credential.user;
}

export async function loginWithFirebase({ email, password }) {
  if (!firebaseAuth) throw new Error('Firebase Authentication is not configured');
  const credential = await signInWithEmailAndPassword(firebaseAuth, email, password);
  return credential.user;
}

export async function logoutFromFirebase() {
  if (firebaseAuth) await signOut(firebaseAuth);
}
