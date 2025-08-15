import { Agent } from "undici";

/**
 * Fetches a URL without SSL verification. This is useful for
 * FHIR servers that are not using SSL or have self-signed certificates.
 *
 * WARNING: YOU SHOULD ONLY BE USING THIS LOCALLY OR IN CONTROLLED ENVIRONMENTS.
 * @param url The URL to fetch.
 * @param options The options to pass to the fetch function.
 * @returns The response from the fetch function.
 */
export async function fetchWithoutSSL(url: string, options: RequestInit = {}) {
  const agent = new Agent({ connect: { rejectUnauthorized: false } });

  try {
    const response = await fetch(url, {
      ...options,
      // @ts-ignore - Node.js fetch supports agent option
      dispatcher: agent,
    });
    return response;
  } catch (error) {
    const message =
      error instanceof Error
        ? error.message
        : "Unknown error during fetchWithoutSSL";
    throw new Error(`Failed to fetch URL without SSL verification: ${message}`);
  }
}
