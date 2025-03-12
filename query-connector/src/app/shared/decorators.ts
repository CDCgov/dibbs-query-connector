import { getDbClient } from "../backend/dbClient";

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
