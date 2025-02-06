import React, { useEffect, useState } from "react";
import { Icon } from "@trussworks/react-uswds";
import styles from "./drawer.module.scss";
import SearchField from "../searchField/SearchField";
import classNames from "classnames";

type DrawerProps = {
  title: string | React.ReactNode;
  subtitle?: string;
  placeholder: string;
  toastMessage?: string;
  toRender: React.ReactNode;
  isOpen: boolean;
  onSave: () => void;
  onClose: () => void;
  onSearch?: (searchFilter: string) => void;
};

/**
 * Drawer component to review and refine changes to conditions or concepts.
 * @param root0 - props
 * @param root0.title - The title displayed in the drawer.
 * @param root0.subtitle - The drawer subtitle
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
  subtitle,
  placeholder,
  isOpen,
  onClose,
  toRender,
  onSearch,
}: DrawerProps) => {
  const [searchFilter, setSearchFilter] = useState("");

  useEffect(() => {
    // do this in a useEffect rather than in the JSX so that we can control
    // a drawer-specific search vs a filter passed in from the parent component
    if (onSearch) {
      onSearch(searchFilter);
    }
  }, [searchFilter]);

  function handleClose() {
    setSearchFilter("");
    onClose();
  }

  return (
    <>
      <div
        className={`${styles.drawer} ${isOpen ? styles.open : styles.closed}`}
        role="dialog"
        data-testid={`drawer-open-${isOpen}`}
      >
        <div
          className={classNames(
            styles.drawerContent,
            isOpen ? "display-block" : "display-none",
          )}
        >
          <div className={styles.drawerHeader}>
            <button
              className={styles.closeButton}
              onClick={handleClose}
              aria-label="Close drawer"
              data-testid={"close-drawer"}
            >
              <Icon.Close size={3} aria-label="X icon indicating closure" />
            </button>
            <h2 data-testid={`drawer-title`} className={`margin-0 padding-0`}>
              {title}
            </h2>
            {subtitle ? <h3 className={styles.subtitle}>{subtitle}</h3> : <></>}

            {onSearch && (
              <div>
                <SearchField
                  id="searchFieldTemplate"
                  placeholder={placeholder}
                  className={styles.searchField}
                  value={searchFilter}
                  onChange={(e) => {
                    e.preventDefault();
                    setSearchFilter(e.target.value);
                  }}
                />
              </div>
            )}
          </div>

          <div className="padding-top-2">{toRender}</div>
        </div>
      </div>

      {isOpen && <div className={styles.overlay} onClick={handleClose}></div>}
    </>
  );
};

export default Drawer;
