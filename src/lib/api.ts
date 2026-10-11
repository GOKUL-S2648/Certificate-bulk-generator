import { supabase } from './supabase.ts';

/**
 * Send API requests with the current Supabase access token.
 */
export async function apiFetch(
  input: RequestInfo | URL,
  init: RequestInit = {},
): Promise<Response> {
  const headers = new Headers(init.headers);

  const {
    data: { session },
    error,
  } = await supabase.auth.getSession();

  if (error) {
    throw new Error(
      `Unable to read authentication session: ${error.message}`,
    );
  }

  if (session?.access_token) {
    headers.set(
      'Authorization',
      `Bearer ${session.access_token}`,
    );
  }

  return fetch(input, {
    ...init,
    headers,
  });
}

/**
 * Download a protected file using the authenticated API.
 */
export async function apiDownload(
  url: string,
  filename: string,
): Promise<void> {
  const response = await apiFetch(url);

  if (!response.ok) {
    const responseText = await response.text();
    let message = responseText;

    try {
      const data = JSON.parse(responseText);
      message =
        data.message ||
        data.error ||
        responseText;
    } catch {
      // Preserve the original response text.
    }

    throw new Error(
      message || `Download failed (${response.status})`,
    );
  }

  const blob = await response.blob();
  const objectUrl = URL.createObjectURL(blob);
  const link = document.createElement('a');

  link.href = objectUrl;
  link.download = filename;

  document.body.appendChild(link);
  link.click();
  link.remove();

  window.setTimeout(() => {
    URL.revokeObjectURL(objectUrl);
  }, 1000);
}