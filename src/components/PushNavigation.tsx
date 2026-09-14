import { useEffect, useRef, useState } from 'react';
import * as Notifications from 'expo-notifications';
import { router, useRootNavigationState } from 'expo-router';
import { Alert } from 'react-native';
import { useProfiles } from '../lib/profiles/ProfilesContext';
import '../lib/notifications';

import { notificationAgentId, notificationServerUrl } from '../lib/notificationDeployment';
export function PushNavigation() {
  const { loaded, profiles, activeProfile, setActive } = useProfiles();
  const navigation = useRootNavigationState();
  const [pending, setPending] = useState<{ agentId: string; conversationId: string } | null>(null);
  const seen = useRef(new Set<string>());
  useEffect(() => {
    function receive(response: Notifications.NotificationResponse | null) {
      if (!response) return;
      const id = response.notification.request.identifier;
      if (seen.current.has(id)) return;
      const data = response.notification.request.content.data;
      if (!notificationAgentId || !notificationServerUrl || !data || data.agentId !== notificationAgentId || typeof data.conversationId !== 'string' || !/^[-a-zA-Z0-9_]{1,160}$/.test(data.conversationId)) return;
      seen.current.add(id);
      setPending({ agentId: notificationAgentId, conversationId: data.conversationId });
      void Notifications.clearLastNotificationResponseAsync();
    }
    const subscription = Notifications.addNotificationResponseReceivedListener(receive);
    void Notifications.getLastNotificationResponseAsync().then(receive).catch(() => {});
    return () => subscription.remove();
  }, []);
  useEffect(() => {
    if (!pending || !loaded || !navigation?.key) return;
    const matches = profiles.filter(p => p.type === 'remote' && p.url.replace(/\/$/, '') === notificationServerUrl);
    if (matches.length !== 1) { setPending(null); Alert.alert('Open Anna’s profile', 'Select Anna’s server profile and open the conversation to review this notification.'); return; }
    const profile = matches[0]!;
    if (activeProfile?.id !== profile.id) { void setActive(profile.id).catch(() => { setPending(null); }); return; }
    router.push({ pathname: '/chat', params: { ...pending, agentName: 'Anna' } });
    setPending(null);
  }, [pending, loaded, navigation?.key, profiles, activeProfile?.id, setActive]);
  return null;
}
