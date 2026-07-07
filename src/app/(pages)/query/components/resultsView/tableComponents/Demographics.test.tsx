import { render, screen } from "@testing-library/react";
import { Patient } from "fhir/r4";
import Demographics, { calculatePatientAge } from "./Demographics";

const fullPatient: Patient = {
  resourceType: "Patient",
  id: "patient-1",
  name: [{ given: ["Hyper"], family: "Unlucky" }],
  birthDate: "1975-12-06",
  gender: "female",
  address: [
    {
      line: ["49 Meadow St"],
      city: "Lansing",
      state: "MI",
      postalCode: "48864",
    },
  ],
  telecom: [
    { system: "phone", use: "home", value: "517-425-1398" },
    { system: "email", value: "hyper.unlucky@email.com" },
  ],
  identifier: [
    {
      type: { coding: [{ display: "Medical Record Number" }] },
      value: "8692756",
    },
  ],
  communication: [{ language: { coding: [{ display: "English" }] } }],
  extension: [
    {
      url: "http://hl7.org/fhir/us/core/StructureDefinition/us-core-race",
      extension: [
        {
          url: "ombCategory",
          valueCoding: { display: "White" },
        },
      ],
    },
    {
      url: "http://hl7.org/fhir/us/core/StructureDefinition/us-core-ethnicity",
      extension: [
        {
          url: "ombCategory",
          valueCoding: { display: "Not Hispanic or Latino" },
        },
      ],
    },
  ],
};

describe("Demographics", () => {
  it("renders populated demographic rows for a fully specified patient", () => {
    render(<Demographics patient={fullPatient} />);

    expect(screen.getByText("Patient Name")).toBeInTheDocument();
    expect(screen.getByText("Hyper Unlucky")).toBeInTheDocument();

    expect(screen.getByText("DOB")).toBeInTheDocument();
    expect(screen.getByText("12/06/1975")).toBeInTheDocument();

    expect(screen.getByText("Sex")).toBeInTheDocument();
    expect(screen.getByText("Female")).toBeInTheDocument();

    expect(screen.getByText("Race")).toBeInTheDocument();
    expect(screen.getByText("White")).toBeInTheDocument();

    expect(screen.getByText("Ethnicity")).toBeInTheDocument();
    expect(screen.getByText("Not Hispanic or Latino")).toBeInTheDocument();

    expect(screen.getByText("Preferred Language")).toBeInTheDocument();
    expect(screen.getByText("English")).toBeInTheDocument();

    expect(screen.getByText("Address")).toBeInTheDocument();
    expect(screen.getByText("49 Meadow St")).toBeInTheDocument();

    expect(screen.getByText("Contact")).toBeInTheDocument();
    expect(screen.getByText(/517-425-1398/)).toBeInTheDocument();
    expect(screen.getByText(/hyper.unlucky@email.com/)).toBeInTheDocument();

    expect(screen.getByText("Patient Identifiers")).toBeInTheDocument();
    expect(screen.getByText(/8692756/)).toBeInTheDocument();

    // Current Age is derived from birthDate and should be present.
    expect(screen.getByText("Current Age")).toBeInTheDocument();
  });

  it("renders title rows with empty values for a sparse patient", () => {
    const sparsePatient: Patient = {
      resourceType: "Patient",
      id: "sparse",
      name: [{ given: ["Solo"], family: "Person" }],
    };

    render(<Demographics patient={sparsePatient} />);

    expect(screen.getByText("Patient Name")).toBeInTheDocument();
    expect(screen.getByText("Solo Person")).toBeInTheDocument();

    // Title rows still render, but the derived values are empty/blank.
    const dobRow = screen.getByText("DOB").closest("tr") as HTMLElement;
    const valueCell = dobRow.querySelectorAll("td")[1];
    expect(valueCell?.textContent?.trim()).toBe("");

    // Sex resolves to "" for a missing gender, so no Male/Female text appears.
    expect(screen.getByText("Sex")).toBeInTheDocument();
    expect(screen.queryByText("Female")).not.toBeInTheDocument();
    expect(screen.queryByText("Male")).not.toBeInTheDocument();
  });
});

describe("calculatePatientAge", () => {
  it("returns undefined when the patient has no birth date", () => {
    expect(calculatePatientAge({ resourceType: "Patient" })).toBeUndefined();
  });

  it("computes a non-negative age from a birth date", () => {
    const age = calculatePatientAge({
      resourceType: "Patient",
      birthDate: "1975-12-06",
    });
    expect(typeof age).toBe("number");
    expect(age).toBeGreaterThan(40);
  });
});
