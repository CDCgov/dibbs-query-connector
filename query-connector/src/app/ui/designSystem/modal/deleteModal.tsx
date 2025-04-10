import React, { RefObject } from "react";
import { Modal, ModalRef } from "@/app/ui/designSystem/modal/Modal";

interface DeleteModalProps {
  modalRef: RefObject<ModalRef>;
  heading: string;
  description: string;
  onDelete: () => void;
  onCancel?: () => void;
  additionalProps?: Record<string, unknown>; // Additional props for extensibility
}

/**
 * DeleteModal component with default Delete and Cancel buttons.
 * @param root0 - The DeleteModal props object.
 * @param root0.modalRef - Reference to the modal component.
 * @param root0.heading - The heading/title text for the modal.
 * @param root0.description - The descriptive text explaining the modal's purpose.
 * @param root0.onDelete - Callback function to execute when the Delete button is clicked.
 * @param root0.onCancel - Optional callback function to execute when the Cancel button is clicked.
 * @param root0.additionalProps - Optional additional props to pass to the Modal component, such as a custom ID.
 * @returns The JSX element for the DeleteModal component.
 */
export const DeleteModal: React.FC<DeleteModalProps> = ({
  modalRef,
  heading,
  description,
  onDelete,
  onCancel,
  additionalProps = {},
}) => {
  return (
    <Modal
      id="delete-confirmation-modal"
      modalRef={modalRef}
      heading={heading}
      description={description}
      buttons={[
        {
          id: "modal-delete-button",
          text: "Delete",
          type: "button",
          className: "usa-button--secondary",
          onClick: () => {
            onDelete();
            modalRef.current?.toggleModal();
          },
        },
        {
          id: "modal-cancel-button",
          text: "Cancel",
          type: "button",
          className: "usa-button--outline shadow-none",
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

export default DeleteModal;
