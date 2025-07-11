import { Patient } from "fhir/r4";
import * as dateFns from "date-fns";
import { evaluate } from "fhirpath";

import {
  formatName,
  formatAddress,
  formatContact,
  formatIdentifier,
  formatDate,
  formatSex,
} from "../../../../../shared/format-service";
import Table from "@/app/ui/designSystem/table/Table";

/**
 * Displays the demographic information of a patient.
 * @param patient - The patient to display demographic information for.
 * @returns The Demographics component.
 */
export interface DemographicsProps {
  patient: Patient;
}

/**
 * Displays the demographic information of a patient.
 * @param props - The props for the Demographics component.
 * @param props.patient - The patient resource to display demographic information for.
 * @returns The Demographics component.
 */
const Demographics: React.FC<DemographicsProps> = ({ patient }) => {
  const demographicData = formatDemographics(patient).filter((e) => Boolean(e));

  return (
    <Table contained={false}>
      <thead className="usa-sr-only">
        <tr>
          <th colSpan={2} scope="col">
            Demographics
          </th>
        </tr>
      </thead>
      <tbody>
        {demographicData.map((item) => (
          <tr key={item.title}>
            <td>
              <strong>{item.title}</strong>
            </td>
            <td> {item.value}</td>
          </tr>
        ))}
      </tbody>
    </Table>
  );
};

export default Demographics;

export interface DataDisplayInfo {
  title: string;
  value?: string | React.JSX.Element | React.JSX.Element[];
}

/**
 * Formats the demographic information of a patient.
 * @param patient - The patient to format demographic information for.
 * @returns The formatted demographic information as an array of DisplayData objects.
 */
function formatDemographics(patient: Patient): DataDisplayInfo[] {
  const demographicData: DataDisplayInfo[] = [
    {
      title: "Patient Name",
      value: formatName(patient.name ?? []),
    },
    {
      title: "DOB",
      value: formatDate(patient.birthDate),
    },
    {
      title: "Current Age",
      value: calculatePatientAge(patient)?.toString(),
    },
    {
      title: "Sex",
      value: formatSex(patient.gender),
    },
    {
      title: "Race",
      value: (
        evaluate(
          patient,
          "Patient.extension.where(url = 'http://hl7.org/fhir/us/core/StructureDefinition/us-core-race').extension.first().valueCoding.display",
        ) as string[]
      )[0],
    },
    {
      title: "Ethnicity",
      value: (
        evaluate(
          patient,
          "Patient.extension.where(url = 'http://hl7.org/fhir/us/core/StructureDefinition/us-core-ethnicity').extension.first().valueCoding.display",
        ) as string[]
      )[0],
    },
    {
      title: "Tribal Affiliation",
      value: (
        evaluate(
          patient,
          "Patient.extension.where(url='http: //hl7.org/fhir/us/ecr/StructureDefinition/us-ph-tribal-affiliation-extension').extension.where(url='TribeName').value.display",
        ) as string[]
      )[0],
    },
    {
      title: "Preferred Language",
      value: (
        evaluate(
          patient,
          "Patient.communication.first().language.coding.first().display",
        ) as string[]
      )[0],
    },
    {
      title: "Address",
      value: formatAddress(patient.address ?? []),
    },
    {
      title: "Contact",
      value: formatContact(patient.telecom ?? []),
    },
    {
      title: "Patient Identifiers",
      value: formatIdentifier(patient.identifier ?? []),
    },
  ];

  return demographicData;
}

/**
 * Calculates the age of a patient based on their birth date.
 * @param patient - The patient to calculate the age for.
 * @returns The age of the patient.
 */
export function calculatePatientAge(patient: Patient): number | undefined {
  if (patient.birthDate) {
    const patientDOB = new Date(patient.birthDate);
    const today = new Date();
    return dateFns.differenceInYears(today, patientDOB);
  }
}
