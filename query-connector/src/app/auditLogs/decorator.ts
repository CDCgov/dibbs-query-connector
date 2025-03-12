import { auth } from "@/auth";
import { getDbClient } from "../backend/dbClient";

/**
 * Decorator that adds audit log write logic to an annotated function
 * @param async - whether the method is async. Defaults to false
 * @returns The result of the function, with the args / result logged appropriately
 */
export function auditable(async = false) {
  return function (
    target: Object,
    key: string,
    descriptor: PropertyDescriptor,
  ) {
    const dbConnection = getDbClient();
    const method = descriptor.value;

    const writeResultToAuditTable = async (
      resultToLog: unknown,
      args: any[],
    ) => {
      const query = `INSERT INTO 
        audit_logs (author, action_type, audit_checksum, audit_message) 
        VALUES ($1, $2, $3, $4)
        RETURNING id, action_type, audit_checksum`;

      generateAuditValues(key, resultToLog, args)
        .then((values) => {
          // ? what to do with error handling here? on the event of a failure,
          // ? probably need some retry logic to ensure we don't lose data
          return dbConnection.query(query, values);
        })
        .then((v) => {
          const auditMetadata = v.rows[0];
          console.info(
            `${auditMetadata.action_type} audit action with id ${auditMetadata?.id} and checksum ${auditMetadata?.audit_checksum} added to audit table`,
          );
        });
    };

    // need to do this check so that async vs sync returns are properly typed
    descriptor.value = async
      ? async function (this: unknown, ...args: unknown[]) {
          try {
            const resultToLog = await method.apply(this, args);
            writeResultToAuditTable(resultToLog, args);

            return resultToLog;
          } catch (error) {
            console.error(`Async method ${key} threw error`, error);
            throw error;
          }
        }
      : function (this: unknown, ...args: unknown[]) {
          try {
            const resultToLog = method.apply(this, args);
            writeResultToAuditTable(resultToLog, args);

            return resultToLog;
          } catch (error) {
            console.error(`Async method ${key} threw error`, error);
            throw error;
          }
        };

    return descriptor;
  };
}

async function generateAuditValues(
  methodName: string,
  functionResult: unknown,
  functionArgs: unknown[],
) {
  const session = await auth();
  const author = `${session?.user.username}`;

  // ? Double check: do we need more fancy mapping between events here, or does the
  // ? name of the method suffice?
  const actionType = methodName;
  const auditContents = generateAuditMessage(functionResult, functionArgs);
  const auditChecksum = generateAuditChecksum(author, auditContents);
  return [author, actionType, auditChecksum, auditContents];
}

function generateAuditMessage(result: unknown, args: unknown[]) {
  // can do more fancy serialization here if needed
  return {
    args: args
      .map((obj) => {
        // TODO: Should probably type guard this process more rigorously
        return JSON.stringify(obj);
      })
      .join(","),
    result: JSON.stringify(result),
  };
}

function generateAuditChecksum(
  author: string,
  auditContents: { result: string; args: string },
) {
  return "result of some SHA-2 hashing algo based on author and audit contents";
}
