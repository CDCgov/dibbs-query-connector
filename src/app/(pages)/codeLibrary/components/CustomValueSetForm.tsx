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
import { useEffect, useState } from "react";
import { insertCustomValueSet } from "@/app/shared/custom-code-service";
import { User } from "@/app/models/entities/users";
import { getUserByUsername } from "@/app/backend/user-management";
import { useSession } from "next-auth/react";
import { Concept } from "@/app/models/entities/concepts";
import { formatStringToSentenceCase } from "@/app/shared/format-service";
import {
  CodeSystemOptions,
  CustomCodeMode,
  emptyCodeMapItem,
  emptyValueSet,
  formatSystem,
} from "../utils";

import Skeleton from "react-loading-skeleton";
import { showToastConfirmation } from "@/app/ui/designSystem/toast/Toast";

type CustomValueSetFormProps = {
  mode: CustomCodeMode;
  setMode: (mode: CustomCodeMode) => void;
  activeValueSet?: DibbsValueSet;
};

type CustomCodeMap = {
  [id: string]: Concept;
};

/**
 * @param root0 props
 * @param root0.mode -
 * @param root0.setMode -
 * @param root0.activeValueSet -
 * @returns  the CustomValueSetForm component
 */
const CustomValueSetForm: React.FC<CustomValueSetFormProps> = ({
  mode,
  setMode,
  activeValueSet,
}) => {
  const [loading, setLoading] = useState<boolean>(true);
  const { data: session } = useSession();
  const username = session?.user?.username || "";
  const [currentUser, setCurrentUser] = useState<User>();

  const [customValueSet, setCustomValueSet] =
    useState<DibbsValueSet>(emptyValueSet);
  const [codes, setCodes] = useState<CustomCodeMap>(
    mode == "create" ? emptyCodeMapItem : {},
  );
  const nextIndexValue = Object.keys(codes).length;

  const [errorMessage, setErrorMessage] = useState<string>("");
  const [error, setError] = useState({
    valueSetName: false,
    system: false,
    dibbsConceptType: false,
    concepts: false,
  });

  function goBack() {
    // TODO: this will need to be handled differently
    // depending on how we arrived at this page:
    // from gear menu: no backnav
    // from "start from scratch": back to templates
    // from hybrid/query building: back to query
    setLoading(true);
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
    if (mode == "edit") {
      const codeMap: CustomCodeMap = {};

      activeValueSet?.concepts.map((code, idx) => {
        codeMap[idx] = code;
      });
      setCodes(codeMap);
    } else {
      setCodes(emptyCodeMapItem);
    }

    mode == "edit" && activeValueSet && setCustomValueSet(activeValueSet);
    setLoading(false);
  }, [mode]);

  const handleAddCode =
    (type: string, index: string) =>
    (e: React.ChangeEvent<HTMLInputElement>) => {
      const input = e.target.value;

      const codeToUpdate = codes[index];

      if (type == "code") {
        codeToUpdate.code = input;
      } else {
        codeToUpdate.display = input;
      }

      setCodes({ ...codes, [index]: codeToUpdate });
    };

  const renderAddCodeRow = () => {
    return Object.entries(codes).map(([idx, code]) => {
      return (
        <div
          className={classNames(styles.addCodeRow, styles.formSection__input)}
          key={idx}
        >
          <div className={styles.textInput}>
            <label htmlFor="code-id">Code #</label>
            <TextInput
              type="text"
              id={`code-id-${code}`}
              name="code-id"
              defaultValue={code.code}
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
              defaultValue={code.display}
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
              // TODO: implement delete
              console.log("delete");
            }}
          ></Icon.Delete>
        </div>
      );
    });
  };

  const saveValueSet = async () => {
    // TODO: implement proper form validation
    const requiredFields = ["valueSetName", "system", "dibbsConceptType"];
    Object.entries(customValueSet).some(([key, val]) => {
      if (val == "" && requiredFields.includes(key)) {
        setError({ ...error, [key]: true });
      }
    });
    Object.entries(error).map(([field, value]) => {
      if (value == true) {
        console.log("error!", field);
      }
    });

    const author =
      mode == "edit"
        ? !!currentUser?.firstName && !!currentUser?.lastName
          ? `${currentUser?.firstName} ${currentUser?.lastName}`
          : currentUser?.username
        : "";

    const newCustomValueSet = {
      ...customValueSet,
      author: author as string,
      concepts: Object.values(codes),
    };

    if (!error.valueSetName) {
      const result = await insertCustomValueSet(
        newCustomValueSet,
        currentUser?.id as string,
      );

      if (result.success == true) {
        setErrorMessage("");
        return showToastConfirmation({
          body: `Value set "${customValueSet.valueSetName}" successfully ${
            mode == "create" ? "added" : "updated"
          }`,
        });
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
              disabled={error.valueSetName}
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
            {loading ? (
              <Skeleton height={"7rem"} />
            ) : (
              <div className={styles.formSection__content}>
                <div
                  className={classNames(
                    styles.formSection__input,
                    styles.textInput,
                    error.valueSetName == true
                      ? styles.formValidationError
                      : "",
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
                        ? customValueSet.valueSetName || ""
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
                        ? customValueSet.dibbsConceptType || ""
                        : activeValueSet?.dibbsConceptType
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
                        ? customValueSet.system || ""
                        : activeValueSet?.system
                    }
                  >
                    {<option value="" disabled></option>}
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
            )}
          </div>
          <div className={(styles.formSection, styles.codes)}>
            <div className={styles.formSection__title}>
              <h2>Codes</h2>
            </div>
            {loading ? (
              <Skeleton height={"7rem"} />
            ) : (
              <div className={styles.formSection__content}>
                <div className={styles.addCodeContainer}>
                  {renderAddCodeRow()}
                </div>
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
            )}
          </div>
        </form>
      </div>
    </WithAuth>
  );
};

export default CustomValueSetForm;
