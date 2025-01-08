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
 * @param id - The id of the modal.
 * @param heading - The heading of the modal.
 * @param description - The description of the modal.
 * @param children - The children of the modal.
 * @param modalRef - The ref of the modal.
 * @param buttons - The buttons to display in the footer.
 * @param isLarge - Whether the modal is large.
 * @param errorMessage - The error message to display in the footer.
 * @returns - The Modal component.
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
