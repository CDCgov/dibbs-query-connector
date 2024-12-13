import {
  Modal as TrussModal,
  ModalHeading,
  ModalFooter,
  Button,
  ButtonGroup,
  ModalRef as TrussModalRef,
} from "@trussworks/react-uswds";
import React, { RefObject } from "react";

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
  description: string;
  modalRef: RefObject<ModalRef>;
  buttons: ModalButton[]; // Dynamic buttons
  children?: React.ReactNode;
  className?: string;
};

/**
 * Modal wrapper around the Truss modal
 * @param param0 - props
 * @param param0.id - ID for labeling / referencing the various subcomponents in
 * the modal
 * @param param0.heading - Modal heading
 * @param param0.description - Modal body
 * @param param0.modalRef - ref object to connect the toggle button with the
 * actual modal.
 * @param param0.buttons - Array of button definitions for the modal footer.
 * @param param0.className - Optional classes for styling
 * @returns A customizable modal component
 */
export const Modal: React.FC<ModalProps> = ({
  id,
  heading,
  description,
  modalRef,
  buttons,
  className,
}) => {
  return (
    <TrussModal
      ref={modalRef}
      id={`${id}-modal`}
      className={className}
      aria-labelledby={`${id}-modal-heading`}
      aria-describedby={`${id}-modal-description`}
    >
      <ModalHeading id={`${id}-modal-heading`}>{heading}</ModalHeading>
      <div className="usa-prose">
        <p id={`${id}-modal-description`}>{description}</p>
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
