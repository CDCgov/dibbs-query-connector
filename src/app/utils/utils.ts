/**
 * Fetches a URL without SSL verification. This is useful for
 * FHIR servers that are not using SSL or have self-signed certificates.
 * @param url The URL to fetch.
 * @param options The options to pass to the fetch function.
 * @returns The response from the fetch function.
 */
export async function fetchWithoutSSL(url: string, options: RequestInit = {}) {
  const originalValue = process.env.NODE_TLS_REJECT_UNAUTHORIZED;
  process.env.NODE_TLS_REJECT_UNAUTHORIZED = "0";

  try {
    const response = await fetch(url, options);
    return response;
  } finally {
    // Restore the original environment variable value
    if (originalValue === undefined) {
      delete process.env.NODE_TLS_REJECT_UNAUTHORIZED;
    } else {
      process.env.NODE_TLS_REJECT_UNAUTHORIZED = originalValue;
    }
  }
}
