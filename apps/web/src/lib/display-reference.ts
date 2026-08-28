export function displayReference(reference: string): string {
  return reference.startsWith("SYN-") ? `RS-${reference.slice(4)}` : reference;
}
