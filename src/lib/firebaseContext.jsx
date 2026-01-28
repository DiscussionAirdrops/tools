'use client';

import React, { createContext, useContext } from 'react';

// Firebase instances context
const FirebaseContext = createContext(null);

export const useFirebase = () => {
  const context = useContext(FirebaseContext);
  if (!context) {
    console.error('[v0] Firebase context not found. Make sure FirebaseProvider wraps your app.');
  }
  return context || { db: null, auth: null, app: null };
};

export const FirebaseProvider = ({ children, db, auth, app }) => {
  React.useEffect(() => {
    console.log('[v0] FirebaseProvider mounted with db:', !!db, 'auth:', !!auth, 'app:', !!app);
  }, [db, auth, app]);

  return (
    <FirebaseContext.Provider value={{ db, auth, app }}>
      {children}
    </FirebaseContext.Provider>
  );
};
