import { useState } from 'react';
import * as Clipboard from 'expo-clipboard';
import { Alert, View } from 'react-native';
import { Header, Screen } from '../components/ui/Screen';
import { Text } from '../components/ui/Text';
import { Touchable } from '../components/ui/Touchable';
import { registerPush } from '../lib/notifications';

export default function NotificationSettings() {
  const [busy, setBusy] = useState(false);
  const [status, setStatus] = useState('Enable notifications, then provision this phone token on your relay.');
  async function enable() {
    setBusy(true);
    try {
      const token = await registerPush();
      if (!token) { setStatus('Notification permission was not granted. Enable it in Android settings.'); return; }
      await Clipboard.setStringAsync(token);
      setStatus('Phone token copied. Transfer it securely to the relay. Never share it publicly. Repeat after reinstalling the app or if delivery stops.');
    } catch { Alert.alert('Registration failed', 'Check your connection and try again.'); }
    finally { setBusy(false); }
  }
  return <Screen><Header title="Notifications" back /><View style={{ padding: 24, gap: 24 }}>
    <Text>{status}</Text>
    <Touchable accessibilityRole="button" accessibilityLabel="Enable and copy phone token" disabled={busy} onPress={() => void enable()} style={{ padding: 16 }}>
      <Text>{busy ? 'Registering…' : 'Enable and copy phone token'}</Text>
    </Touchable>
    <Text>Push delivery requires a configured relay. This screen alone does not enable server monitoring. Notifications never approve tools automatically.</Text>
  </View></Screen>;
}
