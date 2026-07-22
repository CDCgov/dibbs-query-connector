import { Patient } from "fhir/r4";
import {
  parsePatientDemographics,
  parseMRNs,
  parsePhoneNumbers,
  parseAddresses,
  parseOmbCategoryCode,
  validEmail,
  parseEmails,
  parseHL7FromRequestBody,
  mapDeprecatedUseCaseToId,
  mapHL7SexToGender,
  mapHL7RaceToCode,
  mapHL7EthnicGroupToCode,
  validateGenderCode,
  validateRaceCode,
  validateEthnicityCode,
} from "./parsers";
import { USE_CASE_DETAILS, USE_CASES } from "@/app/constants";

const MR_SYSTEM = "http://terminology.hl7.org/CodeSystem/v2-0203";

/**
 * Small factory so each test only sets the fields it cares about.
 * @param overrides - Patient fields to set on the base resource.
 * @returns A FHIR Patient resource with the given overrides applied.
 */
const makePatient = (overrides: Partial<Patient> = {}): Patient => ({
  resourceType: "Patient",
  ...overrides,
});

describe("parseMRNs", () => {
  it("returns the values of MR-coded identifiers", () => {
    const patient = makePatient({
      identifier: [
        {
          type: { coding: [{ system: MR_SYSTEM, code: "MR" }] },
          value: "12345",
        },
        {
          type: { coding: [{ system: MR_SYSTEM, code: "SS" }] },
          value: "ignore-me",
        },
      ],
    });
    expect(parseMRNs(patient)).toEqual(["12345"]);
  });

  it("returns undefined when the patient has no identifier array", () => {
    expect(parseMRNs(makePatient())).toBeUndefined();
  });

  it("returns an empty array when no identifier is MR-coded", () => {
    const patient = makePatient({
      identifier: [{ type: { coding: [{ system: MR_SYSTEM, code: "SS" }] } }],
    });
    expect(parseMRNs(patient)).toEqual([]);
  });
});

describe("parsePhoneNumbers", () => {
  it("keeps telecom entries with system phone or a home/work/mobile use", () => {
    const patient = makePatient({
      telecom: [
        { system: "phone", value: "111" },
        { system: "other", use: "mobile", value: "222" },
        { system: "email", value: "skip@example.com" },
      ],
    });
    expect(parsePhoneNumbers(patient)).toEqual(["111", "222"]);
  });

  it("returns undefined when the patient has no telecom", () => {
    expect(parsePhoneNumbers(makePatient())).toBeUndefined();
  });
});

describe("parseEmails", () => {
  it("returns only valid emails from telecom", () => {
    const patient = makePatient({
      telecom: [
        { system: "email", value: "good@example.com" },
        { system: "email", value: "not-an-email" },
        { system: "phone", value: "5551234567" },
      ],
    });
    expect(parseEmails(patient)).toEqual(["good@example.com"]);
  });

  it("returns undefined when telecom has no valid email", () => {
    const patient = makePatient({
      telecom: [{ system: "email", value: "bad" }],
    });
    expect(parseEmails(patient)).toBeUndefined();
  });

  it("returns undefined when the patient has no telecom", () => {
    expect(parseEmails(makePatient())).toBeUndefined();
  });
});

describe("validEmail", () => {
  it.each(["a@b.co", "first.last@example.com", "x+tag@sub.domain.org"])(
    "accepts %s",
    (email) => expect(validEmail(email)).toBe(true),
  );

  it.each(["", undefined, "no-at", "a@b", "a b@c.com", "a@b c.com"])(
    "rejects %s",
    (email) => expect(validEmail(email)).toBe(false),
  );
});

describe("parseAddresses", () => {
  it("returns undefined when the patient has no address", () => {
    expect(parseAddresses(makePatient())).toBeUndefined();
  });

  it("splits city/state/zip out of the line array", () => {
    const patient = makePatient({
      address: [
        {
          line: ["123 Main St", "Springfield IL 62704"],
          city: "Springfield",
          state: "IL",
          postalCode: "62704",
        },
      ],
    });
    expect(parseAddresses(patient)).toEqual({
      street1: "123 Main St",
      street2: "",
      city: "Springfield",
      state: "IL",
      zip: "62704",
    });
  });

  it("joins multiple distinct addresses with a semicolon and dedupes fields", () => {
    const patient = makePatient({
      address: [
        {
          line: ["1 First Ave"],
          city: "Town",
          state: "CA",
          postalCode: "90001",
        },
        {
          line: ["2 Second Ave"],
          city: "Town",
          state: "CA",
          postalCode: "90002",
        },
      ],
    });
    expect(parseAddresses(patient)).toEqual({
      street1: "1 First Ave;2 Second Ave",
      street2: "",
      city: "Town", // deduped to a single value
      state: "CA", // deduped to a single value
      zip: "90001;90002",
    });
  });
});

describe("parsePatientDemographics", () => {
  it("extracts name, dob, mrn, phone, address and email", () => {
    const patient = makePatient({
      name: [{ given: ["Jane", "Q"], family: "Doe" }],
      birthDate: "1990-01-02",
      identifier: [
        {
          type: { coding: [{ system: MR_SYSTEM, code: "MR" }] },
          value: "MRN-1",
        },
      ],
      telecom: [
        { system: "phone", value: "555-123-4567" },
        { system: "email", value: "jane@example.com" },
      ],
      address: [
        {
          line: ["10 Elm St"],
          city: "Metropolis",
          state: "NY",
          postalCode: "10001",
        },
      ],
    });

    expect(parsePatientDemographics(patient)).toEqual({
      first_name: "Jane",
      last_name: "Doe",
      dob: "1990-01-02",
      mrn: "MRN-1",
      phone: "5551234567",
      street1: "10 Elm St",
      street2: "",
      city: "Metropolis",
      state: "NY",
      zip: "10001",
      email: "jane@example.com",
    });
  });

  it("joins multiple phone numbers and emails with a semicolon", () => {
    const patient = makePatient({
      telecom: [
        { system: "phone", value: "555-123-4567" },
        { system: "phone", value: "555-987-6543" },
        { system: "email", value: "a@example.com" },
        { system: "email", value: "b@example.com" },
      ],
    });
    const result = parsePatientDemographics(patient);
    expect(result.phone).toBe("5551234567;5559876543");
    expect(result.email).toBe("a@example.com;b@example.com");
  });

  it("returns an empty object for a bare patient", () => {
    expect(parsePatientDemographics(makePatient())).toEqual({});
  });

  it("extracts gender and US Core race/ethnicity OMB category codes", () => {
    const patient = makePatient({
      gender: "female",
      extension: [
        {
          url: "http://hl7.org/fhir/us/core/StructureDefinition/us-core-race",
          extension: [
            {
              url: "ombCategory",
              valueCoding: {
                system: "urn:oid:2.16.840.1.113883.6.238",
                code: "2106-3",
                display: "White",
              },
            },
            { url: "text", valueString: "White" },
          ],
        },
        {
          url: "http://hl7.org/fhir/us/core/StructureDefinition/us-core-ethnicity",
          extension: [
            {
              url: "ombCategory",
              valueCoding: {
                system: "urn:oid:2.16.840.1.113883.6.238",
                code: "2186-5",
                display: "Not Hispanic or Latino",
              },
            },
            { url: "text", valueString: "Not Hispanic or Latino" },
          ],
        },
      ],
    });

    expect(parsePatientDemographics(patient)).toEqual({
      gender: "female",
      race: "2106-3",
      ethnicity: "2186-5",
    });
  });

  it("drops unrecognized gender and OMB category codes", () => {
    const patient = makePatient({
      gender: "nonbinary" as Patient["gender"],
      extension: [
        {
          url: "http://hl7.org/fhir/us/core/StructureDefinition/us-core-race",
          extension: [
            {
              url: "ombCategory",
              valueCoding: {
                system: "urn:oid:2.16.840.1.113883.6.238",
                code: "not-a-code",
              },
            },
          ],
        },
        {
          url: "http://hl7.org/fhir/us/core/StructureDefinition/us-core-ethnicity",
          extension: [
            {
              url: "ombCategory",
              valueCoding: {
                system: "urn:oid:2.16.840.1.113883.6.238",
                code: "ASKU",
              },
            },
          ],
        },
      ],
    });

    expect(parsePatientDemographics(patient)).toEqual({});
  });
});

describe("demographic code validators", () => {
  it("passes through supported codes", () => {
    expect(validateGenderCode("female")).toBe("female");
    expect(validateRaceCode("2106-3")).toBe("2106-3");
    expect(validateEthnicityCode("2135-2")).toBe("2135-2");
  });

  it("returns empty string for unsupported codes", () => {
    expect(validateGenderCode("Female")).toBe("");
    expect(validateGenderCode("male&_revinclude=Provenance:target")).toBe("");
    expect(validateRaceCode("W")).toBe("");
    expect(validateEthnicityCode("H")).toBe("");
    expect(validateGenderCode("")).toBe("");
    expect(validateRaceCode("")).toBe("");
    expect(validateEthnicityCode("")).toBe("");
  });
});

describe("parseOmbCategoryCode", () => {
  const RACE_URL =
    "http://hl7.org/fhir/us/core/StructureDefinition/us-core-race";

  it("returns undefined when the patient has no extensions", () => {
    expect(parseOmbCategoryCode(makePatient(), RACE_URL)).toBeUndefined();
  });

  it("returns undefined when the extension has no ombCategory", () => {
    const patient = makePatient({
      extension: [
        {
          url: RACE_URL,
          extension: [{ url: "text", valueString: "White" }],
        },
      ],
    });
    expect(parseOmbCategoryCode(patient, RACE_URL)).toBeUndefined();
  });
});

describe("mapHL7SexToGender", () => {
  it.each([
    ["M", "male"],
    ["F", "female"],
    ["f", "female"],
    ["O", "other"],
    ["A", "other"],
    ["U", "unknown"],
    ["", ""],
    ["X", ""],
  ])("maps %s to %s", (sex, expected) => {
    expect(mapHL7SexToGender(sex)).toBe(expected);
  });
});

describe("mapHL7RaceToCode", () => {
  it("passes through supported OMB race category codes", () => {
    expect(mapHL7RaceToCode("2106-3")).toBe("2106-3");
    expect(mapHL7RaceToCode("1002-5")).toBe("1002-5");
  });

  it("returns empty string for unsupported codes", () => {
    expect(mapHL7RaceToCode("W")).toBe("");
    expect(mapHL7RaceToCode("")).toBe("");
  });
});

describe("mapHL7EthnicGroupToCode", () => {
  it.each([
    ["H", "2135-2"],
    ["N", "2186-5"],
    ["2135-2", "2135-2"],
    ["U", ""],
    ["", ""],
  ])("maps %s to %s", (ethnicGroup, expected) => {
    expect(mapHL7EthnicGroupToCode(ethnicGroup)).toBe(expected);
  });
});

describe("parseHL7FromRequestBody", () => {
  it("strips a wrapping brace pair and trims", () => {
    expect(parseHL7FromRequestBody("{ MSH|^~\\&| }")).toBe("MSH|^~\\&|");
  });

  it("returns the text unchanged when it is not brace-wrapped", () => {
    expect(parseHL7FromRequestBody("MSH|^~\\&|")).toBe("MSH|^~\\&|");
  });
});

describe("mapDeprecatedUseCaseToId", () => {
  it("returns null for a null use case", () => {
    expect(mapDeprecatedUseCaseToId(null)).toBeNull();
  });

  it("returns null for an unknown use case", () => {
    expect(mapDeprecatedUseCaseToId("not-a-real-use-case")).toBeNull();
  });

  it("maps a known use case to its configured id", () => {
    const [useCase, details] = Object.entries(USE_CASE_DETAILS)[0] as [
      USE_CASES,
      { id: string },
    ];
    expect(mapDeprecatedUseCaseToId(useCase)).toBe(details.id);
  });
});
