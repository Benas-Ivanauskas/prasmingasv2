// Replace the item at `index` with a patched copy — used by every repeatable
// list in the form (images, program days, pickup points, extras, cabins).
export function patchAt<T>(list: T[], index: number, patch: Partial<T>): T[] {
  return list.map((item, i) => (i === index ? { ...item, ...patch } : item));
}

export function removeAt<T>(list: T[], index: number): T[] {
  return list.filter((_, i) => i !== index);
}

export function moveAt<T>(list: T[], from: number, to: number): T[] {
  if (from === to) return list;
  const next = [...list];
  const [moved] = next.splice(from, 1);
  next.splice(to, 0, moved);
  return next;
}

export const linesToList = (text: string) => text.split("\n");
export const listToLines = (list?: string[]) => (list ?? []).join("\n");
export const cleanLines = (list?: string[]) =>
  (list ?? []).map((l) => l.trim()).filter(Boolean);
