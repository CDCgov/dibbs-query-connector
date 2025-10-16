"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.postHL7 = postHL7;
/**
 * Sends a raw HL7v2 message to the Query Connector API as text/plain.
 * @param root0 - The parameters for the HL7 query.
 * @param root0.endpoint - The endpoint URL of the Query Connector API.
 * @param root0.queryId - The unique identifier for the query.
 * @param root0.fhirServer - The FHIR server to associate with the query.
 * @param root0.serviceToken - The service token for authentication.
 * @param root0.hl7Message - The HL7v2 message to be sent.
 * @returns A promise that resolves to the fetch response.
 */
async function postHL7({
  endpoint,
  queryId,
  fhirServer,
  serviceToken,
  hl7Message,
}) {
  const url = `${endpoint}?id=${encodeURIComponent(queryId)}&fhir_server=${encodeURIComponent(fhirServer)}&message_format=HL7`;
  return fetch(url, {
    method: "POST",
    headers: {
      "Content-Type": "text/plain",
      Authorization: `Bearer ${serviceToken}`,
    },
    body: hl7Message,
  });
}
