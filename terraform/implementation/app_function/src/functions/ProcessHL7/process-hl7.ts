import { app, InvocationContext } from "@azure/functions";
import { postHL7 } from "../PostHL7/post-hl7";

const queryId = process.env.QUERY_ID!;
const fhirServer = process.env.FHIR_SERVER!;
const serviceToken = process.env.SERVICE_TOKEN!;
const endpoint = process.env.QUERY_CONNECTOR_ENDPOINT;
const blobPath = process.env.BLOB_PATH!;

async function hl7BlobHandler(
  content: Buffer,
  context: InvocationContext,
): Promise<void> {
  const hl7 = content.toString("utf-8");

  try {
    const res = await postHL7({
      queryId,
      fhirServer,
      serviceToken,
      hl7Message: hl7,
      endpoint: endpoint || "https://queryconnector.dev/api/query",
    });

    const body: string = await res.text();

    if (!res.ok) {
      context.log("HL7 POST failed", { status: res.status, body });
    } else {
      context.log("HL7 POST succeeded");
    }
  } catch (err: unknown) {
    context.log("Exception during HL7 POST:", err);
  }
}

app.storageBlob("hl7BlobTrigger", {
  path: blobPath,
  connection: "AzureWebJobsStorage",
  handler: hl7BlobHandler,
});
