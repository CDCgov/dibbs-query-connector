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
 * Annotation to make a db interaction transactable
 * @param target - class prototype the annotation is hoisted into
 * @param key - the name of the method
 * @param descriptor - metadata for the object
 * @returns the value of the method, with rollback / error defaults
 */
export function transaction(
  target: Object,
  key: string,
  descriptor: PropertyDescriptor,
) {
  const method = descriptor.value;
  const dbClient = getDbClient();

  descriptor.value = async function (this: unknown, ...args: unknown[]) {
    try {
      await dbClient.query("BEGIN");
      const result = await method.apply(this, args);
      if (result.success === false) {
        throw Error("Transaction failed");
      }
      await dbClient.query("COMMIT");

      return result;
    } catch (error) {
      await dbClient.query("ROLLBACK");
      console.error(`Database transaction ${key} failed`);
    }
  };
}
