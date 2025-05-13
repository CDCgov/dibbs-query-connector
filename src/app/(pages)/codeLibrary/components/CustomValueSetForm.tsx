"use client";

import {
  DibbsConceptType,
  DibbsValueSet,
} from "@/app/models/entities/valuesets";
import styles from "../codeLibrary.module.scss";

import WithAuth from "@/app/ui/components/withAuth/WithAuth";
import Backlink from "@/app/ui/designSystem/backLink/Backlink";
import { Button, Icon, Select, TextInput } from "@trussworks/react-uswds";
import classNames from "classnames";
import { useEffect, useRef, useState } from "react";
import {
  deleteCustomConcept,
  getCustomValueSetById,
  insertCustomValueSet,
} from "@/app/shared/custom-code-service";
import { User } from "@/app/models/entities/users";
import { getUserByUsername } from "@/app/backend/user-management";
import { useSession } from "next-auth/react";
import { Concept } from "@/app/models/entities/concepts";
import {
  formatCodeSystemPrefix,
  formatStringToSentenceCase,
} from "@/app/shared/format-service";
import { CodeSystemOptions, CustomCodeMode, emptyValueSet } from "../utils";

import Skeleton from "react-loading-skeleton";
import { showToastConfirmation } from "@/app/ui/designSystem/toast/Toast";
import { groupConditionConceptsIntoValueSets } from "@/app/shared/utils";

type CustomValueSetFormProps = {
  mode: CustomCodeMode;
  setMode: (mode: CustomCodeMode) => void;
  activeValueSet?: DibbsValueSet;
};

type CustomCodeMap = {
  [idx: string]: Concept;
};
const getEmptyCodeMap = (): CustomCodeMap => ({
  "0": { display: "", code: "", include: false },
});

/**
 * @param root0 props
 * @param root0.mode - controls whether to render the form for Adding a new VS or Editing an existing one
 * @param root0.setMode - state function to set the mode prop
 * @param root0.activeValueSet - if present, the value set to edit. Absent if creating a new value set
 * @returns  the CustomValueSetForm component
 */
const CustomValueSetForm: React.FC<CustomValueSetFormProps> = ({
  mode,
  setMode,
  activeValueSet,
}) => {
  const [loading, setLoading] = useState<boolean>(true);
  const [saving, setSaving] = useState<boolean>(false); // don't render skeleton if we're just refreshing on save

  const { data: session } = useSession();
  const username = session?.user?.username || "";
  const [currentUser, setCurrentUser] = useState<User>();

  const [customValueSet, setCustomValueSet] =
    useState<DibbsValueSet>(emptyValueSet);
  const [codes, setCodes] = useState<CustomCodeMap>(getEmptyCodeMap());

  const [errorMessage, setErrorMessage] = useState<string>("");
  const [error, setError] = useState({
    valueSetName: false,
    system: false,
    dibbsConceptType: false,
    concepts: false,
  });

  const prevModeRef = useRef<CustomCodeMode>(mode);
  function goBack() {
    // TODO: this will need to be handled differently
    // depending on how we arrived at this page:
    // from Manage codes view - Back to Codes
    // from query building - Back to query
    setLoading(true);
    setCodes(getEmptyCodeMap());
    return setMode("manage");
  }

  function validateInput(e: React.ChangeEvent<HTMLInputElement>) {
    const input = e.currentTarget.value.trim();
    if (input == "") {
      setError({ ...error, valueSetName: true });
    }
  }

  useEffect(() => {
    async function fetchCurrentUser() {
      try {
        const currentUser = await getUserByUsername(username);
        setCurrentUser(currentUser.items[0]);
      } catch (error) {
        console.error(`Failed to fetch current user: ${error}`);
      }
    }

    fetchCurrentUser();
  }, []);

  useEffect(() => {
    // if we're switching from create mode to edit mode,
    // no need to load in activeValueSet data, since we've already got
    // it in state
    if (prevModeRef.current == "create" && mode == "edit") {
      prevModeRef.current = mode;
      return;
    }

    // if we're loading an existing VS from manage/select mode,
    // map codes into the correct structure:
    const codeMap: CustomCodeMap = {};
    if (activeValueSet?.concepts && activeValueSet.concepts.length > 0) {
      activeValueSet.concepts.map((code, idx) => {
        codeMap[idx] = code;
      });

      setCodes({ ...codeMap });
    }

    if (activeValueSet && activeValueSet.userCreated && mode == "edit") {
      setCustomValueSet(activeValueSet);
    }
    setLoading(false);
  }, [mode]);

  useEffect(() => {
    if (Object.keys(codes).length <= 0) {
      setCodes(getEmptyCodeMap());
    } else {
      const vsConcepts = Object.values(codes);
      setCustomValueSet({ ...customValueSet, concepts: vsConcepts });
    }
  }, [codes]);

  const fetchUpdatedValueSet = async () => {
    const updatedVS = await getCustomValueSetById(customValueSet.valueSetId);

    if (updatedVS.totalItems <= 0) {
      return;
    }

    const formattedVs = groupConditionConceptsIntoValueSets(updatedVS.items);

    const updatedCodes: CustomCodeMap = {};
    formattedVs[0]?.concepts?.sort().map((c, idx) => {
      updatedCodes[idx] = c;
    });

    setCodes({ ...updatedCodes });
    return setCustomValueSet(formattedVs[0]);
  };

  const handleAddCode = (type: string, index: string, input: string) => {
    const codeToUpdate = codes[index];

    if (type == "code") {
      codeToUpdate.code = input;
    } else {
      codeToUpdate.display = input;
    }

    setCodes({ ...codes, [index]: codeToUpdate });
    setCustomValueSet({ ...customValueSet, concepts: Object.values(codes) });
  };

  const handleRemoveCode = async (index: string) => {
    const subjectCode = codes[index];
    const updatedCodes = { ...codes };
    const subjectValueSet = mode == "create" ? customValueSet : activeValueSet;

    if (!!subjectValueSet) {
      // remove empty codes
      const storedConcepts = Object.values(codes).filter(
        (codes) => codes.code != "" && codes.display !== "",
      );

      // shape back into customCodeMap
      storedConcepts.map((val, idx) => {
        updatedCodes[idx] = val;
      });

      // add to customValueSet
      const newCustomValueSet = {
        ...subjectValueSet,
        concepts: storedConcepts,
      };

      // save to db
      const result = await deleteCustomConcept(subjectCode, newCustomValueSet);

      if (result.success == true) {
        // remove from local state
        delete updatedCodes[index];
        // remove from local valueSet object
        subjectValueSet.concepts.splice(Number(index), 1);

        showToastConfirmation({
          body: `Code ${subjectCode.code} ("${subjectCode.display}") removed from value set "${subjectValueSet.valueSetName}"`,
        });

        // if we deleted the last item, reset to empty placeholder
        if (Object.keys(updatedCodes).length <= 0) {
          return setCodes(getEmptyCodeMap());
        } else {
          return setCodes(updatedCodes);
        }
      } else {
        showToastConfirmation({
          body: `Error: Could not remove code ${subjectCode.code} ("${subjectCode.display}")."`,
          variant: "error",
        });
      }
    }
  };

  const renderAddCodeRow = (codes: CustomCodeMap) => {
    const showEmptyCodePlaceholder =
      Object.keys(codes).length == 1 &&
      codes[0]?.code == "" &&
      codes[0]?.display == "";

    return Object.entries(codes).map(([id, codeObj], idx) => {
      return loading ? (
        <Skeleton
          height={"2.5rem"}
          containerClassName={styles.skeleton_container}
          className={styles.skeleton}
        />
      ) : (
        <div
          data-testid={"addCode-inputs"}
          className={classNames(
            styles.addCodeRow,
            styles.formSection__input,
            showEmptyCodePlaceholder ? styles.emptyCodeRow : "",
          )}
          key={codeObj.internalId || idx}
        >
          <div className={styles.textInput}>
            <label htmlFor="code-id">Code #</label>
            <TextInput
              type="text"
              id={`code-id-${codeObj.internalId ?? idx}`}
              name="code-id"
              value={
                activeValueSet?.userCreated ? codeObj.code : codes[idx].code
              }
              onChange={(e) => handleAddCode("code", id, e.target.value)}
            />
          </div>
          <div className={styles.textInput}>
            <label htmlFor="code-name">Code name</label>
            <TextInput
              type="text"
              id={`code-name-${codeObj.internalId ?? idx}`}
              name="code-name"
              value={
                activeValueSet?.userCreated
                  ? codeObj.display
                  : codes[idx].display
              }
              onChange={(e) => handleAddCode("name", id, e.target.value)}
            />
          </div>
          <Icon.Delete
            className={classNames("margin-bottom-1", styles.deleteIcon)}
            size={3}
            color="#919191"
            data-testid={`delete-custom-code-${idx}`}
            aria-label="Trash icon indicating deletion of code entry"
            onClick={(e) => {
              e.preventDefault();
              handleRemoveCode(idx.toString());
            }}
          ></Icon.Delete>
        </div>
      );
    });
  };

  const saveValueSet = async () => {
    setSaving(true);
    const valueSetToSave = mode == "create" ? customValueSet : activeValueSet;

    // TODO: implement proper form validation
    const requiredFields = ["valueSetName", "system", "dibbsConceptType"];
    valueSetToSave &&
      Object.entries(valueSetToSave).some(([key, val]) => {
        if (val == "" && requiredFields.includes(key)) {
          setError({ ...error, [key]: true });
        }
      });
    Object.entries(error).map(([field, value]) => {
      if (value == true) {
        console.log("error!", field);
      }
    });

    const updatedCodeMap: CustomCodeMap = {};
    // don't save empty placeholder rows
    const storedConcepts = Object.values(codes).filter(
      (codes) => codes.code != "" && codes.display !== "",
    );

    // shape back into CustomCodeMap
    storedConcepts.map((val, idx) => {
      updatedCodeMap[idx] = val;
    });

    const newCustomValueSet = {
      ...valueSetToSave,
      concepts: storedConcepts,
    };

    try {
      const result = await insertCustomValueSet(
        newCustomValueSet as DibbsValueSet,
        currentUser?.id as string,
      );

      //  TODO: error handling
      if (result.success == true) {
        setErrorMessage("");
        fetchUpdatedValueSet();

        showToastConfirmation({
          body: `Value set "${customValueSet.valueSetName}" successfully ${
            mode == "create" ? "added" : "updated"
          }`,
        });

        setCodes(updatedCodeMap);
      }
    } catch (error) {
      console.log(error);
    } finally {
      setSaving(false);
      // don't stay in "create" mode, or we'll make duplicate
      // valuesets with each edit; should either stay on page
      // or go back to manage view mode
      if (mode == "create") {
        setMode("edit");
      }
    }
  };

  return (
    <WithAuth>
      <div
        className={classNames(
          "main-container__wide",
          styles.mainContainer,
          styles.customValueSetForm,
        )}
      >
        <Backlink onClick={goBack} label={"Return to Codes"} />
        <form>
          <div className={styles.header}>
            <h1 className={styles.title}>
              {mode == "create" ? "New value set" : "Edit value set"}
            </h1>
            <Button
              disabled={error.valueSetName || saving}
              type="button"
              onClick={saveValueSet}
            >
              {mode == "create" ? "Save value set" : "Save changes"}
            </Button>
          </div>
          <div className={classNames(styles.formSection, styles.vsDescription)}>
            <div className={styles.formSection__title}>
              <h2>Value set description</h2>
            </div>
            <div className={styles.formSection__content}>
              <div
                className={classNames(
                  styles.formSection__input,
                  styles.textInput,
                  error.valueSetName ? styles.formValidationError : "",
                )}
              >
                <label htmlFor="vsName">
                  {`Value set name `}
                  (Required)
                </label>
                <TextInput
                  type="text"
                  id="vsName"
                  name="vsName"
                  onBlur={validateInput}
                  onChange={(e) => {
                    setError({ ...error, valueSetName: false });
                    return setCustomValueSet({
                      ...customValueSet,
                      valueSetName: e.target.value as string,
                    });
                  }}
                  defaultValue={
                    mode == "create"
                      ? customValueSet?.valueSetName || ""
                      : activeValueSet?.valueSetName
                  }
                />
                {error.valueSetName && (
                  <div className={styles.errorMessage}>
                    <Icon.Error className={styles.errorMessage} />
                    Enter a name for the value set.
                  </div>
                )}
              </div>
              <div
                className={classNames(
                  styles.formSection__input,
                  styles.dropdown,
                )}
              >
                <label htmlFor="category">Category (Required)</label>
                <Select
                  id="category"
                  className={styles.filtersSelect}
                  name="Category"
                  onChange={(e) => {
                    e.preventDefault();
                    setError({ ...error, dibbsConceptType: false });
                    setCustomValueSet({
                      ...customValueSet,
                      dibbsConceptType: e.target.value as DibbsConceptType,
                    });
                  }}
                  defaultValue={
                    mode == "create"
                      ? customValueSet?.dibbsConceptType || ""
                      : activeValueSet?.dibbsConceptType || ""
                  }
                >
                  {<option value="" disabled></option>}
                  {["labs", "conditions", "medications"].map((category) => {
                    return (
                      <option key={category} value={category}>
                        {formatStringToSentenceCase(category)}
                      </option>
                    );
                  })}
                </Select>
              </div>
              <div
                className={classNames(
                  styles.formSection__input,
                  styles.dropdown,
                )}
              >
                <label htmlFor="code-system">Code system (Required)</label>
                <Select
                  id="code-system"
                  className={styles.filtersSelect}
                  name="code-system"
                  onChange={(e) => {
                    e.preventDefault();
                    setCustomValueSet({
                      ...customValueSet,
                      system: e.target.value,
                    });
                  }}
                  defaultValue={
                    mode == "create"
                      ? customValueSet?.system || ""
                      : activeValueSet?.system || ""
                  }
                >
                  {<option value="" disabled></option>}
                  {CodeSystemOptions.map((codeSystem) => {
                    return (
                      <option key={codeSystem} value={codeSystem}>
                        {formatCodeSystemPrefix(codeSystem)}
                      </option>
                    );
                  })}
                </Select>
              </div>
            </div>
          </div>
          <div className={(styles.formSection, styles.codes)}>
            <div className={styles.formSection__title}>
              <h2>Codes</h2>
            </div>
            {loading ? (
              <Skeleton
                containerClassName={styles.formSection__content}
                count={Object.values(codes).length}
                height={"4.4rem"}
              />
            ) : (
              <div className={styles.formSection__content}>
                <div className={styles.addCodeContainer}>
                  {renderAddCodeRow(codes)}
                </div>
                <button
                  className={styles.addCodeBtn}
                  onClick={(e) => {
                    e.preventDefault();

                    const updatedCodeMap: CustomCodeMap = {};
                    // grab copy of codes that are stored locally
                    Object.values(codes).map((val, idx) => {
                      updatedCodeMap[idx] = val;
                    });

                    const nextIndex = Object.keys(updatedCodeMap).length;

                    // add new empty row to end of map
                    updatedCodeMap[nextIndex] = {
                      code: "",
                      display: "",
                      include: false,
                    };

                    return setCodes({
                      ...updatedCodeMap,
                    });
                  }}
                >
                  + Add code
                </button>
              </div>
            )}
          </div>
        </form>
      </div>
    </WithAuth>
  );
};

export default CustomValueSetForm;
