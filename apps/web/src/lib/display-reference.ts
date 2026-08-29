export function displayReference(reference: string): string {
  return reference.startsWith("SYN-") ? `RS-${reference.slice(4)}` : reference;
}

export function displayApplicationReference(applicationId: string): string {
  const distinctSuffix = applicationId.replace(/[^a-zA-Z0-9]/g, "").slice(-12).toUpperCase();
  return `RS-${distinctSuffix}`;
}
