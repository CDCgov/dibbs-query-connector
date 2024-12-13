import React from "react";
import { Button } from "@trussworks/react-uswds";
import styles from "./drawer.module.css";
import SearchField from "../searchField/SearchField";

type DrawerProps = {
  title: string;
  placeholder: string;
  codes: React.ReactNode;
  isOpen: boolean;
  onClose: () => void;
};

/**
 * Drawer component to review and refine changes to conditions or concepts.
 * This component includes a toggle button to open and close the drawer
 * and displays customizable content inside the drawer.
 * @param root0 - props
 * @param root0.title - The title displayed in the drawer.
 * @param root0.placeholder - The placeholder text for the search field.
 * @param root0.codes - The dynamic content to display as codes.
 * @param root0.isOpen - Boolean to control the visibility of the drawer.
 * @param root0.onClose - Function to handle closing the drawer.
 * @returns The Drawer component.
 */
export const Drawer: React.FC<DrawerProps> = ({
  title,
  placeholder,
  codes,
  isOpen,
  onClose,
}) => {
  return (
    <>
      <div
        className={`${styles.drawer} ${isOpen ? styles.open : styles.closed}`}
        aria-hidden={!isOpen}
        role="dialog"
      >
        <div className={styles.drawerContent}>
          <h2 className="margin-0 padding-bottom-2">{title}</h2>
          <Button type="button" onClick={onClose}>
            Save changes
          </Button>
          <div className="padding-top-5">
            <div className="bg-white">
              <SearchField
                id="valueSetTemplateSearch"
                placeholder={placeholder}
                className={styles.searchField}
                onChange={(e) => {
                  e.preventDefault();
                }}
              />
            </div>
          </div>
          <div className="padding-top-2">{codes}</div>
        </div>
      </div>

      {isOpen && <div className={styles.overlay} onClick={onClose}></div>}
    </>
  );
};

export default Drawer;
