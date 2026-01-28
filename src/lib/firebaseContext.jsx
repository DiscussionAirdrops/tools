'use client';

import React, { createContext, useContext } from 'react';

// Firebase instances context
const FirebaseContext = createContext(null);

export const setFirebaseContext = (firebaseData) => {
  // This will be set by App.jsx
  window.__firebaseContext = firebaseData;
};

export const useFirebase = () => {
  return window.__firebaseContext || { db: null, auth: null, app: null };
};

export const FirebaseProvider = ({ children, db, auth, app }) => {
  React.useEffect(() => {
    setFirebaseContext({ db, auth, app });
  }, [db, auth, app]);

  return (
    <FirebaseContext.Provider value={{ db, auth, app }}>
      {children}
    </FirebaseContext.Provider>
  );
};
