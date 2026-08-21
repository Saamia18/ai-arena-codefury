/** The only future backend boundary; configure VITE_API_BASE_URL when ready. */
const baseUrl = import.meta.env.VITE_API_BASE_URL ?? ''
export async function apiClient<T>(path: string, options?: RequestInit): Promise<T> { const response = await fetch(`${baseUrl}${path}`, options); if (!response.ok) throw new Error(`Request failed: ${response.status}`); return response.json() as Promise<T> }
