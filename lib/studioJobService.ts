export function getStudioJobService() {
    const baseUrl = process.env.STUDIO_JOB_API_URL;
    const token = process.env.STUDIO_JOB_API_TOKEN;

    if (!baseUrl || !token) return null;

    return {
        token,
        url: (path: string) => new URL(path, baseUrl.endsWith('/') ? baseUrl : `${baseUrl}/`),
    };
}