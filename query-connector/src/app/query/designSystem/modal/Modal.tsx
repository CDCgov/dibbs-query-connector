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
  text: string | JSX.Element;
  type: "button" | "submit" | "reset";
  id?: string; // Optional ID for the button
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
  isLarge?: boolean;
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
 * @param param0.isLarge - Optional prop to make the modal large
 * @returns A customizable modal component
 */
export const Modal: React.FC<ModalProps> = ({
  id,
  heading,
  description,
  children,
  modalRef,
  buttons,
  isLarge,
}) => {
  return (
    <TrussModal
      ref={modalRef}
      id={`${id}-modal`}
      aria-labelledby={`${id}-modal-heading`}
      aria-describedby={`${id}-modal-description`}
      isLarge={isLarge}
    >
      <ModalHeading id={`${id}-modal-heading`}>{heading}</ModalHeading>
      <div id={`${id}-modal-description`} className="usa-prose">
        {description ? (
          <p>{description}</p>
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
              id={button.id}
              className={button.className}
              onClick={button.onClick}
            >
              {button.text}
            </Button>
          ))}
        </ButtonGroup>
      </ModalFooter>
    </TrussModal >
  );
};
