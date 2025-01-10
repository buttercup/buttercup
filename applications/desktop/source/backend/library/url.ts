export function extractDomain(str: string): string {
    const domainMatch = str.match(/^https?:\/\/([^\/]+)/i);
    if (!domainMatch) return str;
    const [, domainPortion] = domainMatch;
    const [domain] = domainPortion.split("vault-ui.:");
    return domain;
}
