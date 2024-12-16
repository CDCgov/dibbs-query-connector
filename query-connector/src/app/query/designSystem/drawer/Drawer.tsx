import React from "react";
import { Button, Icon } from "@trussworks/react-uswds";
import styles from "./drawer.module.css";
import SearchField from "../searchField/SearchField";
import { showToastConfirmation } from "../toast/Toast";

type DrawerProps = {
  title: string;
  placeholder: string;
  toastMessage?: string;
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
 * @param root0.toastMessage - Optional message to show in a toast when the drawer closes.
 * @param root0.codes - The dynamic content to display as codes.
 * @param root0.isOpen - Boolean to control the visibility of the drawer.
 * @param root0.onClose - Function to handle closing the drawer.
 * @returns The Drawer component.
 */
export const Drawer: React.FC<DrawerProps> = ({
  title,
  placeholder,
  toastMessage,
  codes,
  isOpen,
  onClose,
}) => {
  const handleClose = () => {
    if (toastMessage) {
      showToastConfirmation({
        body: toastMessage,
        variant: "success",
      });
    }
    onClose();
  };

  return (
    <>
      <div
        className={`${styles.drawer} ${isOpen ? styles.open : styles.closed}`}
        aria-hidden={!isOpen}
        role="dialog"
      >
        <div className={styles.drawerContent}>
          <button
            className={styles.closeButton}
            onClick={handleClose}
            aria-label="Close drawer"
          >
            <Icon.Close size={3} />
          </button>
          <h2 className="margin-0 padding-bottom-2">{title}</h2>
          <Button type="button" onClick={handleClose}>
            Save changes
          </Button>
          <div className="padding-top-5">
            <div>
              <SearchField
                id="searchFieldTemplate"
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

      {isOpen && <div className={styles.overlay} onClick={handleClose}></div>}
    </>
  );
};

export default Drawer;
