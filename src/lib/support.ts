import { db } from "./firebase";
import {
  collection,
  doc,
  setDoc,
  getDoc,
  onSnapshot,
  query,
  orderBy,
  updateDoc,
  arrayUnion,
  serverTimestamp,
} from "firebase/firestore";

export interface SupportMessage {
  id: string;
  sender: "user" | "admin" | "system";
  text: string;
  timestamp: number;
}

export interface SupportChat {
  id: string; // email or userId
  userId: string;
  userName: string;
  userEmail: string;
  status: "idle" | "waiting" | "active" | "closed" | "busy";
  lastMessage: string;
  lastUpdated: number;
  unreadAdmin: boolean;
  unreadUser: boolean;
  messages: SupportMessage[];
}

const LOCAL_STORAGE_KEY = "obyo_support_chats";

/* Helper: Get chats from localStorage */
function getLocalChats(): Record<string, SupportChat> {
  try {
    const raw = localStorage.getItem(LOCAL_STORAGE_KEY);
    return raw ? JSON.parse(raw) : {};
  } catch {
    return {};
  }
}

/* Helper: Save chat to localStorage */
function saveLocalChat(chat: SupportChat) {
  try {
    const chats = getLocalChats();
    chats[chat.id] = chat;
    localStorage.setItem(LOCAL_STORAGE_KEY, JSON.stringify(chats));
    // Dispatch storage event for cross-tab sync
    window.dispatchEvent(new Event("storage_support_update"));
  } catch (err) {
    console.error("Local storage support chat save error:", err);
  }
}

/**
 * Real-time listener for a single user's support chat
 */
export function listenUserSupportChat(
  chatId: string,
  onUpdate: (chat: SupportChat | null) => void
): () => void {
  if (!chatId) return () => {};

  const sanitizedId = chatId.trim().toLowerCase().replace(/[^a-z0-9_@.-]/g, "_");
  const docRef = doc(db, "support_chats", sanitizedId);

  let unsubscribeFs: (() => void) | null = null;

  try {
    unsubscribeFs = onSnapshot(
      docRef,
      (snapshot) => {
        if (snapshot.exists()) {
          const data = snapshot.data() as SupportChat;
          saveLocalChat(data);
          onUpdate(data);
        } else {
          // Check local storage fallback
          const localChats = getLocalChats();
          onUpdate(localChats[sanitizedId] || null);
        }
      },
      (error) => {
        console.warn("Firestore support chat error, using local fallback:", error);
        const localChats = getLocalChats();
        onUpdate(localChats[sanitizedId] || null);
      }
    );
  } catch (err) {
    console.warn("Failed to subscribe to Firestore support chat:", err);
    const localChats = getLocalChats();
    onUpdate(localChats[sanitizedId] || null);
  }

  const handleLocalUpdate = () => {
    const localChats = getLocalChats();
    if (localChats[sanitizedId]) {
      onUpdate(localChats[sanitizedId]);
    }
  };

  window.addEventListener("storage_support_update", handleLocalUpdate);

  return () => {
    if (unsubscribeFs) unsubscribeFs();
    window.removeEventListener("storage_support_update", handleLocalUpdate);
  };
}

/**
 * Real-time listener for ALL support chats (used in Admin Panel)
 */
export function listenAllSupportChats(
  onUpdate: (chats: SupportChat[]) => void
): () => void {
  const colRef = collection(db, "support_chats");

  let unsubscribeFs: (() => void) | null = null;

  try {
    unsubscribeFs = onSnapshot(
      colRef,
      (snapshot) => {
        const chats: SupportChat[] = [];
        snapshot.forEach((docSnap) => {
          chats.push(docSnap.data() as SupportChat);
        });
        chats.sort((a, b) => (b.lastUpdated || 0) - (a.lastUpdated || 0));

        // Sync to local
        const localObj = getLocalChats();
        chats.forEach((c) => {
          localObj[c.id] = c;
        });
        localStorage.setItem(LOCAL_STORAGE_KEY, JSON.stringify(localObj));

        onUpdate(chats);
      },
      (error) => {
        console.warn("Firestore all support chats error, using local fallback:", error);
        const localList = Object.values(getLocalChats()).sort(
          (a, b) => (b.lastUpdated || 0) - (a.lastUpdated || 0)
        );
        onUpdate(localList);
      }
    );
  } catch {
    const localList = Object.values(getLocalChats()).sort(
      (a, b) => (b.lastUpdated || 0) - (a.lastUpdated || 0)
    );
    onUpdate(localList);
  }

  const handleLocalUpdate = () => {
    const localList = Object.values(getLocalChats()).sort(
      (a, b) => (b.lastUpdated || 0) - (a.lastUpdated || 0)
    );
    onUpdate(localList);
  };

  window.addEventListener("storage_support_update", handleLocalUpdate);

  return () => {
    if (unsubscribeFs) unsubscribeFs();
    window.removeEventListener("storage_support_update", handleLocalUpdate);
  };
}

/**
 * Send a user message (either from "Mesaj Gönder" form or Live Chat)
 */
export async function sendUserSupportMessage(
  userId: string,
  userName: string,
  userEmail: string,
  text: string
): Promise<void> {
  if (!text.trim()) return;

  const sanitizedId = (userId || userEmail || "guest")
    .trim()
    .toLowerCase()
    .replace(/[^a-z0-9_@.-]/g, "_");

  const newMessage: SupportMessage = {
    id: `msg_${Date.now()}_${Math.random().toString(36).slice(2, 6)}`,
    sender: "user",
    text: text.trim(),
    timestamp: Date.now(),
  };

  const docRef = doc(db, "support_chats", sanitizedId);
  const snap = await getDoc(docRef).catch(() => null);

  if (snap && snap.exists()) {
    const existing = snap.data() as SupportChat;
    const updated: SupportChat = {
      ...existing,
      userName: userName || existing.userName,
      userEmail: userEmail || existing.userEmail,
      lastMessage: text.trim(),
      lastUpdated: Date.now(),
      unreadAdmin: true,
      messages: [...(existing.messages || []), newMessage],
    };

    saveLocalChat(updated);
    await setDoc(docRef, updated, { merge: true }).catch(() => {});
  } else {
    // Check local fallback
    const localObj = getLocalChats();
    const existing = localObj[sanitizedId];

    const newChat: SupportChat = {
      id: sanitizedId,
      userId,
      userName: userName || "Kullanıcı",
      userEmail: userEmail || "Bilinmiyor",
      status: existing?.status || "idle",
      lastMessage: text.trim(),
      lastUpdated: Date.now(),
      unreadAdmin: true,
      unreadUser: false,
      messages: existing ? [...existing.messages, newMessage] : [newMessage],
    };

    saveLocalChat(newChat);
    await setDoc(docRef, newChat).catch(() => {});
  }
}

/**
 * Start/Request live agent connection (sets status to "waiting")
 */
export async function requestLiveAgentConnection(
  userId: string,
  userName: string,
  userEmail: string
): Promise<void> {
  const sanitizedId = (userId || userEmail || "guest")
    .trim()
    .toLowerCase()
    .replace(/[^a-z0-9_@.-]/g, "_");

  const docRef = doc(db, "support_chats", sanitizedId);
  const snap = await getDoc(docRef).catch(() => null);

  const now = Date.now();
  let chat: SupportChat;

  if (snap && snap.exists()) {
    chat = snap.data() as SupportChat;
    chat.status = "waiting";
    chat.lastUpdated = now;
    chat.unreadAdmin = true;
  } else {
    const localObj = getLocalChats();
    const existing = localObj[sanitizedId];
    chat = {
      id: sanitizedId,
      userId,
      userName: userName || "Kullanıcı",
      userEmail: userEmail || "Bilinmiyor",
      status: "waiting",
      lastMessage: existing?.lastMessage || "Müşteri temsilcisine bağlanılıyor...",
      lastUpdated: now,
      unreadAdmin: true,
      unreadUser: false,
      messages: existing?.messages || [],
    };
  }

  saveLocalChat(chat);
  await setDoc(docRef, chat, { merge: true }).catch(() => {});
}

/**
 * Admin approves user's support chat request and connects
 */
export async function approveAndConnectSupportChat(chatId: string): Promise<void> {
  const sanitizedId = chatId.trim().toLowerCase().replace(/[^a-z0-9_@.-]/g, "_");

  const newMessage: SupportMessage = {
    id: `msg_${Date.now()}_${Math.random().toString(36).slice(2, 6)}`,
    sender: "system",
    text: "Temsilci sohbete bağlandı. Size nasıl yardımcı olabilirim?",
    timestamp: Date.now(),
  };

  const docRef = doc(db, "support_chats", sanitizedId);
  const snap = await getDoc(docRef).catch(() => null);

  if (snap && snap.exists()) {
    const existing = snap.data() as SupportChat;
    const updated: SupportChat = {
      ...existing,
      status: "active",
      lastMessage: "Temsilci sohbete bağlandı.",
      lastUpdated: Date.now(),
      unreadAdmin: false,
      unreadUser: true,
      messages: [...(existing.messages || []), newMessage],
    };

    saveLocalChat(updated);
    await setDoc(docRef, updated, { merge: true }).catch(() => {});
  } else {
    const localObj = getLocalChats();
    const existing = localObj[sanitizedId];
    if (existing) {
      existing.status = "active";
      existing.lastMessage = "Temsilci sohbete bağlandı.";
      existing.lastUpdated = Date.now();
      existing.unreadAdmin = false;
      existing.unreadUser = true;
      existing.messages.push(newMessage);
      saveLocalChat(existing);
      await setDoc(docRef, existing).catch(() => {});
    }
  }
}

/**
 * Admin sends a reply to user
 */
export async function sendAdminSupportReply(
  chatId: string,
  text: string
): Promise<void> {
  if (!text.trim()) return;

  const sanitizedId = chatId.trim().toLowerCase().replace(/[^a-z0-9_@.-]/g, "_");

  const newMessage: SupportMessage = {
    id: `msg_${Date.now()}_${Math.random().toString(36).slice(2, 6)}`,
    sender: "admin",
    text: text.trim(),
    timestamp: Date.now(),
  };

  const docRef = doc(db, "support_chats", sanitizedId);
  const snap = await getDoc(docRef).catch(() => null);

  if (snap && snap.exists()) {
    const existing = snap.data() as SupportChat;
    const updated: SupportChat = {
      ...existing,
      status: "active",
      lastMessage: text.trim(),
      lastUpdated: Date.now(),
      unreadAdmin: false,
      unreadUser: true,
      messages: [...(existing.messages || []), newMessage],
    };

    saveLocalChat(updated);
    await setDoc(docRef, updated, { merge: true }).catch(() => {});
  } else {
    const localObj = getLocalChats();
    const existing = localObj[sanitizedId];
    if (existing) {
      existing.status = "active";
      existing.lastMessage = text.trim();
      existing.lastUpdated = Date.now();
      existing.unreadAdmin = false;
      existing.unreadUser = true;
      existing.messages.push(newMessage);
      saveLocalChat(existing);
      await setDoc(docRef, existing).catch(() => {});
    }
  }
}

/**
 * Admin sends "Müşteri hizmetleri yoğun daha sonra tekrar deneyin" response
 */
export async function sendAdminBusyResponse(chatId: string): Promise<void> {
  const busyText = "Müşteri hizmetlerimiz şu an yoğun, lütfen daha sonra tekrar deneyiniz.";
  const sanitizedId = chatId.trim().toLowerCase().replace(/[^a-z0-9_@.-]/g, "_");

  const newMessage: SupportMessage = {
    id: `msg_${Date.now()}_${Math.random().toString(36).slice(2, 6)}`,
    sender: "system",
    text: busyText,
    timestamp: Date.now(),
  };

  const docRef = doc(db, "support_chats", sanitizedId);
  const snap = await getDoc(docRef).catch(() => null);

  if (snap && snap.exists()) {
    const existing = snap.data() as SupportChat;
    const updated: SupportChat = {
      ...existing,
      status: "busy",
      lastMessage: busyText,
      lastUpdated: Date.now(),
      unreadAdmin: false,
      unreadUser: true,
      messages: [...(existing.messages || []), newMessage],
    };

    saveLocalChat(updated);
    await setDoc(docRef, updated, { merge: true }).catch(() => {});
  } else {
    const localObj = getLocalChats();
    const existing = localObj[sanitizedId];
    if (existing) {
      existing.status = "busy";
      existing.lastMessage = busyText;
      existing.lastUpdated = Date.now();
      existing.unreadAdmin = false;
      existing.unreadUser = true;
      existing.messages.push(newMessage);
      saveLocalChat(existing);
      await setDoc(docRef, existing).catch(() => {});
    }
  }
}

/**
 * Mark chat messages as read by user
 */
export async function markSupportChatReadByUser(chatId: string): Promise<void> {
  const sanitizedId = chatId.trim().toLowerCase().replace(/[^a-z0-9_@.-]/g, "_");
  const docRef = doc(db, "support_chats", sanitizedId);

  const localObj = getLocalChats();
  if (localObj[sanitizedId]) {
    localObj[sanitizedId].unreadUser = false;
    saveLocalChat(localObj[sanitizedId]);
  }

  await updateDoc(docRef, { unreadUser: false }).catch(() => {});
}
