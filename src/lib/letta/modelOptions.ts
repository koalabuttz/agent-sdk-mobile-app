// The selection API takes a handle: identical handles are one choice, while
// identical display names from different providers must remain separate.
export function uniqueModelOptions<T extends { handle: string }>(models: T[]): T[] {
  const seen = new Set<string>();
  return models.filter(model => {
    if (seen.has(model.handle)) return false;
    seen.add(model.handle);
    return true;
  });
}
