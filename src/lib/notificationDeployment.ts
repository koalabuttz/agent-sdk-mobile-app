// Expo statically replaces these public build-time identifiers. Never put
// credentials in EXPO_PUBLIC variables. Unconfigured builds disable routing.
export const notificationAgentId = process.env.EXPO_PUBLIC_NOTIFICATION_AGENT_ID || null;
export const notificationServerUrl = process.env.EXPO_PUBLIC_NOTIFICATION_SERVER_URL?.replace(/\/$/, '') || null;
