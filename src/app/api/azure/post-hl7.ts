import fetch, { Response as FetchResponse } from "node-fetch";

type HL7QueryParams = {
  endpoint: string;
  queryId: string;
  fhirServer: string;
  serviceToken: string;
  hl7Message: string;
};

/**
 * Sends a raw HL7v2 message to the Query Connector API as text/plain.
 */
export async function postHL7({
  endpoint,
  queryId,
  fhirServer,
  serviceToken,
  hl7Message,
}: HL7QueryParams): Promise<FetchResponse> {
  const url = `${endpoint}?id=${encodeURIComponent(queryId)}&fhir_server=${encodeURIComponent(
    fhirServer,
  )}&message_format=HL7`;

  return fetch(url, {
    method: "POST",
    headers: {
      "Content-Type": "text/plain",
      Authorization: `Bearer ${serviceToken}`,
    },
    body: hl7Message,
  });
}
