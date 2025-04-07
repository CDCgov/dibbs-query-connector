/* eslint-disable @typescript-eslint/no-explicit-any */
import { getDbClient } from "../backend/dbClient";
import { generateAuditValues, generateAuditChecksum } from "./lib";

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
    const insertQuery = `INSERT INTO 
          audit_logs (author, action_type, audit_message) 
          VALUES ($1, $2, $3)
          RETURNING id, author, action_type, audit_message, created_at`;

    const updateQuery = `UPDATE audit_logs 
          SET audit_checksum = $1 
          WHERE id = $2`;

    // using this recursive pattern with .then's rather than async / await to
    // allow for the decorator to work on synchronous functions
    const attemptWrite = (retryCounter: number): Promise<void> => {
      return generateAuditValues(key, argLabels, args)
        .then(async ([author, methodName, auditMessage]) => {
          // Step 1: Insert audit row without checksum
          const result = await dbConnection.query(insertQuery, [
            author,
            methodName,
            JSON.stringify(auditMessage),
          ]);

          const insertedRow = result.rows[0];
          const timestamp = insertedRow.created_at.toISOString();

          // Step 2: Compute checksum with real timestamp
          const checksum = generateAuditChecksum(
            insertedRow.author,
            auditMessage,
            timestamp,
          );

          // Step 3: Update row with checksum
          await dbConnection.query(updateQuery, [checksum, insertedRow.id]);

          console.info(
            `${insertedRow.action_type} audit action with id ${insertedRow.id} and checksum ${checksum} added to audit table`,
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
