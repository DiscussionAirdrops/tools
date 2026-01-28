import {
  getFirestore,
  collection,
  doc,
  setDoc,
  getDoc,
  updateDoc,
  getDocs,
  query,
  where,
  deleteDoc,
  writeBatch,
  addDoc, // Added import for addDoc
} from 'firebase/firestore';

// Initialize Firestore (will be called from App.jsx)
let db = null;

export const initializeFirestore = (firebaseApp) => {
  db = getFirestore(firebaseApp);
};

// USER DATA OPERATIONS
export const saveUserData = async (userId, userData) => {
  if (!db) throw new Error('Firestore not initialized');
  try {
    const userDocRef = doc(db, 'users', userId);
    await setDoc(userDocRef, userData, { merge: true });
    console.log('[v0] User data saved:', userId);
  } catch (error) {
    console.error('[v0] Error saving user data:', error);
    throw error;
  }
};

export const getUserData = async (userId) => {
  if (!db) throw new Error('Firestore not initialized');
  try {
    const userDocRef = doc(db, 'users', userId);
    const userDoc = await getDoc(userDocRef);
    if (userDoc.exists()) {
      return userDoc.data();
    }
    return null;
  } catch (error) {
    console.error('[v0] Error getting user data:', error);
    throw error;
  }
};

// AIRDROP OPERATIONS
export const addAirdrop = async (userId, airdropData) => {
  if (!db) throw new Error('Firestore not initialized');
  try {
    const airdropsRef = collection(db, `users/${userId}/airdrops`);
    const docRef = await addDoc(airdropsRef, {
      ...airdropData,
      createdAt: new Date(),
      updatedAt: new Date(),
    });
    console.log('[v0] Airdrop added:', docRef.id);
    return docRef.id;
  } catch (error) {
    console.error('[v0] Error adding airdrop:', error);
    throw error;
  }
};

export const getUserAirdrops = async (userId) => {
  if (!db) throw new Error('Firestore not initialized');
  try {
    const airdropsRef = collection(db, `users/${userId}/airdrops`);
    const snapshot = await getDocs(airdropsRef);
    const airdrops = [];
    snapshot.forEach((doc) => {
      airdrops.push({ id: doc.id, ...doc.data() });
    });
    console.log('[v0] Airdrops fetched:', airdrops.length);
    return airdrops;
  } catch (error) {
    console.error('[v0] Error getting airdrops:', error);
    throw error;
  }
};

export const updateAirdrop = async (userId, airdropId, updates) => {
  if (!db) throw new Error('Firestore not initialized');
  try {
    const airdropRef = doc(db, `users/${userId}/airdrops`, airdropId);
    await updateDoc(airdropRef, {
      ...updates,
      updatedAt: new Date(),
    });
    console.log('[v0] Airdrop updated:', airdropId);
  } catch (error) {
    console.error('[v0] Error updating airdrop:', error);
    throw error;
  }
};

export const deleteAirdrop = async (userId, airdropId) => {
  if (!db) throw new Error('Firestore not initialized');
  try {
    const airdropRef = doc(db, `users/${userId}/airdrops`, airdropId);
    await deleteDoc(airdropRef);
    console.log('[v0] Airdrop deleted:', airdropId);
  } catch (error) {
    console.error('[v0] Error deleting airdrop:', error);
    throw error;
  }
};

// WALLET OPERATIONS
export const addWallet = async (userId, walletData) => {
  if (!db) throw new Error('Firestore not initialized');
  try {
    const walletsRef = collection(db, `users/${userId}/wallets`);
    const docRef = await addDoc(walletsRef, {
      ...walletData,
      createdAt: new Date(),
      updatedAt: new Date(),
    });
    console.log('[v0] Wallet added:', docRef.id);
    return docRef.id;
  } catch (error) {
    console.error('[v0] Error adding wallet:', error);
    throw error;
  }
};

export const getUserWallets = async (userId) => {
  if (!db) throw new Error('Firestore not initialized');
  try {
    const walletsRef = collection(db, `users/${userId}/wallets`);
    const snapshot = await getDocs(walletsRef);
    const wallets = [];
    snapshot.forEach((doc) => {
      wallets.push({ id: doc.id, ...doc.data() });
    });
    console.log('[v0] Wallets fetched:', wallets.length);
    return wallets;
  } catch (error) {
    console.error('[v0] Error getting wallets:', error);
    throw error;
  }
};

export const updateWallet = async (userId, walletId, updates) => {
  if (!db) throw new Error('Firestore not initialized');
  try {
    const walletRef = doc(db, `users/${userId}/wallets`, walletId);
    await updateDoc(walletRef, {
      ...updates,
      updatedAt: new Date(),
    });
    console.log('[v0] Wallet updated:', walletId);
  } catch (error) {
    console.error('[v0] Error updating wallet:', error);
    throw error;
  }
};

export const deleteWallet = async (userId, walletId) => {
  if (!db) throw new Error('Firestore not initialized');
  try {
    const walletRef = doc(db, `users/${userId}/wallets`, walletId);
    await deleteDoc(walletRef);
    console.log('[v0] Wallet deleted:', walletId);
  } catch (error) {
    console.error('[v0] Error deleting wallet:', error);
    throw error;
  }
};

// SETTINGS OPERATIONS
export const saveUserSettings = async (userId, settings) => {
  if (!db) throw new Error('Firestore not initialized');
  try {
    const settingsRef = doc(db, `users/${userId}/settings`, 'preferences');
    await setDoc(settingsRef, settings, { merge: true });
    console.log('[v0] Settings saved');
  } catch (error) {
    console.error('[v0] Error saving settings:', error);
    throw error;
  }
};

export const getUserSettings = async (userId) => {
  if (!db) throw new Error('Firestore not initialized');
  try {
    const settingsRef = doc(db, `users/${userId}/settings`, 'preferences');
    const settingsDoc = await getDoc(settingsRef);
    if (settingsDoc.exists()) {
      return settingsDoc.data();
    }
    return {};
  } catch (error) {
    console.error('[v0] Error getting settings:', error);
    throw error;
  }
};
