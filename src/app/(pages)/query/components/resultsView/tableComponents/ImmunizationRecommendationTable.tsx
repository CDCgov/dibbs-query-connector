import React from "react";
import Table from "@/app/ui/designSystem/table/Table";
import {
  ImmunizationRecommendation,
  ImmunizationRecommendationRecommendation,
} from "fhir/r4";
import { formatDate } from "../../../../../utils/format-service";

/**
 * LOINC codes an immunization forecast uses to label its dateCriterion
 * entries (the FHIR ImmunizationRecommendation dateCriterion value set).
 */
export const FORECAST_DATE_LOINC = {
  earliest: "30981-5",
  due: "30980-7",
  overdue: "59778-1",
  latest: "59777-3",
} as const;

/**
 * Finds the first dateCriterion on a recommendation labeled with the given
 * LOINC code. Some gateways flatten several forecast windows into one
 * recommendation, repeating each code; the first occurrence is used.
 * @param recommendation - a single ImmunizationRecommendation.recommendation entry
 * @param loinc - the dateCriterion code to look for
 * @returns the matching date string, if any
 */
export function getDateCriterion(
  recommendation: ImmunizationRecommendationRecommendation,
  loinc: string,
): string | undefined {
  return recommendation.dateCriterion?.find((criterion) =>
    criterion.code?.coding?.some((coding) => coding.code === loinc),
  )?.value;
}

/**
 * The date a recommendation applies to: the first dateCriterion without a
 * code (how the IZ Gateway reports an administered or evaluation date),
 * falling back to the resource-level date.
 * @param recommendation - a single ImmunizationRecommendation.recommendation entry
 * @param resource - the parent ImmunizationRecommendation resource
 * @returns the date string, if any
 */
export function getRecommendationDate(
  recommendation: ImmunizationRecommendationRecommendation,
  resource: ImmunizationRecommendation,
): string | undefined {
  return (
    recommendation.dateCriterion?.find((criterion) => !criterion.code)?.value ??
    resource.date
  );
}

function getVaccineName(
  recommendation: ImmunizationRecommendationRecommendation,
): string | undefined {
  const vaccine = recommendation.vaccineCode?.[0];
  return (
    vaccine?.coding?.[0]?.display ??
    vaccine?.text ??
    recommendation.targetDisease?.coding?.[0]?.display ??
    recommendation.targetDisease?.text
  );
}

function getForecastStatus(
  recommendation: ImmunizationRecommendationRecommendation,
): string | undefined {
  // forecastStatus is required by the spec but absent on the IZ Gateway's
  // history-mirror entries, so treat it as optional.
  return (
    recommendation.forecastStatus?.coding?.[0]?.display ??
    recommendation.forecastStatus?.text
  );
}

/**
 * The props for the ImmunizationRecommendationTable component.
 */
export interface ImmunizationRecommendationTableProps {
  recommendations: ImmunizationRecommendation[];
}

/**
 * Displays a table of immunization forecast data from an array of
 * ImmunizationRecommendation resources — one row per recommendation entry.
 * @param props - Immunization recommendation table props.
 * @param props.recommendations - The array of ImmunizationRecommendation resources.
 * @returns - The ImmunizationRecommendationTable component.
 */
const ImmunizationRecommendationTable: React.FC<
  ImmunizationRecommendationTableProps
> = ({ recommendations }) => {
  return (
    <Table contained={false} className="margin-top-0-important">
      <thead>
        <tr>
          <th>Vaccine</th>
          <th>Forecast status</th>
          <th>Dose</th>
          <th>Date</th>
          <th>Earliest date</th>
          <th>Date due</th>
          <th>Overdue date</th>
        </tr>
      </thead>
      <tbody>
        {recommendations.flatMap((resource, resourceIndex) =>
          (resource.recommendation ?? []).map((recommendation, index) => (
            // Gateways may stamp every resource with the same id, so key by
            // position rather than resource.id.
            <tr key={`${resourceIndex}-${index}`}>
              <td>{getVaccineName(recommendation)}</td>
              <td>{getForecastStatus(recommendation)}</td>
              <td>
                {recommendation.doseNumberPositiveInt ??
                  recommendation.doseNumberString}
              </td>
              <td>
                {formatDate(getRecommendationDate(recommendation, resource))}
              </td>
              <td>
                {formatDate(
                  getDateCriterion(
                    recommendation,
                    FORECAST_DATE_LOINC.earliest,
                  ),
                )}
              </td>
              <td>
                {formatDate(
                  getDateCriterion(recommendation, FORECAST_DATE_LOINC.due),
                )}
              </td>
              <td>
                {formatDate(
                  getDateCriterion(recommendation, FORECAST_DATE_LOINC.overdue),
                )}
              </td>
            </tr>
          )),
        )}
      </tbody>
    </Table>
  );
};

export default ImmunizationRecommendationTable;
