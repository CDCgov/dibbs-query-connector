import {
  Modal as TrussModal,
  ModalHeading,
  ModalFooter,
  Button,
  ButtonGroup,
  ModalRef as TrussModalRef,
} from "@trussworks/react-uswds";
import React, { RefObject, ReactNode } from "react";

export type ModalRef = TrussModalRef;

type ModalButton = {
  text: string;
  type: "button" | "submit" | "reset";
  className?: string; // Optional classes for styling
  onClick: () => void; // Action to perform when the button is clicked
};

type ModalProps = {
  id: string;
  heading: string;
  description?: string;
  children?: ReactNode;
  modalRef: RefObject<ModalRef>;
  buttons: ModalButton[]; // Dynamic buttons
};

/**
 * Modal wrapper around the Truss modal
 * @param param0 - props
 * @param param0.id - ID for labeling / referencing the various subcomponents in
 * the modal
 * @param param0.heading - Modal heading
 * @param param0.description - Modal body
 * @param param0.children - Optional children components to render in the modal body
 * @param param0.modalRef - ref object to connect the toggle button with the
 * actual modal.
 * @param param0.buttons - Array of button definitions for the modal footer.
 * @returns A customizable modal component
 */
export const Modal: React.FC<ModalProps> = ({
  id,
  heading,
  description,
  children,
  modalRef,
  buttons,
}) => {
  return (
    <TrussModal
      ref={modalRef}
      id={`${id}-modal`}
      aria-labelledby={`${id}-modal-heading`}
      aria-describedby={description ? `${id}-modal-description` : undefined}
    >
      <ModalHeading id={`${id}-modal-heading`}>{heading}</ModalHeading>
      <div className="usa-prose">
        {description ? (
          <p id={`${id}-modal-description`}>{description}</p>
        ) : (
          children
        )}
      </div>
      <ModalFooter>
        <ButtonGroup>
          {buttons.map((button, index) => (
            <Button
              key={index}
              type={button.type}
              className={button.className}
              onClick={button.onClick}
            >
              {button.text}
            </Button>
          ))}
        </ButtonGroup>
      </ModalFooter>
    </TrussModal>
  );
};
