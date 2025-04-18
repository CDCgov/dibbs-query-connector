import React, { useEffect } from "react";

/**
 * Displays a message when no patients are found.
 * @returns - The NoPatientsFound component.
 */
const NoPatientsFound: React.FC = () => {
  useEffect(() => {
    window.scrollTo(0, 0);
  }, []);
  return (
    <>
      <h2 className="font-sans-xl text-bold margin-top-205">
        No Records Found
      </h2>
      <p className="font-sans-lg text-light margin-top-0 margin-bottom-205">
        No records were found for your search
      </p>
    </>
  );
};

export default NoPatientsFound;
