import { adminAccessCheck, superAdminAccessCheck } from "@/app/utils/auth";
import { getDbClient } from "../dbClient";

/**
 * Decorator that adds audit log write logic to an annotated function
 * @param async - whether the method is async. Defaults to false
 * @returns The result of the function, with the args / result logged appropriately
 */
export function auditable(async = false) {
  return function (_: Object, key: string, descriptor: PropertyDescriptor) {
    const dbConnection = getDbClient();
    const method = descriptor.value;

    const logAndReturnResult = (resultToLog: unknown, args?: unknown[]) => {
      // would replace the below round trip to the DB with the actual write to
      // the table
      const query = "SELECT * FROM conditions";
      const result = dbConnection.query(query);

      result.then((v) => {
        console.log(v.rows[0]); // in case we need to do anything with the db response
        console.log("To add to audit log: ", resultToLog); // can write the result
        if (args) {
          console.log("Args to add to the audit log log: ", args); // or the args
        }
      });

      return resultToLog;
    };
    // need to do this check so that async vs sync returns are properly typed
    descriptor.value = async
      ? async function (this: unknown, ...args: unknown[]) {
          try {
            const resultToLog = await method.apply(this, args);
            logAndReturnResult("", args);

            return resultToLog;
          } catch (error) {
            console.error(`Async method ${key} threw error`, error);
            throw error;
          }
        }
      : function (this: unknown, ...args: unknown[]) {
          try {
            const resultToLog = method.apply(this, args);
            logAndReturnResult(resultToLog);

            return resultToLog;
          } catch (error) {
            console.error(`Async method ${key} threw error`, error);
            throw error;
          }
        };

    return descriptor;
  };
}

/**
 * Annotation to make a db query into a transaction. Requires all return branches
 * to include {success: boolean}, which will control the rollback behavior,
 * in order to compile
 * @param _ - class prototype the annotation is hoisted into
 * @param key - the name of the method
 * @param descriptor - metadata for the method, which has restrictions on the
 * return type
 * @returns - Success information of the db transaction, as well as additional
 * error / db result types as specified in the function body
 */
export function transaction<T extends { success: boolean }>(
  _: Object,
  key: string,
  // eslint-disable-next-line  @typescript-eslint/no-explicit-any
  descriptor: TypedPropertyDescriptor<(...args: any[]) => Promise<T>>,
) {
  const method = descriptor.value;
  const dbClient = getDbClient();

  // eslint-disable-next-line  @typescript-eslint/no-explicit-any
  descriptor.value = async function (...args: any[]): Promise<T> {
    try {
      await dbClient.query("BEGIN");
      const result = method && (await method.apply(this, args));
      if (result === undefined || result.success === false) {
        throw Error("Transaction failed");
      }
      await dbClient.query("COMMIT");

      return result;
    } catch (error) {
      await dbClient.query("ROLLBACK");
      console.error(`Database transaction ${key} failed`);

      type ErrorResult<T extends { success: boolean }> = T & {
        error?: string;
      };

      return {
        success: false,
        error: error instanceof Error ? error.message : String(error),
      } as ErrorResult<T>;
    }
  };

  return descriptor;
}

/**
 * Annotation to protect a super admin method
 * @param _ - class prototype the annotation is hoisted into
 * @param key - the name of the method
 * @param descriptor - metadata for the method, which has restrictions on the
 * return type
 * @returns - An error if the method isn't allowed, the result if it is
 */
export function superAdminRequired(
  _: Object,
  key: string,
  descriptor: PropertyDescriptor,
) {
  const method = descriptor.value;

  // eslint-disable-next-line  @typescript-eslint/no-explicit-any
  descriptor.value = async function (...args: any[]) {
    try {
      const methodAllowed = await superAdminAccessCheck();
      if (!methodAllowed) {
        throw Error(`Super admin permission check for ${key} failed`);
      }

      const result = method && (await method.apply(this, args));
      return result;
    } catch (error) {
      console.error(error);
    }
  };

  return descriptor;
}

/**
 * Annotation to protect a super admin method
 * @param _ - class prototype the annotation is hoisted into
 * @param key - the name of the method
 * @param descriptor - metadata for the method, which has restrictions on the
 * return type
 * @returns - An error if the method isn't allowed, the result if it is
 */
export function adminRequired(
  _: Object,
  key: string,
  descriptor: PropertyDescriptor,
) {
  const method = descriptor.value;

  // eslint-disable-next-line  @typescript-eslint/no-explicit-any
  descriptor.value = async function (...args: any[]) {
    try {
      const methodAllowed = await adminAccessCheck();
      if (!methodAllowed) {
        throw Error(`Admin permission check for ${key} failed`);
      }

      const result = method && (await method.apply(this, args));
      return result;
    } catch (error) {
      console.error(error);
    }
  };

  return descriptor;
}
