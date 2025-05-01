import styles from "./addValueSet.module.scss";

import WithAuth from "@/app/ui/components/withAuth/WithAuth";
import Backlink from "@/app/ui/designSystem/backLink/Backlink";
import { Button, Icon, Select, TextInput } from "@trussworks/react-uswds";
import classNames from "classnames";
import { useState } from "react";

type AddValueSetsProps = {};

function goBack() {
  // TODO: this will need to be handled differently
  // depending on how we arrived at this page:
  // from gear menu: no backnav
  // from "start from scratch": back to templates
  // from hybrid/query building: back to query
  console.log("do a backnav thing");
}

type CustomCode = {
  [codeNum: string]: string;
};

/**
 * @param root0 props
 * @returns  the DropdownFilter component
 */
const AddValueSets: React.FC<AddValueSetsProps> = ({}) => {
  const [codes, setCodes] = useState<CustomCode[]>([{ "": "" }]);
  console.log(codes);
  const handleAddCode =
    (type: string) => (e: React.ChangeEvent<HTMLInputElement>) => {
      const input = e.target.value;

      console.log(type, input);
    };

  const renderAddCodeRow = () => {
    return Object.entries(codes).map(([idx, code]) => {
      console.log(idx, "code:", code);
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
              value={code.codeNum}
              placeholder={code.codeNum}
              onChange={handleAddCode("code")}
            />
          </div>
          <div className={styles.textInput}>
            <label htmlFor="code-name">Code name </label>
            <TextInput
              type="text"
              id={`code-name-${code}`}
              name="code-name"
              value={code.codeName}
              placeholder={code.codeName}
              onChange={handleAddCode("name")}
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

  return (
    <WithAuth>
      <div className={classNames("main-container__wide", styles.mainContainer)}>
        <Backlink onClick={goBack} label={"Return to Codes"} />
        <div className={styles.header}>
          <h1 className={styles.header__title}>New value set</h1>
          <Button type="button">Save value set</Button>
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
              <TextInput type="text" id="vsName" name="vsName" />
            </div>
            <div className={classNames(styles.section__input, styles.dropdown)}>
              <label htmlFor="category">Category (Required)</label>
              <Select
                id="category"
                className={styles.filtersSelect}
                name="Category"
                onChange={(e) => {
                  e.preventDefault();
                }}
                value={""}
              >
                {<option value=""></option>}
                {/* {valueSetCodeSystems.map((codeSystem) => {
                  return (
                    <option key={codeSystem} value={codeSystem}>
                      {formatSystem(codeSystem)}
                    </option>
                  );
                })} */}
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
                }}
                value={""}
              >
                {<option value=""></option>}
                {/* {valueSetCodeSystems.map((codeSystem) => {
                  return (
                    <option key={codeSystem} value={codeSystem}>
                      {formatSystem(codeSystem)}
                    </option>
                  );
                })} */}
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
              onClick={() => setCodes({ ...codes, ...{ "": "" } })}
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
