import React from "react";
import { Icon } from "@trussworks/react-uswds";
import styles from "./drawer.module.scss";
import SearchField from "../searchField/SearchField";

type DrawerProps = {
  title: string;
  placeholder: string;
  toastMessage?: string;
  toRender: React.ReactNode;
  isOpen: boolean;
  onSave: () => void;
  onClose: () => void;
  onSearch?: () => void;
};

/**
 * Drawer component to review and refine changes to conditions or concepts.
 * @param root0 - props
 * @param root0.title - The title displayed in the drawer.
 * @param root0.placeholder - The placeholder text for the search field.
 * @param root0.onClose - Function to handle closing the drawer.
 * @param root0.onSearch - Function to handle search actions in the drawer.
 * @param root0.isOpen - Boolean to control the visibility of the drawer.
 * @param root0.toRender - The dynamic content to display.
 * warning modal appears before saving
 * @returns The Drawer component.
 */
const Drawer: React.FC<DrawerProps> = ({
  title,
  placeholder,
  isOpen,
  onClose,
  toRender,
  onSearch,
}: DrawerProps) => {
  const handleClose = () => {
    onClose();
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
            onClick={onClose}
            aria-label="Close drawer"
          >
            <Icon.Close size={3} aria-label="X icon indicating closure" />
          </button>
          <h2 className="margin-0 padding-bottom-2">{title}</h2>

          {onSearch && (
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
          )}
          <div className="padding-top-2">{toRender}</div>
        </div>
      </div>

      {isOpen && <div className={styles.overlay} onClick={handleClose}></div>}
    </>
  );
};

export default Drawer;
