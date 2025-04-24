import { OperationOutcome } from "fhir/r4";
import { NextResponse } from "next/server";

/**
 * Handles a request error by returning an OperationOutcome with a diagnostics message.
 * @param diagnostics_message - The message to be included in the `diagnostics` section
 * of the OperationOutcome.
 * @returns OperationOutcome with the included error message.
 */
export async function handleRequestError(
  diagnostics_message: string,
): Promise<OperationOutcome> {
  const OperationOutcome: OperationOutcome = {
    resourceType: "OperationOutcome",
    issue: [
      {
        severity: "error",
        code: "invalid",
        diagnostics: diagnostics_message,
      },
    ],
  };
  return OperationOutcome;
}

/**
 *
 * @param error - the error to parse / return as needed
 * @param status - Status for error, defaults to 500
 * @returns a Next response with information about the outcome and the status
 */
export async function handleAndReturnError(error: unknown, status = 500) {
  let diagnostics_message = "An error has occurred";

  let OperationOutcome;
  if (typeof error === "string") {
    diagnostics_message = `${diagnostics_message}: ${error}`;
    OperationOutcome = await handleRequestError(error as string);
  } else {
    if (error instanceof Error) {
      diagnostics_message = `${diagnostics_message}: ${error}`;
    }
    OperationOutcome = await handleRequestError(diagnostics_message);
  }
  console.error(error);
  return NextResponse.json(OperationOutcome, { status: status });
}
