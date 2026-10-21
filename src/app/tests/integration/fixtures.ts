import { UserRole } from "@/app/models/entities/users";
import { NextRequest } from "next/server";

export const PATIENT_HL7_MESSAGE = `{
    MSH|^~\&#|ELIS.SC.STAG^2.16.840.1.114222.4.3.4.40.1.2^ISO|Hospital C^2.16.840.1.114222.4.1.171355^ISO|SCION_TEST^2.16.840.1.114222.4.3.2.2.1^ISO|CDC^2.16.840.1.114222.4.3.2.2.1.175.1^ISO|20240715133627.353-0500||ORU^R01^ORU_R01|OE715241T20240715133627|T|2.5.1|||AL|NE|USA||||PHLabReport-Ack^^2.16.840.1.113883.9.11^ISO
    PID|1||8692756^^^ELIS.SC.STAG&2.16.840.1.114222.4.3.4.40.1.2&ISO^PI||Unlucky^Hyper^C^^^^L||1975-12-06|M||2106-3^White^CDCREC^^^^^^White|49 Meadow St^^Lansing^MI^^USA^H|||||U^Unknown^HL70002^^^^2.5.1||||||2135-2^Hispanic or Latino^CDCREC^^^^^^Hispanic
    }`;
export const PATIENT_HL7_MESSAGE_NO_IDENTIFIERS = `{
    MSH|^~\&#|ELIS.SC.STAG^2.16.840.1.114222.4.3.4.40.1.2^ISO|Hospital C^2.16.840.1.114222.4.1.171355^ISO|SCION_TEST^2.16.840.1.114222.4.3.2.2.1^ISO|CDC^2.16.840.1.114222.4.3.2.2.1.175.1^ISO|20240715133627.353-0500||ORU^R01^ORU_R01|OE715241T20240715133627|T|2.5.1|||AL|NE|USA||||PHLabReport-Ack^^2.16.840.1.113883.9.11^ISO
    PID|1|||U^Unknown^HL70002^^^^2.5.1||||||2135-2^Hispanic or Latino^CDCREC^^^^^^Hispanic
    }`;

export function suppressConsoleLogs() {
  jest.spyOn(console, "log").mockImplementation(() => {});
  jest.spyOn(console, "warn").mockImplementation(() => {});
  jest.spyOn(console, "error").mockImplementation(() => {});
  jest.spyOn(console, "info").mockImplementation(() => {});
}

export function createNextRequest(
  body: unknown,
  searchParams: URLSearchParams,
  headers?: Record<string, string>,
) {
  const requestHeaders = new Headers(headers);

  return {
    json: async () => body,
    text: async () => body,
    nextUrl: { searchParams },
    method: "POST",
    headers: requestHeaders,
  } as unknown as NextRequest;
}

export const TEST_USER_STANDARD = {
  id: "13e1efb2-5889-4157-8f34-78d7f02dbf84",
  username: "toad",
  firstName: "Toad",
  lastName: "Mushroom",
  qcRole: UserRole.STANDARD,
};

export const TEST_USER_STANDARD_TWO = {
  id: "5f15d0ec-9eb4-4930-b45c-fdc6e6d175fc",
  username: "toadette",
  firstName: "Toadette",
  lastName: "Mushroom",
  qcRole: UserRole.STANDARD,
};

export const TEST_USER_ADMIN = {
  id: "43214488-5b1a-4572-985c-08fc9bea985b",
  username: "yoshi",
  firstName: "Green",
  lastName: "Yoshi",
  qcRole: UserRole.ADMIN,
};

export const TEST_USER_SUPER = {
  id: "7dd8b2a7-658c-4152-afcd-8b514fb5343b",
  username: "luigi",
  firstName: "Lugi",
  lastName: "Mario",
  qcRole: UserRole.SUPER_ADMIN,
};
