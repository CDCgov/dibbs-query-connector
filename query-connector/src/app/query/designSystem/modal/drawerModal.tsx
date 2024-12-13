import React, { useState, useRef } from "react";
import { Button } from "@trussworks/react-uswds";
import { Modal, ModalRef } from "./Modal";
import styles from "./modal.module.css";

/**
 * Drawer component that uses a modal to display a side drawer.
 * This component includes a toggle button to open and close the drawer
 * and displays customizable content inside the drawer.
 * @returns The Drawer component.
 */
const Drawer: React.FC = () => {
  const [isOpen, setIsOpen] = useState(false);
  const drawerRef = useRef<ModalRef>(null);

  const toggleDrawer = () => {
    drawerRef.current?.toggleModal();
    setIsOpen((prev) => !prev);
  };

  return (
    <div>
      <Button type="button" unstyled onClick={toggleDrawer}>
        View Codes
      </Button>

      <Modal
        id="drawer"
        className={styles["drawer-modal"]}
        heading="Drawer Title"
        description="Codes"
        modalRef={drawerRef}
        buttons={[
          {
            text: "Save changes",
            type: "button",
            onClick: toggleDrawer,
          },
        ]}
      ></Modal>
    </div>
  );
};

export default Drawer;
