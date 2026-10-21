/* eslint-disable @typescript-eslint/no-explicit-any */
import dbService from "../db/service";
import { generateAuditSuccessMessage, generateAuditValues } from "./lib";

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
  console.log("starting audit ");

  const argLabels = target[key]
    .toString()
    // match everything between the first "(" and first ")" and use [1] to get
    // everything in the first capture group (ie exclude the lead / trail parens)
    .match(/\(([^)]*)\)/)[1]
    .split(", ");

  const writeToAuditTable = async (args: any[]) => {
    const insertQuery = `INSERT INTO 
          audit_logs (author, action_type, audit_message, created_at, audit_checksum) 
          VALUES ($1, $2, $3, $4, $5)
          RETURNING id, author, action_type, audit_checksum`;

    // using this recursive pattern with .then's rather than async / await to
    // allow for the decorator to work on synchronous functions
    const attemptWrite = async (retryCounter: number): Promise<void> => {
      try {
        const [author, methodName_1, auditMessage, timestamp, auditChecksum] =
          await generateAuditValues(key, argLabels, args);
        const result = await dbService.query(insertQuery, [
          author,
          methodName_1,
          auditMessage,
          timestamp,
          auditChecksum,
        ]);

        const insertedRow = result.rows[0];
        const successMessage = generateAuditSuccessMessage(
          insertedRow?.actionType ?? insertedRow?.action_type,
          insertedRow.id,
          auditChecksum as string,
        );
        console.info(successMessage);
        return;
      } catch (e) {
        console.error(
          `Audit log write attempt ${retryCounter + 1} failed with error: ${e}. ${retryCounter + 1 < AUDIT_LOG_MAX_RETRIES ? "Retrying..." : ""}`,
        );

        if (retryCounter + 1 >= AUDIT_LOG_MAX_RETRIES) {
          console.info(
            `Audit log write attempt for ${key} failed after ${AUDIT_LOG_MAX_RETRIES} attempts.`,
          );
          return;
        }
        return new Promise<void>((resolve) =>
          setTimeout(
            () => {
              resolve(attemptWrite(retryCounter + 1));
            },
            1000 * Math.pow(2, retryCounter),
          ),
        );
      }
    };

    console.log("starting audit attempt");
    // Start the first attempt
    return await attemptWrite(0);
  };

  const originalMethod = descriptor.value;
  descriptor.value = async function (this: unknown, ...args: unknown[]) {
    try {
      console.log("starting audit write");

      await writeToAuditTable(args);
      return await originalMethod.apply(this, args);
    } catch (error) {
      console.error(`Method ${key} threw error`, error);
      throw error;
    }
  };

  return descriptor;
}
