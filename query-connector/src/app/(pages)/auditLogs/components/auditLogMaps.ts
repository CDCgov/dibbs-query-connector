import { getAllUsers } from "@/app/backend/user-management";

type AuditLogActionTypeFormatter = (
  logEntry: Record<string, unknown>,
) => string;

type RequestPayload = {
  query_name?: string;
  first_name?: string;
  last_name?: string;
  [key: string]: unknown;
};

type ActionTypeMapping = {
  label: string;
  format: AuditLogActionTypeFormatter;
};

function parseRequest(log: Record<string, unknown>): RequestPayload {
  const raw = log?.auditMessage as { request?: unknown };

  if (!raw?.request) return {};
  if (typeof raw.request === "string") {
    try {
      return JSON.parse(raw.request as string) as RequestPayload;
    } catch {
      return {};
    }
  }
  return raw.request as RequestPayload;
}

function resolveFullName(
  first?: string,
  last?: string,
  fallback?: string,
): string {
  const full = `${first ?? ""} ${last ?? ""}`.trim();
  return full !== "" ? full : fallback ?? "";
}

/**
 * Maps action types to their labels and formats.
 */
export const actionTypeMap: Record<string, ActionTypeMapping> = {
  patientRecordsQuery: {
    label: "Patient Records Query",
    format: (log) => {
      const request = parseRequest(log);
      return `Viewed patient record for ${request.query_name ?? ""} query`.trim();
    },
  },
  patientDiscoveryQuery: {
    label: "Patient Discovery Query",
    format: (log) => {
      const request = parseRequest(log);
      const fullName = resolveFullName(
        request.first_name,
        request.last_name,
        log.author as string,
      );
      return `Ran patient discovery query for ${fullName}`;
    },
  },
  // Add more as needed
};

export const labelToActionType = Object.entries(actionTypeMap).reduce(
  (acc, [actionType, config]) => {
    acc[config.label] = actionType;
    return acc;
  },
  {} as Record<string, string>,
);

let usernameToFullNameMap: Record<string, string> = {};

/**
 * Initializes the username to full name map for audit logs.
 * This function fetches all users and creates a mapping of usernames to their full names.
 */
export async function initializeAuditLogUserMap() {
  const response = await getAllUsers();
  usernameToFullNameMap = response.items.reduce(
    (acc, user) => {
      acc[user.username] = resolveFullName(
        user.first_name,
        user.last_name,
        user.username,
      );
      return acc;
    },
    {} as Record<string, string>,
  );
}

/**
 * Retrieves the full name for a given username.
 * If the username is not found in the map, it returns the username itself.
 * @param username - The username to look up.
 * @returns The full name associated with the username, or the username itself if not found.
 */
export function getFullNameForAuthor(username: string): string {
  return usernameToFullNameMap[username] || username;
}
