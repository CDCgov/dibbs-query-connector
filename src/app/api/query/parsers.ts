import { Patient } from "fhir/r4";
import { FormatPhoneAsDigits } from "@/app/shared/format-service";
import {
  AddressData,
  USE_CASES,
  USE_CASE_DETAILS,
} from "@/app/shared/constants";

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
};

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

  return identifiers;
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

      removeDuplicates?.[0] && street1.push(removeDuplicates?.[0]);
      removeDuplicates?.[1] && street2.push(removeDuplicates?.[1]);
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
