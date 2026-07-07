jest.mock("@/app/backend/user-management", () => ({
  getAllUsers: jest.fn(),
}));

import { getAllUsers } from "@/app/backend/user-management";
import {
  auditLogActionTypeMap,
  labelToActionType,
  auditLogUserMap,
  initializeAuditLogUserMap,
} from "./auditLogMaps";

const mockGetAllUsers = getAllUsers as jest.Mock;

/**
 * Convenience helper to run a formatter by action type.
 * @param actionType - The audit-log action type key to look up.
 * @param log - The audit-log message object passed to the formatter.
 * @returns The formatted, human-readable audit-log string.
 */
function format(actionType: string, log: Record<string, unknown>): string {
  return auditLogActionTypeMap[actionType].format(log);
}

describe("auditLogMaps", () => {
  describe("parseRequest branches (exercised via formatters)", () => {
    it("reads request when auditMessage is an object with a request field", () => {
      const result = format("makePatientRecordsRequest", {
        auditMessage: { request: { queryName: "Chlamydia" } },
      });
      expect(result).toBe("Viewed patient record for Chlamydia query");
    });

    it("parses request when it is a JSON string", () => {
      const result = format("makePatientRecordsRequest", {
        auditMessage: { request: '{"queryName":"Syphilis"}' },
      });
      expect(result).toBe("Viewed patient record for Syphilis query");
    });

    it("falls back to the raw auditMessage object when there is no request field", () => {
      const result = format("makePatientRecordsRequest", {
        auditMessage: { queryName: "Direct" },
      });
      expect(result).toBe("Viewed patient record for Direct query");
    });

    it("returns {} when the request string is malformed JSON", () => {
      const result = format("makePatientRecordsRequest", {
        auditMessage: { request: "not-valid-json" },
      });
      // queryName is undefined -> double space is preserved, only ends trimmed
      expect(result).toBe("Viewed patient record for  query");
    });

    it("strips surrounding quotes from dequoted string values", () => {
      const result = format("makePatientDiscoveryRequest", {
        auditMessage: { request: { firstName: '"John"', lastName: '"Doe"' } },
      });
      expect(result).toBe("Ran patient discovery query for John Doe");
    });

    it("parses nested JSON string values into objects", () => {
      const result = format("insertCustomValueSet", {
        auditMessage: { request: { blob: '{"valueSetName":"Flu VS"}' } },
      });
      expect(result).toBe("Value set with name Flu VS saved");
    });

    it("keeps the raw value when a brace-wrapped value is not valid JSON", () => {
      const result = format("deleteFhirServer", {
        auditMessage: { request: { name: "{oops}" } },
      });
      expect(result).toBe("Deleted FHIR server {oops}");
    });
  });

  describe("auditLogActionTypeMap formatters", () => {
    it("formats a patient discovery query, falling back to author when no name", () => {
      const result = format("makePatientDiscoveryRequest", {
        auditMessage: { request: {} },
        author: "someuser",
      });
      expect(result).toBe("Ran patient discovery query for someuser");
    });

    it("formats a patient $match query", () => {
      const result = format("makePatientMatchRequest", {
        auditMessage: { request: { firstName: "Jane", lastName: "Roe" } },
      });
      expect(result).toBe("Ran patient $match query for Jane Roe");
    });

    it("formats FHIR server insert/update", () => {
      expect(
        format("insertFhirServer", {
          auditMessage: { request: { name: "Aidbox" } },
        }),
      ).toBe("Inserted FHIR server Aidbox");
      expect(
        format("updateFhirServer", {
          auditMessage: { request: { name: "HAPI" } },
        }),
      ).toBe("Updated FHIR server HAPI");
    });

    it("formats insertValueSet, preferring valueSetName over valueSetId", () => {
      expect(
        format("insertValueSet", {
          auditMessage: { request: { valueSetName: "Chlamydia labs" } },
        }),
      ).toBe("Inserted value set Chlamydia labs");
      expect(
        format("insertValueSet", {
          auditMessage: { request: { valueSetId: "vs-123" } },
        }),
      ).toBe("Inserted value set vs-123");
    });

    it("formats executeCategoryUpdates without inspecting the log", () => {
      expect(format("executeCategoryUpdates", {})).toBe(
        "Executed category updates",
      );
    });

    it("formats insertDBStructArray with row counts and table name", () => {
      const result = format("insertDBStructArray", {
        auditMessage: { request: { undefined: "patient", rows: [1, 2, 3] } },
      });
      expect(result).toBe("Inserted 3 database rows for patient table");
    });

    it("formats a sign out from the nested session blob", () => {
      const result = format("auditableSignOut", {
        auditMessage: {
          request: { sessionParams: { session: { user: { id: "u-9" } } } },
        },
      });
      expect(result).toBe("Sign out of user with ID u-9");
    });

    it("formats a sign in from the profile", () => {
      const result = format("auditableSignIn", {
        auditMessage: { request: { profile: { preferredUsername: "jdoe" } } },
      });
      expect(result).toBe("Sign in of user with username jdoe");
    });

    it("formats addUserIfNotExists from the first request value", () => {
      const result = format("addUserIfNotExists", {
        auditMessage: { request: { user: { username: "newbie" } } },
      });
      expect(result).toBe("User configured with username newbie");
    });

    it("formats updateUserRole using positional request values", () => {
      const result = format("updateUserRole", {
        auditMessage: { request: { userId: "u-1", role: "Admin" } },
      });
      expect(result).toBe(
        "User role of user with userId u-1 updated to new role Admin",
      );
    });

    it("formats updateUserDetails", () => {
      const result = format("updateUserDetails", {
        auditMessage: { request: { userId: "u-7" } },
      });
      expect(result).toBe("User details updated for user with ID u-7");
    });

    it("formats updateUserGroup with id and new name", () => {
      const result = format("updateUserGroup", {
        auditMessage: { request: { id: "g-3", name: "Renamed" } },
      });
      expect(result).toBe("Group with ID g-3 updated with new name Renamed");
    });

    it("formats deleteUserGroup", () => {
      const result = format("deleteUserGroup", {
        auditMessage: { request: { id: "g-9" } },
      });
      expect(result).toBe("Group with ID g-9 deleted");
    });

    it("formats removeUsersFromGroup", () => {
      const result = format("removeUsersFromGroup", {
        auditMessage: { request: { groupId: "g-1", userId: "u-2" } },
      });
      expect(result).toBe("User with ID u-2 removed to group with ID g-1 ");
    });

    it("formats addQueriesToGroup and removeQueriesFromGroup", () => {
      expect(
        format("addQueriesToGroup", {
          auditMessage: { request: { groupId: "g-1", queryId: "q-2" } },
        }),
      ).toBe("Query with ID q-2 added to group g-1");
      expect(
        format("removeQueriesFromGroup", {
          auditMessage: { request: { groupId: "g-1", queryId: "q-2" } },
        }),
      ).toBe("Query with ID q-2 removed from group g-1");
    });

    it("formats deleteQueryById", () => {
      const result = format("deleteQueryById", {
        auditMessage: { request: { queryId: "q-5" } },
      });
      expect(result).toBe("Query with ID q-5 deleted");
    });

    it("formats createUserGroup", () => {
      const result = format("createUserGroup", {
        auditMessage: { request: { name: "Epi Team" } },
      });
      expect(result).toBe("Group created with name Epi Team");
    });

    it("formats addUsersToGroup joining user IDs", () => {
      const result = format("addUsersToGroup", {
        auditMessage: { request: { groupId: "g-1", userIds: ["a", "b"] } },
      });
      expect(result).toBe("User with ID a, b added to group with ID g-1 ");
    });

    it("formats saveCustomQuery with and without a query id", () => {
      const withId = format("saveCustomQuery", {
        auditMessage: {
          request: { a: 0, name: "My Query", b: 2, id: "q-42" },
        },
      });
      expect(withId).toBe("Query with name My Query and id q-42 saved");

      const withoutId = format("saveCustomQuery", {
        auditMessage: { request: { a: 0, name: "My Query" } },
      });
      expect(withoutId).toBe("Query with name My Query saved");
    });

    it("formats insertCustomValueSet with a missing valueSetName", () => {
      const result = format("insertCustomValueSet", {
        auditMessage: { request: { blob: "just a string" } },
      });
      expect(result).toBe("Value set with name  saved");
    });

    it("formats deleteCustomValueSet from a nested value set object", () => {
      const result = format("deleteCustomValueSet", {
        auditMessage: { request: { blob: { valueSetName: "Old VS" } } },
      });
      expect(result).toBe("Value set with name Old VS deleted");
    });
  });

  describe("labelToActionType", () => {
    it("round-trips labels back to their action types", () => {
      const keys = ["makePatientRecordsRequest", "deleteFhirServer"];
      for (const key of keys) {
        const label = auditLogActionTypeMap[key].label;
        expect(labelToActionType[label]).toBe(key);
      }
    });

    it("has an entry for every action type", () => {
      expect(Object.keys(labelToActionType).length).toBe(
        Object.keys(auditLogActionTypeMap).length,
      );
    });
  });

  describe("auditLogUserMap / initializeAuditLogUserMap", () => {
    it("resolves full names after initialization and falls back for unknowns", async () => {
      mockGetAllUsers.mockResolvedValueOnce({
        items: [
          { username: "jdoe", firstName: "Jane", lastName: "Doe" },
          { username: "solo", firstName: "", lastName: "" },
        ],
        totalItems: 2,
      });

      await initializeAuditLogUserMap();

      expect(mockGetAllUsers).toHaveBeenCalledTimes(1);
      expect(auditLogUserMap("jdoe")).toBe("Jane Doe");
      // Empty first/last names fall back to the username.
      expect(auditLogUserMap("solo")).toBe("solo");
      // Unknown usernames return the username itself.
      expect(auditLogUserMap("ghost")).toBe("ghost");
    });
  });
});
