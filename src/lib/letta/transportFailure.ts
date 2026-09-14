// Do not classify arbitrary tool/LLM failures by loose words like "connection".
// SDK stream_closed is transport-level; this exact fallback covers older SDKs.
export function isSessionTransportFailure(message: { type: string; errorCode?: string; message?: string; errorDetail?: string; error?: string }): boolean {
  if (message.type !== 'error' && message.type !== 'result') return false;
  if (message.errorCode === 'stream_closed') return true;
  return /connection closed unexpectedly[;:]\s*resume the conversation to continue/i.test(
    message.message ?? message.errorDetail ?? message.error ?? '',
  );
}
