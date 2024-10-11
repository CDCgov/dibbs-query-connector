/**
 *
 */

export const TEST_URL =
  process.env.TEST_ENV ?? "http://localhost:3000/tefca-viewer";

/**
 *
 */
async function globalSetup() {
  const maxRetries = 300; // Maximum number of retries
  const delay = 1000; // Delay between retries in milliseconds

  for (let attempts = 0; attempts < maxRetries; attempts++) {
    try {
      const response = await fetch(TEST_URL); // Fetch the TEST_URL
      if (response.status === 200) {
        console.log(`Connected to ${TEST_URL} successfully.`);
        return; // Exit the function if the webpage loads successfully
      } else {
        console.log(
          `Failed to connect to ${TEST_URL}, status: ${response.status}. Retrying...`,
        );
        // Wait before the next attempt
        await new Promise((resolve) => setTimeout(resolve, delay));
      }
    } catch (error) {
      console.log(
        `Fetch failed for ${TEST_URL}: ${
          (error as Error).message
        }. Retrying...`,
      );
      await new Promise((resolve) => setTimeout(resolve, delay));
    }
    // Wait before the next attempt
    await new Promise((resolve) => setTimeout(resolve, delay));
  }

  throw new Error(
    `Unable to connect to ${TEST_URL} after ${maxRetries} attempts.`,
  );
}

export default globalSetup;
