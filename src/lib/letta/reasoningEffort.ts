export function readReasoningEffort(value: unknown): string | null {
  if (!value || typeof value !== 'object') return null;
  const settings = value as Record<string, unknown>;
  const reasoning = settings.reasoning && typeof settings.reasoning === 'object' ? settings.reasoning as Record<string, unknown> : {};
  for (const effort of [reasoning.reasoning_effort, settings.reasoning_effort, settings.effort]) {
    if (typeof effort === 'string' && effort) return effort;
  }
  const thinking = settings.thinking as { type?: string } | undefined;
  return thinking?.type === 'enabled' || thinking?.type === 'adaptive' ? 'thinking' : null;
}
