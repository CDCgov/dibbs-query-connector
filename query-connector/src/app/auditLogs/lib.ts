import { auth } from "@/auth";
import crypto from "crypto";

// these functions are exported from another file into the auditable file
//  to allow us to spy on them when calling @auditable functions
// Relevant thread: https://stackoverflow.com/questions/61111423/expected-spyon-function-to-be-called-jest

/**
 * Helper function that formats method input into the values needed by the audit
 * log table
 * @param methodName - name of the method to audit
 * @param argLabels - name of the params
 * @param args - value of the arguments
 * @returns an array of values to be inserted into the table
 */
export async function generateAuditValues(
  methodName: string,
  argLabels: string[],
  args: unknown[],
) {
  const session = await auth();
  const author = `${session?.user?.username}`;
  const timestamp = new Date().toISOString();
  const auditContents = generateAuditMessage(argLabels, args);
  const auditChecksum = generateAuditChecksum(author, auditContents, timestamp);
  return [author, methodName, auditContents, timestamp, auditChecksum];
}

/**
 * Helper function that generates message contents
 * @param argLabels - the name of the parameters being passed into the function
 * @param args - the values of the parameters being passed in
 * @returns A JSON object with {argName: argValue}
 */
function generateAuditMessage(argLabels: string[], args: unknown[]) {
  // can do more fancy serialization here if needed
  const mappedArgs: { [s: string]: string } = {};
  args.forEach((obj, i) => {
    if (obj) {
      const val = JSON.stringify(obj);
      if (val !== "{}" && val !== "[]") {
        mappedArgs[argLabels[i]] = sanitizeString(JSON.stringify(obj));
      }
    }
  });

  return mappedArgs;
}

/**
 * Helper function that generates a checksum for audit contents based on audit
 * contents, author, and timestamp
 * @param author - name of the author
 * @param auditContents - the contents of the message being stored
 * @param timestamp - the time the message was created in the database
 * @returns A SHA-2 strength or greater checksum
 */
export function generateAuditChecksum(
  author: string,
  auditContents: object,
  timestamp: string,
) {
  const input = JSON.stringify({ author, auditContents, timestamp });
  return crypto.createHash("sha256").update(input).digest("hex");
}

function sanitizeString(s: string) {
  // add any other sanitization functions we need to this array
  const functionsToApply = [redactBearerToken];
  return functionsToApply.reduce((acc, cur) => cur(acc), s);
}

function redactBearerToken(s: string) {
  return s.replace(/"Bearer\s+([^\s]+)\"}/g, '"Bearer REDACTED"}');
}
