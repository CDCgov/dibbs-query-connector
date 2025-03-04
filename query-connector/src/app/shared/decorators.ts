import { getDbClient } from "../backend/dbClient";

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
      : function (this: unknown, ...args: any) {
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
