/* eslint-disable @typescript-eslint/no-explicit-any */
import { getDbClient } from "../backend/dbClient";
import { generateAuditValues } from "./lib";

export const AUDIT_LOG_MAX_RETRIES = 3;
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

    // using this recursive pattern with .then's rather than async / await to
    // allow for the decorator to work on synchronous functions
    const attemptWrite = (retryCounter: number): Promise<void> => {
      return generateAuditValues(key, argLabels, args)
        .then((auditValues) => dbConnection.query(query, auditValues))
        .then((result) => {
          const auditMetadata = result.rows[0];
          console.info(
            `${auditMetadata.action_type} audit action with id ${auditMetadata?.id} and checksum ${auditMetadata?.audit_checksum} added to audit table`,
          );
          return;
        })
        .catch((e) => {
          console.error(
            `Audit log write attempt ${
              retryCounter + 1
            } failed with error: ${e}. ${
              retryCounter + 1 < AUDIT_LOG_MAX_RETRIES ? "Retrying..." : ""
            }`,
          );

          if (retryCounter + 1 >= AUDIT_LOG_MAX_RETRIES) {
            console.info(
              `Audit log write attempt for ${key} failed after ${AUDIT_LOG_MAX_RETRIES} attempts.`,
            );
            return;
          }

          // Add exponential backoff
          return new Promise<void>((resolve) =>
            setTimeout(
              () => {
                resolve(attemptWrite(retryCounter + 1));
              },
              1000 * Math.pow(2, retryCounter),
            ),
          );
        });
    };

    // Start the first attempt
    return attemptWrite(0);
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
