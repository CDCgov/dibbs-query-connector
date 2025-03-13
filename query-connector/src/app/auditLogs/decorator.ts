import { auth } from "@/auth";
import { getDbClient } from "../backend/dbClient";

/**
 * Decorator that adds audit log write logic to an annotated function
 * @param async - whether the method is async. Defaults to false
 * @returns The result of the function, with the args / result logged appropriately
 */
export function auditable(async = false) {
  return function (target: any, key: string, descriptor: PropertyDescriptor) {
    const dbConnection = getDbClient();
    const method = descriptor.value;

    const writeToAuditTable = async (args: any[]) => {
      const query = `INSERT INTO 
        audit_logs (author, action_type, audit_checksum, audit_message) 
        VALUES ($1, $2, $3, $4)
        RETURNING id, action_type, audit_checksum`;

      generateAuditValues(target, key, args)
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
            console.error(`Async method ${key} threw error`, error);
            throw error;
          }
        };

    return descriptor;
  };
}

async function generateAuditValues(
  target: any,
  methodName: string,
  args: unknown[],
) {
  const session = await auth();
  const author = `${session?.user.username}`;

  // ? Double check: do we need more fancy mapping for actionType here, or does the
  // ? name of the method suffice?
  const actionType = methodName;

  const argLabels = target[methodName]
    .toString()
    // match everything between the first "(" and first ")" and use [1] to get
    // everything in the first capture group (ie exclude the lead / trail parens)
    .match(/\(([^)]*)\)/)[1]
    .split(", ");

  const auditContents = generateAuditMessage(argLabels, args);
  const auditChecksum = generateAuditChecksum(author, auditContents);
  return [author, actionType, auditChecksum, auditContents];
}

function generateAuditMessage(argLabels: string[], args: unknown[]) {
  // can do more fancy serialization here if needed
  const mappedArgs: { [s: string]: string } = {};

  args.forEach((obj, i) => {
    mappedArgs[argLabels[i]] = sanitizeString(JSON.stringify(obj));
  });

  return mappedArgs;
}

function generateAuditChecksum(author: string, auditContents: Object) {
  return "result of some SHA-2 hashing algo based on author and audit contents";
}

function sanitizeString(s: string) {
  // add any other sanitization functions we need to this array
  const functionsToApply = [redactBearerToken];
  return functionsToApply.reduce((acc, cur) => cur(acc), s);
}

function redactBearerToken(s: string) {
  return s.replace(/"Bearer\s+([^\s]+)\"/, "Bearer REDACTED");
}
