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
          return dbConnection.query(query, values);
        })
        .then((v) => {
          const auditMetadata = v.rows[0];
          console.info(
            `${auditMetadata.action_type} write with id ${auditMetadata?.id} and checksum ${auditMetadata?.audit_checksum} added to audit table`,
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
  const actionType = methodName;
  const auditChecksum = generateAuditChecksum(author, functionArgs);
  const auditContents = generateAuditMessage(functionResult, functionArgs);
  const auditValues = [author, actionType, auditChecksum, auditContents];
  return auditValues;
}

function generateAuditChecksum(author: string, messageContents: unknown[]) {
  return "result of some hashing algo based on author and message contents";
}

function generateAuditMessage(result: unknown, args: unknown[]) {
  // can do more fancy serialization here if needed

  args = args.map((obj) => {
    return JSON.stringify(obj);
  });

  return {
    args: args.join(","),
    result: JSON.stringify(result),
  };
}
