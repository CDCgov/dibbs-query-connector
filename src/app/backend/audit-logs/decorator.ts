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
  const originalMethod = descriptor.value;

  // todo: in prod, these will result in minified vars being written.
  // refactor these to accept the arg labels instead.
  const argMatch = originalMethod.toString().match(/\(([^)]*)\)/);
  const argLabels =
    argMatch && argMatch[1]
      ? argMatch[1].split(",").map((s: string) => s.trim())
      : [];

  descriptor.value = async function (this: unknown, ...args: unknown[]) {
    try {
      const result = await originalMethod.apply(this, args);
      return result;
    } finally {
      await writeAuditLog(key, argLabels, args);
    }
  };

  return descriptor;
}

async function writeAuditLog(
  key: string,
  argLabels: string[],
  args: unknown[],
) {
  let attempt = 1;

  while (attempt <= AUDIT_LOG_MAX_RETRIES) {
    try {
      const [author, actionType, auditMessage, timestamp, auditChecksum] =
        await generateAuditValues(key, argLabels, args);

      const insertQuery = `INSERT INTO 
          audit_logs (author, action_type, audit_message, created_at, audit_checksum) 
          VALUES ($1, $2, $3, $4, $5)
          RETURNING id, action_type, audit_checksum`;

      const dbResult = await dbService.query(insertQuery, [
        author,
        actionType,
        auditMessage,
        timestamp,
        auditChecksum,
      ]);

      const insertedRow = dbResult.rows[0];
      console.info(
        generateAuditSuccessMessage(
          insertedRow?.actionType,
          insertedRow.id,
          auditChecksum as string,
        ),
      );

      break;
    } catch (error) {
      if (attempt === AUDIT_LOG_MAX_RETRIES) {
        console.error(`Method ${key} threw error`, error);
        break;
      }

      console.warn(`Audit log write attempt ${attempt} failed. Retrying...`);
      const backoffMs = 1000 * Math.pow(2, attempt);
      await new Promise((resolve) => setTimeout(resolve, backoffMs));
      attempt++;
    }
  }
}
