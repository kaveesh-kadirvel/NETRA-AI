export function getAppBaseUrl(): URL | null {
    if (process.env.VERCEL_URL) return new URL(`https://${process.env.VERCEL_URL}`);

    const configuredUrl = process.env.NEXT_PUBLIC_APP_URL || process.env.NEXTAUTH_URL;
    if (!configuredUrl) return null;

    try {
        return new URL(configuredUrl);
    } catch {
        return null;
    }
}