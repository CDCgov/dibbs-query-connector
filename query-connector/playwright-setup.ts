export const TEST_URL = process.env.TEST_ENV ?? "http://localhost:3000/";
/**
 *
 */
async function globalSetup() {
  const maxRetries = 300; // Maximum number of retries
  const delay = 5000; // Delay between retries in milliseconds

  // Check TEST_URL
  for (let attempts = 0; attempts < maxRetries; attempts++) {
    try {
      const response = await fetch(TEST_URL);
      if (response.status === 200) {
        console.log(`Connected to ${TEST_URL} successfully.`);
        break; // Proceed to the FHIR server check
      } else {
        console.log(
          `Failed to connect to ${TEST_URL}, status: ${response.status}. Error: ${response.text} Retrying...`,
        );
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
  }
}

export default globalSetup;
