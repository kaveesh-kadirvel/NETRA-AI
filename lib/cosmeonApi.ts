export function getCosmeonApi() {
    const baseUrl = process.env.COSMEON_API_URL;
    const token = process.env.COSMEON_API_TOKEN;

    if (!baseUrl || !token) return null;

    return {
        token,
        url: (path: string) => new URL(path, baseUrl.endsWith('/') ? baseUrl : `${baseUrl}/`),
    };
}