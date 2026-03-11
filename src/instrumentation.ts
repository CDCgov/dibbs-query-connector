/**
 * Next.js instrumentation hook — called once when the server starts.
 * Pre-warms the Secrets Manager password cache so the first database
 * connection doesn't have to wait for the fetch.
 */
export async function register() {
  if (process.env.DB_SECRET_ARN) {
    const { fetchDbPassword } = await import("@/app/backend/db/config");
    await fetchDbPassword();
  }
}
