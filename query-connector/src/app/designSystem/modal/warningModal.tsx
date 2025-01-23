import React, { RefObject } from "react";
import { Modal, ModalRef } from "@/app/designSystem/modal/Modal";

interface WarningModalProps {
  modalRef: RefObject<ModalRef>;
  heading: string;
  description: string;
  onSave: () => void;
  onCancel?: () => void;
  additionalProps?: Record<string, unknown>; // Additional props for extensibility
}

/**
 * WarningModal component with default Save and Undo buttons.
 * @param root0 - The WarningModal props object.
 * @param root0.modalRef - Reference to the modal component.
 * @param root0.heading - The heading/title text for the modal.
 * @param root0.description - The descriptive text explaining the modal's purpose.
 * @param root0.onSave - Callback function to execute when the save chages button is clicked.
 * @param root0.onCancel - Optional callback function to execute when the Cancel button is clicked.
 * @param root0.additionalProps - Optional additional props to pass to the Modal component, such as a custom ID.
 * @returns The JSX element for the WarningModal component.
 */
export const WarningModal: React.FC<WarningModalProps> = ({
  modalRef,
  heading,
  description,
  onSave,
  onCancel,
  additionalProps = {},
}) => {
  return (
    <Modal
      id="warning-confirmation-modal"
      modalRef={modalRef}
      heading={heading}
      description={description}
      buttons={[
        {
          text: "Save",
          type: "button",
          className: "usa-button--default",
          onClick: () => {
            onSave();
            modalRef.current?.toggleModal();
          },
        },
        {
          text: "Dismiss",
          type: "button",
          className: "usa-button--outline",
          onClick: () => {
            if (onCancel) onCancel();
            modalRef.current?.toggleModal();
          },
        },
      ]}
      {...additionalProps}
    />
  );
};

export default WarningModal;
