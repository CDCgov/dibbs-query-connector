import React, { useState } from "react";
import { Button } from "@trussworks/react-uswds";
import styles from "./drawer.module.css";
import SearchField from "../searchField/SearchField";
import searchStyles from "src/app/queryBuilding/buildFromTemplates/buildfromTemplate.module.scss";

/**
 * Drawer component to review and refine changes to conditions or concepts.
 * This component includes a toggle button to open and close the drawer
 * and displays customizable content inside the drawer.
 * @returns The Drawer component.
 */
export const Drawer: React.FC = () => {
  const [isOpen, setIsOpen] = useState(false);
  const [_searchFilter, setSearchFilter] = useState<string>();

  const toggleDrawer = () => {
    setIsOpen((prev) => !prev);
  };

  return (
    <>
      <Button type="button" unstyled onClick={toggleDrawer}>
        View Codes
      </Button>

      <div
        className={`${styles.drawer} ${isOpen ? styles.open : styles.closed}`}
        aria-hidden={!isOpen}
        role="dialog"
      >
        <div className={styles.drawerContent}>
          <h2 className="margin-0 padding-bottom-2">Drawer Title</h2>
          <Button type="button" onClick={toggleDrawer}>
            Save changes
          </Button>
          <div className={searchStyles.valueSetTemplate__right}>
            <div className={searchStyles.valueSetTemplate__search}>
              <SearchField
                id="valueSetTemplateSearch"
                placeholder="Search labs, medications, conditions"
                className={searchStyles.valueSetSearch}
                onChange={(e) => {
                  e.preventDefault();
                  setSearchFilter(e.target.value);
                }}
              />
            </div>
          </div>
          <div className="padding-top-5">Here are some codes:</div>
          <ul>
            <li>Code 1</li>
            <li>Code 2</li>
            <li>Code 3</li>
          </ul>
        </div>
      </div>

      {isOpen && <div className={styles.overlay} onClick={toggleDrawer}></div>}
    </>
  );
};

export default Drawer;
