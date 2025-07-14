import { Checkbox } from "@trussworks/react-uswds";
import styles from "../../buildFromTemplates/conditionTemplateSelection.module.scss";
import {
  EMPTY_MEDICAL_RECORD_SECTIONS,
  MedicalRecordSections,
} from "../../utils";

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
        {Object.keys(EMPTY_MEDICAL_RECORD_SECTIONS).map((key) => (
          <div key={key} className={styles.medicalRecordSectionRow}>
            <div
              data-testid={`container-medical-record-section-checkbox-${key}`}
            >
              <Checkbox
                id={`medical-record-section-checkbox-${key}`}
                name={`medical-record-section-checkbox-${key}`}
                label={`Include ${key
                  .replace(/([A-Z])/g, " $1")
                  .toLowerCase()}`}
                checked={
                  !!(
                    medicalRecordSections &&
                    medicalRecordSections[key as keyof MedicalRecordSections]
                  )
                }
                aria-label={`Select medical recored section ${key}`}
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
