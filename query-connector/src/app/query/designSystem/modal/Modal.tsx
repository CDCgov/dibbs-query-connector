import {
  Modal as TrussModal,
  ModalHeading,
  ModalFooter,
  Button,
  ButtonGroup,
  ModalRef as TrussModalRef,
  Icon,
} from "@trussworks/react-uswds";
import React, { RefObject, ReactNode } from "react";

export type ModalRef = TrussModalRef;

type ModalButton = {
  text: string | JSX.Element;
  type: "button" | "submit" | "reset";
  id?: string;
  className?: string;
  onClick: () => void;
};

type ModalProps = {
  id: string;
  heading: string;
  description?: string;
  children?: ReactNode;
  modalRef: RefObject<ModalRef>;
  buttons: ModalButton[];
  isLarge?: boolean;
  errorMessage?: string | null; // New prop for error message
};

/**
 * Modal component that wraps the Truss Modal component and adds a footer with buttons.
 * @param props - The props of the modal.
 * @param props.id - The id of the modal.
 * @param props.heading - The heading of the modal.
 * @param props.description - The description of the modal.
 * @param props.children - The children of the modal.
 * @param props.modalRef - The ref of the modal.
 * @param props.buttons - The buttons to display in the footer.
 * @param props.isLarge - Whether the modal is large.
 * @param props.errorMessage - The error message to display in the footer.
 * @returns - A customizable modal component
 */
export const Modal: React.FC<ModalProps> = ({
  id,
  heading,
  description,
  children,
  modalRef,
  buttons,
  isLarge,
  errorMessage,
}) => {
  return (
    <TrussModal
      ref={modalRef}
      id={`${id}-modal`}
      aria-labelledby={`${id}-modal-heading`}
      aria-describedby={`${id}-modal-description`}
      isLarge={isLarge}
      className="padding-x-2"
    >
      <ModalHeading id={`${id}-modal-heading`}>{heading}</ModalHeading>
      <div id={`${id}-modal-description`} className="usa-prose">
        {description ? <p>{description}</p> : children}
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
        {errorMessage && (
          <>
            <hr className="usa-divider margin-y-3" />
            <div className="margin-top-4 text-red display-flex">
              <Icon.Close
                size={3}
                className="usa-icon"
                aria-label="Error"
                color="#D54309"
              />
              {errorMessage}
            </div>
          </>
        )}
      </ModalFooter>
    </TrussModal>
  );
};
