import { render, screen, within } from "@testing-library/react";
import {
  Bundle,
  ImmunizationRecommendation,
  ImmunizationRecommendationRecommendationDateCriterion,
} from "fhir/r4";
import ImmunizationRecommendationTable, {
  FORECAST_DATE_LOINC,
  getDateCriterion,
  getRecommendationDate,
} from "./ImmunizationRecommendationTable";
import { readJsonFile } from "@/app/tests/shared_utils/readJsonFile";

const LOINC = "http://loinc.org";

const historyRow: ImmunizationRecommendation = {
  resourceType: "ImmunizationRecommendation",
  id: "shared-id",
  patient: { reference: "Patient/p1" },
  date: "2026-06-05",
  recommendation: [
    {
      vaccineCode: [
        {
          coding: [
            {
              system: "http://hl7.org/fhir/sid/cvx",
              code: "09",
              display:
                "Td (adult), 2 Lf tetanus toxoid, preservative free, adsorbed",
            },
          ],
        },
      ],
      dateCriterion: [{ value: "2022-08-10" }],
      doseNumberPositiveInt: 1,
      // forecastStatus is required by the type but absent in gateway data.
    } as ImmunizationRecommendation["recommendation"][number],
  ],
};

// Mirrors the gateway forecast entry, which omits the (spec-required) date.
const forecastRow = {
  resourceType: "ImmunizationRecommendation",
  id: "shared-id",
  patient: { reference: "Patient/p1" },
  recommendation: [
    {
      vaccineCode: [
        {
          coding: [
            {
              system: "http://hl7.org/fhir/sid/cvx",
              code: "998",
              display: "no vaccine administered",
            },
          ],
        },
      ],
      forecastStatus: {
        coding: [{ system: LOINC, code: "LA13424-9", display: "Too Old" }],
      },
      dateCriterion: [
        // The gateway reports the evaluation date without a code.
        {
          value: "2026-08-10",
        } as ImmunizationRecommendationRecommendationDateCriterion,
        {
          code: { coding: [{ system: LOINC, code: "30981-5" }] },
          value: "2000-10-01",
        },
        {
          code: { coding: [{ system: LOINC, code: "30980-7" }] },
          value: "2000-10-02",
        },
        {
          code: { coding: [{ system: LOINC, code: "59778-1" }] },
          value: "2000-10-28",
        },
        // A second flattened window — must not override the first.
        {
          code: { coding: [{ system: LOINC, code: "30981-5" }] },
          value: "2001-10-01",
        },
        {
          code: { coding: [{ system: LOINC, code: "30980-7" }] },
          value: "2001-10-01",
        },
      ],
    },
  ],
} as ImmunizationRecommendation;

describe("ImmunizationRecommendationTable", () => {
  it("renders one row per recommendation with the forecast columns", () => {
    render(
      <ImmunizationRecommendationTable
        recommendations={[historyRow, forecastRow]}
      />,
    );

    const headers = screen
      .getAllByRole("columnheader")
      .map((h) => h.textContent);
    expect(headers).toEqual([
      "Vaccine",
      "Forecast status",
      "Dose",
      "Date",
      "Earliest date",
      "Date due",
      "Overdue date",
    ]);

    const rows = screen.getAllByRole("row").slice(1);
    expect(rows).toHaveLength(2);

    const historyCells = within(rows[0])
      .getAllByRole("cell")
      .map((c) => c.textContent);
    expect(historyCells).toEqual([
      "Td (adult), 2 Lf tetanus toxoid, preservative free, adsorbed",
      "",
      "1",
      "08/10/2022",
      "",
      "",
      "",
    ]);

    const forecastCells = within(rows[1])
      .getAllByRole("cell")
      .map((c) => c.textContent);
    expect(forecastCells).toEqual([
      "no vaccine administered",
      "Too Old",
      "",
      "08/10/2026",
      "10/01/2000",
      "10/02/2000",
      "10/28/2000",
    ]);
  });

  it("renders every recommendation from the real IZ Gateway bundle even though they share an id", () => {
    const bundle = readJsonFile<Bundle>(
      "./src/app/tests/assets/BundleIzGatewayImmunizationRecommendation.json",
    );
    const recommendations =
      bundle?.entry
        ?.map((e) => e.resource)
        .filter(
          (r): r is ImmunizationRecommendation =>
            r?.resourceType === "ImmunizationRecommendation",
        ) ?? [];
    expect(recommendations).toHaveLength(3);

    render(
      <ImmunizationRecommendationTable recommendations={recommendations} />,
    );

    expect(screen.getAllByRole("row").slice(1)).toHaveLength(3);
    expect(screen.getByText("Too Old")).toBeInTheDocument();
    expect(
      screen.getByText("Influenza, split virus, quadrivalent, PF"),
    ).toBeInTheDocument();
  });

  it("falls back to the resource date when no uncoded dateCriterion exists", () => {
    const recommendation = {
      vaccineCode: [{ text: "Flu" }],
      dateCriterion: [
        {
          code: { coding: [{ system: LOINC, code: FORECAST_DATE_LOINC.due }] },
          value: "2027-01-01",
        },
      ],
    } as ImmunizationRecommendation["recommendation"][number];
    const resource: ImmunizationRecommendation = {
      resourceType: "ImmunizationRecommendation",
      patient: { reference: "Patient/p1" },
      date: "2026-06-03",
      recommendation: [recommendation],
    };

    expect(getRecommendationDate(recommendation, resource)).toBe("2026-06-03");
    expect(getDateCriterion(recommendation, FORECAST_DATE_LOINC.due)).toBe(
      "2027-01-01",
    );
    expect(
      getDateCriterion(recommendation, FORECAST_DATE_LOINC.earliest),
    ).toBeUndefined();
  });
});
