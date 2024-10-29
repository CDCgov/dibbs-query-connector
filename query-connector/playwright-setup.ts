export const TEST_URL =
  process.env.TEST_ENV ?? "http://localhost:3000/tefca-viewer";
export const HAPI_SERVER_PATIENT_URL = "http://localhost:8080/fhir/Patient";

/**
 *
 */
async function globalSetup() {
  const maxRetries = 300; // Maximum number of retries
  const delay = 1000; // Delay between retries in milliseconds

  // Step 1: Check TEST_URL
  for (let attempts = 0; attempts < maxRetries; attempts++) {
    try {
      const response = await fetch(TEST_URL);
      if (response.status === 200) {
        console.log(`Connected to ${TEST_URL} successfully.`);
        break; // Proceed to the FHIR server check
      } else {
        console.log(
          `Failed to connect to ${TEST_URL}, status: ${response.status}. Retrying...`,
        );
        await new Promise((resolve) => setTimeout(resolve, delay));
      }
    } catch (error) {
      console.log(
        `Fetch failed for ${TEST_URL}: ${(error as Error).message}. Retrying...`,
      );
      await new Promise((resolve) => setTimeout(resolve, delay));
    }
  }

  // Step 2: Check HAPI_SERVER_PATIENT_URL for data
  for (let attempts = 0; attempts < maxRetries; attempts++) {
    try {
      const response = await fetch(HAPI_SERVER_PATIENT_URL);
      if (response.status === 200) {
        const data = await response.json();
        if (data && data.entry && data.entry.length > 0) {
          console.log(`Data found at ${HAPI_SERVER_PATIENT_URL}.`);
          return;
        } else {
          console.log(
            `No data available at ${HAPI_SERVER_PATIENT_URL}. Retrying...`,
          );
        }
      } else {
        console.log(
          `Failed to connect to ${HAPI_SERVER_PATIENT_URL}, status: ${response.status}. Retrying...`,
        );
      }
      await new Promise((resolve) => setTimeout(resolve, delay));
    } catch (error) {
      console.log(
        `Fetch failed for ${HAPI_SERVER_PATIENT_URL}: ${
          (error as Error).message
        }. Retrying...`,
      );
      await new Promise((resolve) => setTimeout(resolve, delay));
    }
  }

  throw new Error(
    `Unable to find data at ${HAPI_SERVER_PATIENT_URL} after ${maxRetries} attempts.`,
  );
}

export default globalSetup;
