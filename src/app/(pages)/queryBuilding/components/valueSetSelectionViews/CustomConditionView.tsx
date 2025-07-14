import { Icon, Button } from "@trussworks/react-uswds";
import classNames from "classnames";
import styles from "../../buildFromTemplates/conditionTemplateSelection.module.scss";
import { useSaveQueryAndRedirect } from "@/app/backend/query-building/useSaveQueryAndRedirect";
import { MedicalRecordSections, NestedQuery } from "../../utils";

type CustomConditionViewProps = {
  constructedQuery: NestedQuery;
  medicalRecordSections: MedicalRecordSections;
  queryName: string | undefined;
};

export const CustomConditionView: React.FC<CustomConditionViewProps> = ({
  constructedQuery,
  medicalRecordSections,
  queryName,
}) => {
  const saveQueryAndRedirect = useSaveQueryAndRedirect();

  return (
    <>
      <div className={styles.codeLibrary__empty}>
        <Icon.GridView
          aria-label="Stylized icon showing four squares in a grid"
          className={classNames("usa-icon", styles.icon)}
        />
        <p className={styles.codeLibrary__emptyText}>
          <strong>
            This is a space for you to pull in individual value sets
          </strong>
        </p>
        <p className={styles.codeLibrary__emptyText}>
          <strong>
            These can be official value sets from CSTE, or ones that you have
            created in the code library.
          </strong>
        </p>
        <Button
          className={styles.codeLibrary__button}
          type="button"
          onClick={() =>
            saveQueryAndRedirect(
              constructedQuery,
              medicalRecordSections,
              queryName,
              "/codeLibrary",
              "select",
            )
          }
        >
          Add from code library
        </Button>
      </div>
    </>
  );
};
