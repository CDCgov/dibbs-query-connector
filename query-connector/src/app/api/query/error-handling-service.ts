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
