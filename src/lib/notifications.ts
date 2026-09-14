import * as Notifications from 'expo-notifications';
import * as SecureStore from 'expo-secure-store';
import { AppState, Platform } from 'react-native';
import { suppressChatNotification, type VisibleChat } from './notificationVisibility';
let visibleChat: VisibleChat | null = null;
export function markChatVisible(chat: VisibleChat): () => void {
  visibleChat = chat;
  return () => { if (visibleChat === chat) visibleChat = null; };
}

const TOKEN_KEY = 'anna.push.device-token';
Notifications.setNotificationHandler({
  handleNotification: async (notification) => {
    const show = !suppressChatNotification(AppState.currentState === 'active', visibleChat, notification.request.content.data);
    return { shouldPlaySound: show, shouldSetBadge: false, shouldShowBanner: show, shouldShowList: show };
  },
});

// Native FCM token only. No Expo push account or server secret is used here.
export async function registerPush(): Promise<string | null> {
  if (Platform.OS !== 'android') return null;
  await Notifications.setNotificationChannelAsync('anna-activity', {
    name: 'Anna completions and approvals', importance: Notifications.AndroidImportance.HIGH,
    lockscreenVisibility: Notifications.AndroidNotificationVisibility.PRIVATE,
  });
  let permission = await Notifications.getPermissionsAsync();
  if (!permission.granted) permission = await Notifications.requestPermissionsAsync();
  if (!permission.granted) return null;
  const token = await Notifications.getDevicePushTokenAsync();
  if (typeof token.data !== 'string') throw new Error('Unexpected push token format');
  await SecureStore.setItemAsync(TOKEN_KEY, token.data);
  return token.data;
}
