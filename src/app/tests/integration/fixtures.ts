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
