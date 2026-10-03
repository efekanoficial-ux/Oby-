import { initializeApp, getApps, getApp } from "firebase/app";
import { getAuth } from "firebase/auth";
import { getFirestore, doc, getDocFromServer } from "firebase/firestore";
import { getAnalytics, isSupported } from "firebase/analytics";
import { getMessaging, isSupported as isMessagingSupported } from "firebase/messaging";
import firebaseConfig from "../../firebase-applet-config.json";

const app = getApps().length > 0 ? getApp() : initializeApp(firebaseConfig);

export const auth = getAuth(app);
export const db = (firebaseConfig as any).firestoreDatabaseId
  ? getFirestore(app, (firebaseConfig as any).firestoreDatabaseId)
  : getFirestore(app);

export let messaging: ReturnType<typeof getMessaging> | null = null;
if (typeof window !== "undefined") {
  isMessagingSupported().then((supported) => {
    if (supported) {
      try {
        messaging = getMessaging(app);
      } catch (err) {
        console.warn("Firebase messaging initialization error:", err);
      }
    }
  }).catch((err) => {
    console.warn("Firebase messaging support check error:", err);
  });
}

export let analytics: ReturnType<typeof getAnalytics> | null = null;
if (typeof window !== "undefined") {
  isSupported().then((supported) => {
    if (supported) {
      analytics = getAnalytics(app);
    }
  }).catch((err) => {
    console.warn("Analytics initialization check error:", err);
  });
}

// Connection test according to Firebase guidelines
async function testConnection() {
  try {
    await getDocFromServer(doc(db, "test", "connection"));
  } catch (error) {
    if (error instanceof Error && error.message.includes("the client is offline")) {
      console.warn("Firestore connection check: client is offline or initializing.");
    }
  }
}
testConnection();

