import {
  DibbsConceptType,
  DibbsValueSet,
} from "@/app/models/entities/valuesets";
import styles from "./addValueSet.module.scss";

import WithAuth from "@/app/ui/components/withAuth/WithAuth";
import Backlink from "@/app/ui/designSystem/backLink/Backlink";
import { Button, Icon, Select, TextInput } from "@trussworks/react-uswds";
import classNames from "classnames";
import { Dispatch, SetStateAction, useEffect, useState } from "react";
import { insertCustomValueSet } from "@/app/shared/custom-code-service";
import { User } from "@/app/models/entities/users";
import { getUserByUsername } from "@/app/backend/user-management";
import { useSession } from "next-auth/react";
import { Concept } from "@/app/models/entities/concepts";
import { formatStringToSentenceCase } from "@/app/shared/format-service";
import { formatSystem } from "./utils";
import { CustomCodeMode } from "./page";

type AddValueSetsProps = { setMode: Dispatch<SetStateAction<CustomCodeMode>> };

type CustomCodeMap = {
  [id: string]: Concept;
};

const CodeSystemOptions = [
  "http://hl7.org/fhir/sid/icd-10-cm",
  "http://hl7.org/fhir/sid/cvx",
  "http://www.nlm.nih.gov/research/umls/rxnorm",
  "http://loinc.org",
  "http://cap.org/eCC",
  "http://snomed.info/sct",
];
/**
 * @param root0 props
 * @param root0.setMode -
 * @returns  the DropdownFilter component
 */
const AddValueSets: React.FC<AddValueSetsProps> = ({ setMode }) => {
  function goBack() {
    // TODO: this will need to be handled differently
    // depending on how we arrived at this page:
    // from gear menu: no backnav
    // from "start from scratch": back to templates
    // from hybrid/query building: back to query
    setMode("manage");
  }
  const [currentUser, setCurrentUser] = useState<User>();
  const [valueSetName, setValueSetName] = useState<string>("");
  const [system, setSystem] = useState<string>("");
  const [category, setCategory] = useState<DibbsConceptType | undefined>();
  const [codes, setCodes] = useState<CustomCodeMap>({
    "0": {
      display: "",
      code: "",
      include: false,
    },
  });
  const nextIndexValue = Object.keys(codes).length;
  const { data: session } = useSession();
  const username = session?.user?.username || "";
  useEffect(() => {
    const fetchCurrentUser = async () => {
      try {
        const currentUser = await getUserByUsername(username);
        setCurrentUser(currentUser.items[0]);
      } catch (error) {
        console.error(`Failed to fetch current user: ${error}`);
      }
    };
    fetchCurrentUser();
  }, []);

  const handleAddCode =
    (type: string, index: string) =>
    (e: React.ChangeEvent<HTMLInputElement>) => {
      const input = e.target.value;

      const codeToUpdate = codes[Number(index)];

      if (type == "code") {
        codeToUpdate.code = input;
      } else {
        codeToUpdate.display = input;
      }

      setCodes({ ...codes, [Number(index)]: codeToUpdate });
    };

  const renderAddCodeRow = () => {
    return Object.entries(codes).map(([idx, code]) => {
      return (
        <div
          className={classNames(styles.addCodeRow, styles.section__input)}
          key={idx}
        >
          <div className={styles.textInput}>
            <label htmlFor="code-id">Code #</label>
            <TextInput
              type="text"
              id={`code-id-${code}`}
              name="code-id"
              value={code.code}
              placeholder={code.code}
              onChange={handleAddCode("code", idx)}
            />
          </div>
          <div className={styles.textInput}>
            <label htmlFor="code-name">Code name </label>
            <TextInput
              type="text"
              id={`code-name-${code}`}
              name="code-name"
              value={code.display}
              placeholder={code.display}
              onChange={handleAddCode("name", idx)}
            />
          </div>
          <Icon.Delete
            className={classNames("margin-bottom-1", styles.deleteIcon)}
            size={3}
            color="#919191"
            data-testid={`delete-custom-code-${code}`}
            aria-label="Trash icon indicating deletion of code entry"
            onClick={() => {
              console.log("delete");
            }}
          ></Icon.Delete>
        </div>
      );
    });
  };

  const saveValueSet = async () => {
    const newCustomValueSet: DibbsValueSet = {
      valueSetId: "",
      valueSetName: valueSetName,
      valueSetVersion: "",
      author: `${currentUser?.firstName} ${currentUser?.lastName} `,
      system: system,
      dibbsConceptType: category as DibbsConceptType,
      includeValueSet: false,
      concepts: Object.values(codes),
      userCreated: true,
    };

    const result = insertCustomValueSet(
      newCustomValueSet,
      currentUser?.id as string,
    );
    console.log(result);
  };

  return (
    <WithAuth>
      <div className={classNames("main-container__wide", styles.mainContainer)}>
        <Backlink onClick={goBack} label={"Return to Codes"} />
        <div className={styles.header}>
          <h1 className={styles.header__title}>New value set</h1>
          <Button type="button" onClick={saveValueSet}>
            Save value set
          </Button>
        </div>
        <div className={classNames(styles.section, styles.vsDescription)}>
          <div className={styles.section__title}>
            <h2>Value set description</h2>
          </div>
          <div className={styles.section__content}>
            <div
              className={classNames(styles.section__input, styles.textInput)}
            >
              <label htmlFor="vsName">Value set name (Required)</label>
              <TextInput
                type="text"
                id="vsName"
                name="vsName"
                onChange={(e) => setValueSetName(e.target.value)}
              />
            </div>
            <div className={classNames(styles.section__input, styles.dropdown)}>
              <label htmlFor="category">Category (Required)</label>
              <Select
                id="category"
                className={styles.filtersSelect}
                name="Category"
                onChange={(e) => {
                  e.preventDefault();
                  setCategory(e.target.value as DibbsConceptType);
                }}
                value={category}
              >
                {<option value=""></option>}
                {["labs", "conditions", "medications"].map((category) => {
                  return (
                    <option key={category} value={category}>
                      {formatStringToSentenceCase(category)}
                    </option>
                  );
                })}
              </Select>
            </div>
            <div className={classNames(styles.section__input, styles.dropdown)}>
              <label htmlFor="code-system">Code system (Required)</label>
              <Select
                id="code-system"
                className={styles.filtersSelect}
                name="code-system"
                onChange={(e) => {
                  e.preventDefault();
                  setSystem(e.target.value);
                }}
                value={system}
              >
                {<option value=""></option>}
                {CodeSystemOptions.map((codeSystem) => {
                  return (
                    <option key={codeSystem} value={codeSystem}>
                      {formatSystem(codeSystem)}
                    </option>
                  );
                })}
              </Select>
            </div>
          </div>
        </div>
        <div className={(styles.section, styles.codes)}>
          <div className={styles.section__title}>
            <h2>Codes</h2>
          </div>
          <div className={styles.section__content}>
            <div className={styles.addCodeContainer}>{renderAddCodeRow()}</div>
            <button
              className={styles.addCodeBtn}
              onClick={() =>
                setCodes({
                  ...codes,
                  ...{ [nextIndexValue]: { codeName: "", codeNum: "" } },
                })
              }
            >
              + Add code
            </button>
          </div>
        </div>
      </div>
    </WithAuth>
  );
};

export default AddValueSets;
