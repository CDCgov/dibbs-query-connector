import { Checkbox } from "@trussworks/react-uswds";
import styles from "../../buildFromTemplates/conditionTemplateSelection.module.scss";
import {
  MEDICAL_RECORD_SECTION_KEYS,
  MedicalRecordSectionKey,
  MedicalRecordSections,
} from "../../utils";

const sectionLabels: Record<MedicalRecordSectionKey, string> = {
  labs: "Include lab results (observations & diagnostic reports)",
  encounters: "Include encounters",
  conditions: "Include conditions",
  medications: "Include medications (requests & statements)",
  immunizations: "Include immunizations",
  socialDeterminants: "Include social determinants",
  serviceRequests: "Include service requests",
};

type MedicalRecordsViewProps = {
  medicalRecordSections: MedicalRecordSections;
  setMedicalRecordSections: React.Dispatch<
    React.SetStateAction<MedicalRecordSections>
  >;
};

export const MedicalRecordsView: React.FC<MedicalRecordsViewProps> = ({
  medicalRecordSections,
  setMedicalRecordSections,
}) => {
  return (
    <div className={styles.medicalRecordSectionControls}>
      <div className={(styles.medicalRecordSectionControls, "padding-4")}>
        {MEDICAL_RECORD_SECTION_KEYS.map((key) => (
          <div key={key} className={styles.medicalRecordSectionRow}>
            <div
              data-testid={`container-medical-record-section-checkbox-${key}`}
            >
              <Checkbox
                id={`medical-record-section-checkbox-${key}`}
                name={`medical-record-section-checkbox-${key}`}
                label={sectionLabels[key]}
                checked={
                  !!(medicalRecordSections && medicalRecordSections[key])
                }
                aria-label={`Select medical record section ${key}`}
                onChange={(e) =>
                  setMedicalRecordSections((prev) => ({
                    ...prev,
                    [key]: e.target.checked,
                  }))
                }
              />
            </div>
          </div>
        ))}
      </div>
    </div>
  );
};
