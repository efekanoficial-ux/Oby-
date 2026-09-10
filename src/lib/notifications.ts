import { getToken } from "firebase/messaging";
import { messaging } from "./firebase";

export async function requestNotificationPermission() {
  if (!messaging) return null;
  try {
    const permission = await Notification.requestPermission();
    if (permission === 'granted') {
        const token = await getToken(messaging, { vapidKey: "BL16Sb4R1mG2ocQLWaaW9WkXuM7tGdVamhbcp4AV6WcUBLo2vkxmJdo0rTq5iVoqs8ocFDoCx6Z90O-2wSlXobM" });
        return token;
    }
  } catch (error) {
    console.error("Error requesting permission", error);
  }
  return null;
}
