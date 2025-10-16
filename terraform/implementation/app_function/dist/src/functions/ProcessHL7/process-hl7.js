"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const functions_1 = require("@azure/functions");
const post_hl7_1 = require("../PostHL7/post-hl7");
const queryId = process.env.QUERY_ID;
const fhirServer = process.env.FHIR_SERVER;
const serviceToken = process.env.SERVICE_TOKEN;
const endpoint = process.env.QUERY_CONNECTOR_ENDPOINT;
const blobPath = process.env.BLOB_PATH;
async function hl7BlobHandler(content, context) {
  const hl7 = content.toString("utf-8");
  try {
    const res = await (0, post_hl7_1.postHL7)({
      queryId,
      fhirServer,
      serviceToken,
      hl7Message: hl7,
      endpoint: endpoint || "https://queryconnector.dev/api/query",
    });
    const body = await res.text();
    if (!res.ok) {
      context.log("HL7 POST failed", { status: res.status, body });
    } else {
      context.log("HL7 POST succeeded");
    }
  } catch (err) {
    context.log("Exception during HL7 POST:", err);
  }
}
functions_1.app.storageBlob("hl7BlobTrigger", {
  path: blobPath,
  connection: "AzureWebJobsStorage",
  handler: hl7BlobHandler,
});
