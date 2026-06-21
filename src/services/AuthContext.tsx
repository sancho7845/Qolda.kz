import React, { createContext, useContext, useEffect, useState } from 'react';
import { 
  onAuthStateChanged, 
  signInWithEmailAndPassword, 
  createUserWithEmailAndPassword, 
  signOut as firebaseSignOut, 
  sendPasswordResetEmail as firebaseSendPasswordResetEmail,
  sendEmailVerification as firebaseSendEmailVerification,
  User
} from 'firebase/auth';
import { doc, getDoc, setDoc, updateDoc } from 'firebase/firestore';
import { auth, db, handleFirestoreError, OperationType } from './firebase';
import { UserProfile } from '../types';

interface AuthContextType {
  currentUser: User | null;
  userProfile: UserProfile | null;
  loading: boolean;
  signIn: (email: string, password: string) => Promise<void>;
  signUp: (email: string, password: string, name: string, city: string, phone: string, avatarId: string) => Promise<void>;
  signOut: () => Promise<void>;
  sendPasswordResetEmail: (email: string) => Promise<void>;
  sendEmailVerification: () => Promise<void>;
  checkEmailVerificationStatus: () => Promise<boolean>;
  refreshProfile: () => Promise<void>;
  updateUserBio: (data: Partial<UserProfile>) => Promise<void>;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [currentUser, setCurrentUser] = useState<User | null>(null);
  const [userProfile, setUserProfile] = useState<UserProfile | null>(null);
  const [loading, setLoading] = useState(true);

  const fetchUserProfile = async (user: User): Promise<UserProfile | null> => {
    const userDocRef = doc(db, 'users', user.uid);
    try {
      const userDoc = await getDoc(userDocRef);
      if (userDoc.exists()) {
        return userDoc.data() as UserProfile;
      }
      return null;
    } catch (error) {
      console.warn('Firestore fetchUserProfile failed, attempting graceful offline fallback:', error);
      return null;
    }
  };

  const refreshProfile = async () => {
    if (currentUser) {
      try {
        const profile = await fetchUserProfile(currentUser);
        if (profile) {
          setUserProfile(profile);
        } else {
          // Auto create profile if missing from Firestore
          const isBootstrappedAdmin = currentUser.email === 'sanjaresenalin@gmail.com' || currentUser.uid === 'q2BisrMhIBdICRbrDPEp0Lr9iZu2';
          const defaultProfile: UserProfile = {
            uid: currentUser.uid,
            name: currentUser.displayName || 'Пайдаланушы',
            email: currentUser.email || '',
            city: 'Алматы',
            phone: '',
            avatarId: 'avatar_1',
            rating: 5,
            reviewsCount: 0,
            completedTasksCount: 0,
            acceptedTasksCount: 0,
            isAdmin: isBootstrappedAdmin,
            isBanned: false,
            createdAt: new Date().toISOString()
          };
          try {
            await setDoc(doc(db, 'users', currentUser.uid), defaultProfile);
            setUserProfile(defaultProfile);
          } catch (error) {
            console.warn('Failed to auto create user profile inside refreshProfile:', error);
            setUserProfile(defaultProfile);
          }
        }
      } catch (err) {
        console.warn('Failed to refresh profile:', err);
      }
    }
  };

  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, async (user) => {
      try {
        setCurrentUser(user);
        if (user) {
          let profile = await fetchUserProfile(user);
          
          // Ensure the special admin user ID is always marked as admin
          if (profile && (user.uid === 'q2BisrMhIBdICRbrDPEp0Lr9iZu2' || user.email === 'sanjaresenalin@gmail.com')) {
            profile.isAdmin = true;
          }
          
          // Dynamic profile creation in case Auth exists but Firestore profile is missing
          if (!profile) {
            const isBootstrappedAdmin = user.email === 'sanjaresenalin@gmail.com' || user.uid === 'q2BisrMhIBdICRbrDPEp0Lr9iZu2';
            const defaultProfile: UserProfile = {
              uid: user.uid,
              name: user.displayName || 'Пайдаланушы',
              email: user.email || '',
              city: 'Алматы',
              phone: '',
              avatarId: 'avatar_1',
              rating: 5,
              reviewsCount: 0,
              completedTasksCount: 0,
              acceptedTasksCount: 0,
              isAdmin: isBootstrappedAdmin,
              isBanned: false,
              createdAt: new Date().toISOString()
            };
            try {
              await setDoc(doc(db, 'users', user.uid), defaultProfile);
              profile = defaultProfile;
            } catch (error) {
              console.warn('Failed to write default user profile to Firestore (using offline local profile state):', error);
              profile = defaultProfile;
            }
          }
          setUserProfile(profile);
        } else {
          setUserProfile(null);
        }
      } catch (e) {
        console.error('Error under onAuthStateChanged lifecycle:', e);
      } finally {
        setLoading(false);
      }
    });

    return unsubscribe;
  }, []);

  const signIn = async (email: string, password: string) => {
    await signInWithEmailAndPassword(auth, email, password);
  };

  const signUp = async (
    email: string, 
    password: string, 
    name: string, 
    city: string, 
    phone: string, 
    avatarId: string
  ) => {
    const userCredential = await createUserWithEmailAndPassword(auth, email, password);
    const user = userCredential.user;
    
    // Create matching user record in Firestore
    const isBootstrappedAdmin = email === 'sanjaresenalin@gmail.com' || user.uid === 'q2BisrMhIBdICRbrDPEp0Lr9iZu2';
    const profile: UserProfile = {
      uid: user.uid,
      name,
      email,
      city,
      phone,
      avatarId,
      rating: 5,
      reviewsCount: 0,
      completedTasksCount: 0,
      acceptedTasksCount: 0,
      isAdmin: isBootstrappedAdmin,
      isBanned: false,
      createdAt: new Date().toISOString()
    };
    
    try {
      await setDoc(doc(db, 'users', user.uid), profile);
      setUserProfile(profile);
    } catch (error) {
      handleFirestoreError(error, OperationType.CREATE, `users/${user.uid}`);
    }
  };

  const signOut = async () => {
    await firebaseSignOut(auth);
  };

  const sendPasswordResetEmail = async (email: string) => {
    await firebaseSendPasswordResetEmail(auth, email);
  };

  const sendEmailVerification = async () => {
    if (auth.currentUser) {
      await firebaseSendEmailVerification(auth.currentUser);
    }
  };

  const checkEmailVerificationStatus = async (): Promise<boolean> => {
    if (auth.currentUser) {
      await auth.currentUser.reload();
      const updatedUser = auth.currentUser;
      // We perform a copy to make sure React detects a new state reference
      setCurrentUser(auth.currentUser);
      return updatedUser.emailVerified;
    }
    return false;
  };

  const updateUserBio = async (data: Partial<UserProfile>) => {
    if (!currentUser) return;
    const userDocRef = doc(db, 'users', currentUser.uid);
    try {
      await updateDoc(userDocRef, data);
      setUserProfile(prev => prev ? { ...prev, ...data } : null);
    } catch (error) {
      handleFirestoreError(error, OperationType.UPDATE, `users/${currentUser.uid}`);
    }
  };

  return (
    <AuthContext.Provider value={{
      currentUser,
      userProfile,
      loading,
      signIn,
      signUp,
      signOut,
      sendPasswordResetEmail,
      sendEmailVerification,
      checkEmailVerificationStatus,
      refreshProfile,
      updateUserBio
    }}>
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
}
