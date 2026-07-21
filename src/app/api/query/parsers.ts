import { Patient } from "fhir/r4";
import { FormatPhoneAsDigits } from "@/app/utils/format-service";
import {
  AddressData,
  USE_CASES,
  USE_CASE_DETAILS,
  raceOptions,
  ethnicityOptions,
} from "@/app/constants";

export type PatientIdentifiers = {
  first_name?: string;
  last_name?: string;
  dob?: string;
  mrn?: string;
  phone?: string;
  street1?: string;
  street2?: string;
  city?: string;
  state?: string;
  zip?: string;
  email?: string;
  gender?: string;
  race?: string;
  ethnicity?: string;
};

const US_CORE_RACE_EXTENSION_URL =
  "http://hl7.org/fhir/us/core/StructureDefinition/us-core-race";
const US_CORE_ETHNICITY_EXTENSION_URL =
  "http://hl7.org/fhir/us/core/StructureDefinition/us-core-ethnicity";

/**
 * Parses a patient resource to extract patient demographics.
 * @param patient - The patient resource to parse.
 * @returns An array of patient demographics extracted from the patient resource.
 */
export function parsePatientDemographics(patient: Patient): PatientIdentifiers {
  const identifiers: PatientIdentifiers = {};

  if (patient.name) {
    const name = patient.name[0];
    if (name.given) {
      identifiers.first_name = name.given[0];
    }
    if (name.family) {
      identifiers.last_name = name.family;
    }
  }

  if (patient.birthDate) {
    identifiers.dob = patient.birthDate;
  }

  // Extract MRNs from patient.identifier
  const mrnIdentifiers = parseMRNs(patient);
  // Add 1st value of MRN array to identifiers
  // TODO: Handle multiple MRNs to query
  if (mrnIdentifiers && mrnIdentifiers.length > 0) {
    identifiers.mrn = mrnIdentifiers[0];
  }

  // Extract phone numbers from patient telecom arrays
  let phoneNumbers = parsePhoneNumbers(patient);
  if (phoneNumbers) {
    // Strip formatting so the query service can generate options
    phoneNumbers = phoneNumbers
      .map((phone) => FormatPhoneAsDigits(phone || ""))
      .filter((phone) => phone !== "");
    if (phoneNumbers.length == 1) {
      identifiers.phone = phoneNumbers[0];
    } else if (phoneNumbers.length > 1) {
      identifiers.phone = phoneNumbers.join(";");
    }
  }

  const addresses = parseAddresses(patient);

  if (addresses) {
    identifiers.street1 = addresses.street1;
    identifiers.street2 = addresses.street2;
    identifiers.city = addresses.city;
    identifiers.state = addresses.state;
    identifiers.zip = addresses.zip;
  }

  const emailAddresses = parseEmails(patient);
  if (emailAddresses && emailAddresses.length > 0) {
    if (emailAddresses.length == 1) {
      identifiers.email = emailAddresses[0];
    } else if (emailAddresses.length > 1) {
      identifiers.email = emailAddresses.join(";");
    }
  }

  if (patient.gender) {
    identifiers.gender = patient.gender;
  }

  const race = parseOmbCategoryCode(patient, US_CORE_RACE_EXTENSION_URL);
  if (race) {
    identifiers.race = race;
  }

  const ethnicity = parseOmbCategoryCode(
    patient,
    US_CORE_ETHNICITY_EXTENSION_URL,
  );
  if (ethnicity) {
    identifiers.ethnicity = ethnicity;
  }

  return identifiers;
}

/**
 * Extracts the OMB category code from a US Core race or ethnicity extension.
 * @param patient - The patient resource to parse.
 * @param extensionUrl - The US Core race or ethnicity StructureDefinition URL.
 * @returns The OMB category code (e.g. 2106-3), or undefined if not present.
 */
export function parseOmbCategoryCode(
  patient: Patient,
  extensionUrl: string,
): string | undefined {
  const demographicExtension = patient.extension?.find(
    (extension) => extension.url === extensionUrl,
  );
  const ombCategory = demographicExtension?.extension?.find(
    (subExtension) => subExtension.url === "ombCategory",
  );
  return ombCategory?.valueCoding?.code;
}

/**
 * Extracts all MRNs from a patient resource and returns them as an array.
 * @param patient - The patient resource to parse.
 * @returns An array of MRNs extracted from the patient resource.
 */
export function parseMRNs(
  patient: Patient,
): (string | undefined)[] | undefined {
  if (patient.identifier) {
    const mrnIdentifiers = patient.identifier.filter((id) =>
      id.type?.coding?.some(
        (coding) =>
          coding.system === "http://terminology.hl7.org/CodeSystem/v2-0203" &&
          coding.code === "MR",
      ),
    );
    return mrnIdentifiers.map((id) => id.value);
  }
}

/**
 * Helper function that extracts all applicable phone numbers from a patient resource
 * and returns them as a list of strings, without changing the input formatting
 * of the phone numbers.
 * @param patient A FHIR Patient resource.
 * @returns A list of phone numbers, or undefined if the patient has no telecom.
 */
export function parsePhoneNumbers(
  patient: Patient,
): (string | undefined)[] | undefined {
  if (patient.telecom) {
    const phoneNumbers = patient.telecom.filter(
      (contactPoint) =>
        contactPoint.system === "phone" ||
        ["home", "work", "mobile"].includes(contactPoint.use || ""),
    );
    return phoneNumbers.map((contactPoint) => contactPoint.value);
  }
}

/**
 * Helper function that extracts all patient addresses from a patient resource
 * TODO: maybe utilize the address.period property so we display the current/most recent record?
 * @param patient A FHIR Patient resource.
 * @returns An array of address objects, or undefined if the patient has no addresses.
 */
export function parseAddresses(patient: Patient): AddressData | undefined {
  if (patient.address) {
    const street1: string[] = [];
    const street2: string[] = [];
    const city: string[] = [];
    const state: string[] = [];
    const zip: string[] = [];

    function addToArr(destination: string[], data: string) {
      if (data && !destination.includes(data)) {
        destination.push(data);
      }
    }

    patient.address.forEach((address) => {
      addToArr(zip, address.postalCode || "");
      addToArr(state, address.state || "");
      addToArr(city, address.city || "");

      // if we already have city/state/zip, remove it from the address.line array
      const removeDuplicates = address.line?.map((lineItem) => {
        if (address.postalCode && lineItem.includes(address.postalCode)) {
          lineItem = lineItem.replace(address.postalCode, "");
        }
        if (address.state && lineItem.includes(address.state)) {
          lineItem = lineItem.replace(address.state, "");
        }
        if (address.city && lineItem.includes(address.city)) {
          lineItem = lineItem.replace(address.city, "");
        }
        return lineItem.trim();
      });

      const firstLine = removeDuplicates?.shift();
      firstLine && street1.push(firstLine);
      street2 &&
        removeDuplicates?.forEach((lineItem) => street2.push(lineItem)); // everything else left in the array
    });

    return {
      street1: street1.length > 1 ? street1.join(";") : street1[0] || "",
      street2: street2.length > 1 ? street2.join(";") : street2[0] || "",
      city: city.join(";"),
      state: state.join(";"),
      zip: zip.join(";"),
    };
  }
}

/**
 * Validates an email address using a regular expression.
 * @param email - The email address to validate.
 * @returns True if the email is valid, false otherwise.
 */
export function validEmail(email: string | undefined): boolean {
  if (!email) return false;
  // RFC 5322 Official Standard email regex
  return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email);
}

/**
 * Helper function that extracts all applicable, valid email addresses from a patient resource
 * and returns them as a list of strings, without changing the input formatting
 * of the emails.
 * @param patient A FHIR Patient resource.
 * @returns A list of valid emails, or undefined if the patient has no valid email.
 */
export function parseEmails(
  patient: Patient,
): (string | undefined)[] | undefined {
  if (patient.telecom) {
    const emailAddresses = patient.telecom
      .filter((contactPoint) => contactPoint.system === "email")
      .map((contactPoint) => contactPoint.value)
      .filter((email) => validEmail(email));
    return emailAddresses.length > 0 ? emailAddresses : undefined;
  }
}

/**
 * Maps an HL7v2 administrative sex code (PID.8, table 0001) to a FHIR
 * administrative-gender code.
 * @param sex - The HL7v2 administrative sex code (e.g. M, F, O, U).
 * @returns The FHIR administrative-gender code, or empty string if unmapped.
 */
export function mapHL7SexToGender(sex: string): string {
  switch (sex.toUpperCase()) {
    case "M":
      return "male";
    case "F":
      return "female";
    case "O":
    case "A":
      return "other";
    case "U":
      return "unknown";
    default:
      return "";
  }
}

/**
 * Validates an HL7v2 race code (PID.10, table 0005, which uses CDC Race &
 * Ethnicity codes) against the supported OMB race categories.
 * @param race - The HL7v2 race code (e.g. 2106-3).
 * @returns The race code if it is a supported OMB category, else empty string.
 */
export function mapHL7RaceToCode(race: string): string {
  return raceOptions.some((option) => option.value === race) ? race : "";
}

/**
 * Maps an HL7v2 ethnic group code (PID.22, table 0189) to an OMB ethnicity
 * category code. CDC Race & Ethnicity codes are passed through when supported.
 * @param ethnicGroup - The HL7v2 ethnic group code (e.g. H, N, or 2135-2).
 * @returns The OMB ethnicity category code, or empty string if unmapped.
 */
export function mapHL7EthnicGroupToCode(ethnicGroup: string): string {
  switch (ethnicGroup.toUpperCase()) {
    case "H":
      return "2135-2";
    case "N":
      return "2186-5";
    default:
      return ethnicityOptions.some((option) => option.value === ethnicGroup)
        ? ethnicGroup
        : "";
  }
}

/**
 * Function to parse out the HL7 message from the requestBody of a POST request
 * @param requestText the text to parse / return
 * @returns - A parsed HL7 message for further processing
 */
export function parseHL7FromRequestBody(requestText: string) {
  let result = requestText;

  // strip the leading { / closing } if they exist
  if (requestText[0] === "{" || requestText[requestText.length - 1] === "}") {
    const leadingClosingBraceRegex = /\{([\s\S]*)\}/;
    const requestMatch = requestText.match(leadingClosingBraceRegex);
    if (requestMatch) {
      result = requestMatch[1].trim();
    }
  }
  return result;
}

/**
 * Deprecation method to backfill information from the old demo use cases into
 * our new query table
 * @param use_case - The old use case names that came out of the demo options
 * @returns The ID that maps to the old use case params
 */
export function mapDeprecatedUseCaseToId(use_case: string | null) {
  if (use_case === null) return null;
  const potentialUseCaseMatch = USE_CASE_DETAILS[use_case as USE_CASES];
  const queryId = potentialUseCaseMatch?.id ?? null;
  return queryId;
}
