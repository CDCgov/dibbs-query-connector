import { postHL7 } from "../PostHL7/post-hl7";

const queryId = process.env.QUERY_ID!;
const fhirServer = process.env.FHIR_SERVER!;
const serviceToken = process.env.SERVICE_TOKEN!;
const endpoint = process.env.QUERY_CONNECTOR_ENDPOINT;

interface BlobTriggerContext {
  log: {
    (message: string, ...args: unknown[]): void;
    error: (message: string, ...args: unknown[]) => void;
  };
}

interface PostHL7Params {
  queryId: string;
  fhirServer: string;
  serviceToken: string;
  hl7Message: string;
  endpoint?: string;
}

const blobTrigger = async function (
  context: BlobTriggerContext,
  content: Buffer,
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
      context.log.error("HL7 POST failed", { status: res.status, body });
    } else {
      context.log("HL7 POST succeeded");
    }
  } catch (err: unknown) {
    context.log.error("Exception during HL7 POST:", err);
  }
};

export default blobTrigger;
