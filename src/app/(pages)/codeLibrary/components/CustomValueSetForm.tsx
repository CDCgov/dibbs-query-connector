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
import { csvRow } from "@/app/api/csv/route";

type CustomValueSetFormProps = {
  mode: CustomCodeMode;
  setMode: (mode: CustomCodeMode) => void;
  activeValueSet: DibbsValueSet;
};

type CustomCodeMap = {
  [idx: string]: Concept;
};

const newEmptyCodesMap = (): CustomCodeMap => ({
  "0": { display: "", code: "", include: false },
});

/**
 * @param root0 props
 * @param root0.mode - controls whether to render the form for Adding a new VS or Editing an existing one
 * @param root0.setMode - state function to set the mode prop
 * @param root0.activeValueSet - if present, the value set to edit. Empty if creating a new value set
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

  const [customValueSet, setCustomValueSet] = useState<DibbsValueSet>(
    mode == "create" ? emptyValueSet : activeValueSet,
  );
  const [codesMap, setCodesMap] = useState<CustomCodeMap>(newEmptyCodesMap());

  const [error, setError] = useState<{ [field: string]: boolean }>({
    valueSetName: false,
    dibbsConceptType: false,
    system: false,
  });

  const prevModeRef = useRef<CustomCodeMode>(mode);
  const backBtnRef = useRef<HTMLAnchorElement>(null);

  function goBack() {
    // TODO: this will need to be handled differently
    // depending on how we arrived at this page:
    // from Manage codes view - Back to Codes
    // from query building - Back to query
    setLoading(true);
    setCodesMap(newEmptyCodesMap());

    return setMode("manage");
  }

  function validateForm(valueSet: DibbsValueSet) {
    const errorsToUpdate = { ...error };

    // Check each required field
    Object.keys(errorsToUpdate).forEach((field) => {
      if (!valueSet[field as keyof typeof valueSet]) {
        errorsToUpdate[field] = true;
      } else {
        errorsToUpdate[field] = false;
      }
    });

    // Set applicable error status in state
    setError(errorsToUpdate);

    // Return whether the form is valid
    return !Object.values(errorsToUpdate).some((val) => val === true);
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

    const nameInput = document.getElementById(`vsName`);
    nameInput?.focus();
  }, []);

  useEffect(() => {
    // if we're switching right from create mode to edit mode,
    // no need to load in customValueSet data, since we've already got
    // it in state
    if (prevModeRef.current == "create" && mode == "edit") {
      prevModeRef.current = mode;
      return;
    }

    // if we're loading an existing VS from manage/select mode,
    // map codes into the correct structure:
    const codeMap: CustomCodeMap = {};
    if (customValueSet?.concepts && customValueSet.concepts.length > 0) {
      customValueSet.concepts.map((code, idx) => {
        codeMap[idx] = code;
      });
      setCodesMap({ ...codeMap });
    }

    setLoading(false);
  }, [mode]);

  async function handleAddCodeFocus() {
    const indexPosition = Object.values(codesMap).length - 1;
    const addedInput = document.getElementById(`code-id-${indexPosition}`);
    addedInput?.focus();
  }

  // set focus to last code # input after adding/deleting a custom code row
  useEffect(() => {
    if (!customValueSet.valueSetId) {
      handleAddCodeFocus();
    }
  }, [Object.values(codesMap).length]);

  useEffect(() => {
    if (Object.keys(codesMap).length <= 0) {
      setCodesMap(newEmptyCodesMap());
    } else {
      const vsConcepts = Object.values(codesMap);
      setCustomValueSet({ ...customValueSet, concepts: vsConcepts });
    }
  }, [codesMap]);

  const fetchUpdatedValueSet = async (id?: string) => {
    const updatedVS = await getCustomValueSetById(
      id ?? customValueSet.valueSetId,
    );

    if (updatedVS.totalItems <= 0) {
      return;
    }

    const formattedVs = groupConditionConceptsIntoValueSets(updatedVS.items);

    const updatedCodes: CustomCodeMap = {};
    formattedVs[0]?.concepts?.sort().map((c, idx) => {
      updatedCodes[idx] = c;
    });

    setCodesMap({ ...updatedCodes });
    return setCustomValueSet(formattedVs[0]);
  };

  const handleAddCode = (type: string, index: string, input: string) => {
    const codeToUpdate = codesMap[index];

    if (type == "code") {
      codeToUpdate.code = input;
    } else {
      codeToUpdate.display = input;
    }

    setCodesMap({ ...codesMap, [index]: codeToUpdate });
    setCustomValueSet({ ...customValueSet, concepts: Object.values(codesMap) });
  };

  const handleRemoveCode = async (index: string) => {
    const subjectCode = codesMap[index];
    const updatedCodes = { ...codesMap };

    if (!!customValueSet) {
      // remove empty codes
      const storedConcepts = Object.values(codesMap).filter(
        (codes) => codes.code != "" && codes.display !== "",
      );

      // shape back into customCodeMap
      storedConcepts.map((val, idx) => {
        updatedCodes[idx] = val;
      });

      // add to customValueSet
      const newCustomValueSet = {
        ...customValueSet,
        concepts: storedConcepts,
      };

      // save to db
      const result = await deleteCustomConcept(subjectCode, newCustomValueSet);

      if (result.success == true) {
        // remove from local state
        delete updatedCodes[index];
        // remove from local valueSet object
        customValueSet.concepts.splice(Number(index), 1);

        showToastConfirmation({
          body: `Code ${subjectCode.code} ("${subjectCode.display}") removed from value set "${customValueSet.valueSetName}"`,
        });

        // if we deleted the last item, reset to empty placeholder
        if (Object.keys(updatedCodes).length <= 0) {
          return setCodesMap(newEmptyCodesMap());
        } else {
          // re-map index keys so we always start with 0
          const newCodes: CustomCodeMap = {};
          Object.values(updatedCodes).map((code, idx) => {
            newCodes[idx] = code;
          });
          return setCodesMap(newCodes);
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

    return Object.entries(codes).map(([id, codeObj]) => {
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
          key={id}
        >
          <div className={styles.textInput}>
            <label htmlFor={`code-id-${id}`}>Code #</label>
            <TextInput
              type="text"
              id={`code-id-${id}`}
              name={`code-id-${id}`}
              value={codeObj.code}
              onChange={(e) => handleAddCode("code", id, e.target.value)}
            />
          </div>
          <div className={styles.textInput}>
            <label htmlFor={`code-name-${id}`}>Code name</label>
            <TextInput
              type="text"
              id={`code-name-${id}`}
              name={`code-name-${id}`}
              value={codeObj.display}
              onChange={(e) => handleAddCode("name", id, e.target.value)}
            />
          </div>
          <Button
            unstyled
            type="button"
            className="unstyled-button-container"
            onClick={(e) => {
              e.preventDefault();
              handleRemoveCode(id.toString());
            }}
          >
            <Icon.Delete
              className={classNames(
                "margin-bottom-1",
                styles.deleteIcon,
                "destructive-primary",
              )}
              size={3}
              data-testid={`delete-custom-code-${id}`}
              aria-label="Trash icon indicating deletion of code entry"
            ></Icon.Delete>
          </Button>
        </div>
      );
    });
  };

  const saveValueSet = async () => {
    setSaving(true);
    const isValid = validateForm(customValueSet);

    try {
      if (!isValid) {
        return;
      }

      const updatedCodeMap: CustomCodeMap = {};

      // don't save empty placeholder rows
      const storedConcepts = Object.values(codesMap).filter(
        (codes) => codes.code != "" && codes.display !== "",
      );

      // shape back into CustomCodeMap
      storedConcepts.map((val, idx) => {
        updatedCodeMap[idx] = val;
      });

      const newCustomValueSet = {
        ...customValueSet,
        concepts: storedConcepts,
      };

      const result = await insertCustomValueSet(
        newCustomValueSet as DibbsValueSet,
        currentUser?.id as string,
      );

      if (result.success == true) {
        await fetchUpdatedValueSet(result.id);
        setCodesMap(updatedCodeMap);

        showToastConfirmation({
          body: `Value set "${newCustomValueSet.valueSetName}" successfully ${
            mode == "create" ? "added" : "updated"
          }`,
        });
      }
    } catch (error) {
      showToastConfirmation({
        variant: "error",
        body: `Unable to save value set "${customValueSet.valueSetName}". Please try again later.`,
      });

      console.error(error);
    } finally {
      setSaving(false);
      // don't stay in "create" mode, or we'll make duplicate
      // valuesets with each edit; should either stay on page
      // in edit mode or go back to manage view mode
      if (mode == "create" && isValid) {
        setMode("edit");
      }
      backBtnRef.current?.focus();
    }
  };

  const csvInputRef = useRef<HTMLInputElement>(null);
  const [csvError, setCsvError] = useState<string>("");

  async function handleCsvFile(file: File) {
    setCsvError("");
    const fd = new FormData();
    fd.append("file", file);
    const res = await fetch("/api/csv/", { method: "POST", body: fd });
    const json: { rows?: csvRow[]; error?: string } = await res.json();
    if (!res.ok || !json.rows) {
      setCsvError(json.error || "Failed to parse CSV");
      return;
    }
    console.log("Parsed CSV rows:", json.rows);
  }

  function triggerCsvPicker() {
    csvInputRef.current?.click();
  }

  return (
    <WithAuth>
      <div
        className={classNames(
          "main-container__wide",
          styles.mainContainer,
          styles.customValueSetForm,
        )}
      >
        <Backlink ref={backBtnRef} onClick={goBack} label={"Return to Codes"} />
        <form>
          <div className={styles.header}>
            <h1 className={styles.title}>
              {mode == "create" ? "New value set" : "Edit value set"}
            </h1>
            <Button
              disabled={!!saving}
              type="button"
              onClick={(e) => {
                e.preventDefault();
                saveValueSet();
              }}
            >
              {mode == "create" ? "Save value set" : "Save changes"}
            </Button>
          </div>
          <div className="padding-top-2">
            <input
              ref={csvInputRef}
              type="file"
              accept=".csv,text/csv"
              style={{ display: "none" }}
              onChange={(e) => {
                const f = e.target.files?.[0];
                if (f) {
                  void handleCsvFile(f);
                  e.currentTarget.value = "";
                }
              }}
            />
            <Button
              type="button"
              secondary
              onClick={(e) => {
                e.preventDefault();
                triggerCsvPicker();
              }}
            >
              Upload CSV
            </Button>
          </div>
          {csvError && (
            <div className={styles.errorMessage} role="alert">
              <Icon.Error
                aria-label="warning icon indicating an error is present"
                className={styles.errorMessage}
              />
              {csvError}
            </div>
          )}
          <div className={classNames(styles.formSection, styles.vsDescription)}>
            <div className={styles.formSection__title}>
              <h2>Value set description</h2>
            </div>
            <div className={styles.formSection__content}>
              <div
                className={classNames(
                  styles.formSection__input,
                  styles.textInput,
                  !!error.valueSetName ? styles.formValidationError : "",
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
                  onChange={(e) => {
                    setError({ ...error, valueSetName: false });
                    return setCustomValueSet({
                      ...customValueSet,
                      valueSetName: e.target.value as string,
                    });
                  }}
                  defaultValue={customValueSet?.valueSetName}
                />
                {error.valueSetName && (
                  <div className={styles.errorMessage}>
                    <Icon.Error
                      aria-label="warning icon indicating an error is present"
                      className={styles.errorMessage}
                    />
                    Enter a name for the value set.
                  </div>
                )}
              </div>
              <div
                className={classNames(
                  styles.formSection__input,
                  styles.dropdown,
                  !!error.dibbsConceptType ? styles.formValidationError : "",
                )}
              >
                <label htmlFor="category">Category (Required)</label>
                <Select
                  id="category"
                  className={classNames(
                    styles.filtersSelect,
                    !!error.dibbsConceptType ? styles.formValidationError : "",
                  )}
                  name="Category"
                  onChange={(e) => {
                    e.preventDefault();
                    setError({ ...error, dibbsConceptType: false });
                    setCustomValueSet({
                      ...customValueSet,
                      dibbsConceptType: e.target.value as DibbsConceptType,
                    });
                  }}
                  value={customValueSet?.dibbsConceptType}
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
                {error.dibbsConceptType && (
                  <div className={styles.errorMessage}>
                    <Icon.Error
                      aria-label="warning icon indicating an error is present"
                      className={styles.errorMessage}
                    />
                    Select a category.
                  </div>
                )}
              </div>
              <div
                className={classNames(
                  styles.formSection__input,
                  styles.dropdown,
                  !!error.system ? styles.formValidationError : "",
                )}
              >
                <label htmlFor="code-system">Code system (Required)</label>
                <Select
                  id="code-system"
                  className={
                    (styles.filtersSelect,
                    !!error.system ? styles.formValidationError : "")
                  }
                  name="code-system"
                  onChange={(e) => {
                    e.preventDefault();
                    setError({ ...error, system: false });
                    setCustomValueSet({
                      ...customValueSet,
                      system: e.target.value,
                    });
                  }}
                  value={customValueSet.system || ""}
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
                {error.system && (
                  <div className={styles.errorMessage}>
                    <Icon.Error
                      aria-label="warning icon indicating an error is present"
                      className={styles.errorMessage}
                    />
                    Select a code system.
                  </div>
                )}
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
                count={Object.values(codesMap).length}
                height={"4.4rem"}
              />
            ) : (
              <div className={styles.formSection__content}>
                <div className={styles.addCodeContainer}>
                  {renderAddCodeRow(codesMap)}
                </div>
                <button
                  className={styles.addCodeBtn}
                  onClick={(e) => {
                    e.preventDefault();

                    const updatedCodeMap: CustomCodeMap = {};
                    // grab copy of codes that are stored locally
                    Object.values(codesMap).map((val, idx) => {
                      updatedCodeMap[idx] = val;
                    });

                    const nextIndex = Object.keys(updatedCodeMap).length;

                    // add new empty row to end of map
                    updatedCodeMap[nextIndex] = {
                      code: "",
                      display: "",
                      include: false,
                    };

                    return setCodesMap({
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
