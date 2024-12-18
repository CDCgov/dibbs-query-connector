import React, { useEffect, useState } from "react";
import { Button, Icon } from "@trussworks/react-uswds";
import styles from "./drawer.module.css";
import SearchField from "../searchField/SearchField";
import { showToastConfirmation } from "../toast/Toast";

type DrawerProps<T> = {
  title: string;
  placeholder: string;
  toastMessage?: string;
  codes: React.ReactNode;
  isOpen: boolean;
  onClose: () => void;
  initialState: T;
  currentState: T;
  onSave: () => void;
};

/**
 * Drawer component to review and refine changes to conditions or concepts.
 * @param root0 - props
 * @param root0.title - The title displayed in the drawer.
 * @param root0.placeholder - The placeholder text for the search field.
 * @param root0.toastMessage - Optional message to show in a toast when the drawer closes.
 * @param root0.codes - The dynamic content to display.
 * @param root0.isOpen - Boolean to control the visibility of the drawer.
 * @param root0.onClose - Function to handle closing the drawer.
 * @param root0.initialState - The initial state to compare changes.
 * @param root0.currentState - The current state to check for changes.
 * @param root0.onSave - Callback when the "Save Changes" button is clicked.`
 * @returns The Drawer component.
 */
const Drawer = <T,>({
  title,
  placeholder,
  toastMessage,
  codes,
  isOpen,
  onClose,
  initialState,
  currentState,
  onSave,
}: DrawerProps<T>) => {
  const [hasChanges, setHasChanges] = useState(false);

  // Compare initialState and currentState
  useEffect(() => {
    const deepEqual = (obj1: T, obj2: T): boolean => {
      return JSON.stringify(obj1) === JSON.stringify(obj2);
    };

    const statesAreEqual = deepEqual(initialState, currentState);
    setHasChanges(!statesAreEqual);
  }, [initialState, currentState]);

  const handleSaveChanges = () => {
    onSave();
    if (toastMessage) {
      showToastConfirmation({
        body: toastMessage,
        variant: "success",
      });
    }
    onClose();
  };

  const handleClose = () => {
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
          <Button
            type="button"
            onClick={handleSaveChanges}
            disabled={!hasChanges}
          >
            Save changes
          </Button>
          <div className="padding-top-5">
            <SearchField
              id="searchFieldTemplate"
              placeholder={placeholder}
              className={styles.searchField}
              onChange={(e) => {
                e.preventDefault();
              }}
            />
          </div>
          <div className="padding-top-2">{codes}</div>
        </div>
      </div>

      {isOpen && <div className={styles.overlay} onClick={handleClose}></div>}
    </>
  );
};

export default Drawer;
