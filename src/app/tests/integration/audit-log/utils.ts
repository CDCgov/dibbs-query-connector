import { waitFor } from "@testing-library/dom";

export const GET_ALL_AUDIT_ROWS = "SELECT * FROM audit_logs;";

export async function waitForAuditSuccess(
  actionTypeToCheck: string,
  spy: jest.SpyInstance,
) {
  await waitFor(() => {
    expect(spy).toHaveBeenCalledWith(
      actionTypeToCheck,
      expect.anything(),
      expect.anything(),
    );
  });
}
