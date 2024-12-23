import React, { useState, useRef, useEffect, useMemo } from "react";
import { Button, Icon } from "@trussworks/react-uswds";
import styles from "./drawer.module.css";
import SearchField from "../searchField/SearchField";
import { showToastConfirmation } from "../toast/Toast";
import WarningModal from "../modal/warningModal";
import { ModalRef } from "../modal/Modal";

type DrawerProps = {
  title: string;
  placeholder: string;
  toastMessage?: string;
  toRender: React.ReactNode;
  isOpen: boolean;
  onSave: () => void;
  onClose: () => void;
  renderData: any;
};

/**
 * Drawer component to review and refine changes to conditions or concepts.
 * @param root0 - props
 * @param root0.title - The title displayed in the drawer.
 * @param root0.placeholder - The placeholder text for the search field.
 * @param root0.toastMessage - Optional message to show in a toast when the drawer closes.
 * @param root0.isOpen - Boolean to control the visibility of the drawer.
 * @param root0.onClose - Function to handle closing the drawer.
 * @param root0.initialState - The initial state to compare changes.
 * @param root0.currentState - The current state to check for changes.
 * @param root0.onSave - Callback when the "Save Changes" button is clicked.`
 * @param root0.toRender - The dynamic content to display.
 * @returns The Drawer component.
 */
const Drawer: React.FC<DrawerProps> = ({
  title,
  placeholder,
  toastMessage,
  isOpen,
  onClose,
  onSave,
  toRender,
  renderData,
}: DrawerProps) => {
  const [data] = useState(renderData);

  const hasChanges = useMemo(() => {
    return renderData !== data;
  }, [renderData, data]);

  const modalRef = useRef<ModalRef>(null);

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
    if (hasChanges) {
      modalRef.current?.toggleModal();
    } else {
      onClose();
    }
  };

  return (
    <>
      <div
        className={`${styles.drawer} ${isOpen ? styles.open : styles.closed}`}
        role="dialog"
      >
        <div className={styles.drawerContent}>
          <button
            className={styles.closeButton}
            onClick={handleClose}
            aria-label="Close drawer"
          >
            <Icon.Close size={3} aria-label="X icon indicating closure" />
          </button>
          <h2 className="margin-0 padding-bottom-2">{title}</h2>
          {hasChanges !== undefined && (
            <Button
              type="button"
              onClick={handleSaveChanges}
              disabled={!hasChanges}
            >
              Save changes
            </Button>
          )}
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
          <div className="padding-top-2">{toRender}</div>
        </div>
      </div>

      {isOpen && <div className={styles.overlay} onClick={handleClose}></div>}

      {hasChanges !== undefined && (
        <WarningModal
          modalRef={modalRef}
          heading="Unsaved Changes"
          description="You have unsaved changes. Do you want to dismiss them?"
          onSave={handleSaveChanges}
          onCancel={onClose}
        />
      )}
    </>
  );
};

export default Drawer;
