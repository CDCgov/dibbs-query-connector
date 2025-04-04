/* eslint-disable @typescript-eslint/no-explicit-any */
import { auth } from "@/auth";
import { getDbClient } from "../backend/dbClient";

/**
 * Decorator that adds audit log write logic to an annotated function
 * @param target - reference back to the Object prototype of the class
 * @param key - name of method
 * @param descriptor - metadata about the functin
 * @returns The result of the function, with the args / result logged appropriately
 */
export function auditable(
  target: any,
  key: string,
  descriptor: PropertyDescriptor,
) {
  const dbConnection = getDbClient();
  const method = descriptor.value;
  const argLabels = target[key]
    .toString()
    // match everything between the first "(" and first ")" and use [1] to get
    // everything in the first capture group (ie exclude the lead / trail parens)
    .match(/\(([^)]*)\)/)[1]
    .split(", ");

  const writeToAuditTable = async (args: any[]) => {
    const query = `INSERT INTO 
        audit_logs (author, action_type, audit_checksum, audit_message) 
        VALUES ($1, $2, $3, $4)
        RETURNING id, action_type, audit_checksum`;

    const MAX_RETRIES = 3;
    let retryCounter = 0;

    while (retryCounter < MAX_RETRIES) {
      try {
        const auditValues = await generateAuditValues(key, argLabels, args);
        const result = await dbConnection.query(query, auditValues);
        const auditMetadata = result.rows[0];
        console.info(
          `${auditMetadata.action_type} audit action with id ${auditMetadata?.id} and checksum ${auditMetadata?.audit_checksum} added to audit table`,
        );

        return;
      } catch (e) {
        console.error(
          `Audit log write attempt ${
            retryCounter + 1
          } failed with error: ${e}. Retrying...`,
        );
        retryCounter += 1;

        if (retryCounter < MAX_RETRIES) {
          // exponentially back off retry
          await new Promise((resolve) =>
            setTimeout(resolve, 1000 * Math.pow(2, retryCounter - 1)),
          );
        }
      }
    }

    console.info(
      `Audit log write attempt for ${key} failed after ${retryCounter} attempts.`,
    );
    return;
  };

  const decoratedFunctionIsAsync = method.constructor.name === "AsyncFunction";

  // need to do this check so that async vs sync returns are properly typed
  descriptor.value = decoratedFunctionIsAsync
    ? async function (this: unknown, ...args: unknown[]) {
        try {
          writeToAuditTable(args);

          return await method.apply(this, args);
        } catch (error) {
          console.error(`Async method ${key} threw error`, error);
          throw error;
        }
      }
    : function (this: unknown, ...args: unknown[]) {
        try {
          writeToAuditTable(args);

          return method.apply(this, args);
        } catch (error) {
          console.error(`Method ${key} threw error`, error);
          throw error;
        }
      };

  return descriptor;
}

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

  const auditContents = generateAuditMessage(argLabels, args);
  const auditChecksum = generateAuditChecksum(author, auditContents);
  return [author, methodName, auditChecksum, auditContents];
}

/**
 * Helper function that generates message contents
 * @param argLabels - the name of the parameters being passed into the function
 * @param args - the values of the parameters being passed in
 * @returns A JSON object with {argName: argValue}
 */
export function generateAuditMessage(argLabels: string[], args: unknown[]) {
  // can do more fancy serialization here if needed
  const mappedArgs: { [s: string]: string } = {};
  args.forEach((obj, i) => {
    if (obj) {
      const val = JSON.stringify(obj);
      // these strings return truthy in the if(obj) so explicitly compare them
      // to filter them on
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
 * @returns A SHA-2 strength or greater checksum
 */
export function generateAuditChecksum(author: string, auditContents: Object) {
  // TODO: implement this properly
  return "result of some SHA-2 hashing algo based on author and audit contents";
}

function sanitizeString(s: string) {
  // add any other sanitization functions we need to this array
  const functionsToApply = [redactBearerToken];
  return functionsToApply.reduce((acc, cur) => cur(acc), s);
}

function redactBearerToken(s: string) {
  return s.replace(/"Bearer\s+([^\s]+)\"}/g, '"Bearer REDACTED"}');
}
