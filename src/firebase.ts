import { initializeApp } from 'firebase/app';
import { getAuth } from 'firebase/auth';
import { initializeFirestore } from 'firebase/firestore';
import { getStorage } from 'firebase/storage';

// Production configured Firebase project with dynamic environment override fallbacks
const getEnvValue = (val: unknown, fallback: string, prefixCheck?: string): string => {
  if (typeof val !== 'string') return fallback;
  const cleaned = val.trim();
  if (cleaned === '' || cleaned.startsWith('TEMPLATE_') || cleaned.startsWith('YOUR_') || cleaned.startsWith('MY_') || cleaned.startsWith('VITE_FIREBASE')) {
    return fallback;
  }
  if (prefixCheck && !cleaned.startsWith(prefixCheck)) {
    return fallback;
  }
  return cleaned;
};

const metaEnv = (import.meta as any).env || {};

const firebaseConfig = {
  projectId: getEnvValue(metaEnv.VITE_FIREBASE_PROJECT_ID, "zinc-presence-6tpfc"),
  appId: getEnvValue(metaEnv.VITE_FIREBASE_APP_ID, "1:131295684476:web:d8eceb6f75740f41f066f9"),
  apiKey: getEnvValue(metaEnv.VITE_FIREBASE_API_KEY, "AIzaSyD1o3IqjriUAzIPse8M4mMrtDFWk-cT3F8", "AIza"),
  authDomain: getEnvValue(metaEnv.VITE_FIREBASE_AUTH_DOMAIN, "zinc-presence-6tpfc.firebaseapp.com"),
  storageBucket: getEnvValue(metaEnv.VITE_FIREBASE_STORAGE_BUCKET, "zinc-presence-6tpfc.firebasestorage.app"),
  messagingSenderId: getEnvValue(metaEnv.VITE_FIREBASE_MESSAGING_SENDER_ID, "131295684476")
};

const app = initializeApp(firebaseConfig);
export const auth = getAuth(app);

// Use initializeFirestore with experimentalForceLongPolling to ensure stability in proxied iframes.
// For the fallback sandbox project 'zinc-presence-6tpfc', we must point to the specific sandbox database instance.
// For external projects, we omit the database ID to connect to the default database as requested.
const sandboxDatabaseId = "ai-studio-9478a64d-c08d-4934-a40b-0f5c5e3d1dc4";
const actualDatabaseId = firebaseConfig.projectId === "zinc-presence-6tpfc" ? sandboxDatabaseId : undefined;

export const db = actualDatabaseId
  ? initializeFirestore(app, { experimentalForceLongPolling: true }, actualDatabaseId)
  : initializeFirestore(app, { experimentalForceLongPolling: true });

export const storage = getStorage(app);

export enum OperationType {
  CREATE = 'create',
  UPDATE = 'update',
  DELETE = 'delete',
  LIST = 'list',
  GET = 'get',
  WRITE = 'write',
}

export interface FirestoreErrorInfo {
  error: string;
  operationType: OperationType;
  path: string | null;
  authInfo: {
    userId?: string | null;
    email?: string | null;
    emailVerified?: boolean | null;
    isAnonymous?: boolean | null;
    tenantId?: string | null;
    providerInfo?: {
      providerId?: string | null;
      email?: string | null;
    }[];
  }
}

export function handleFirestoreError(error: unknown, operationType: OperationType, path: string | null): never {
  const errInfo: FirestoreErrorInfo = {
    error: error instanceof Error ? error.message : String(error),
    authInfo: {
      userId: auth.currentUser?.uid || null,
      email: auth.currentUser?.email || null,
      emailVerified: auth.currentUser?.emailVerified || null,
      isAnonymous: auth.currentUser?.isAnonymous || null,
      tenantId: auth.currentUser?.tenantId || null,
      providerInfo: auth.currentUser?.providerData?.map(provider => ({
        providerId: provider.providerId,
        email: provider.email,
      })) || []
    },
    operationType,
    path
  };
  console.error('Firestore Error: ', JSON.stringify(errInfo));
  throw new Error(JSON.stringify(errInfo));
}
