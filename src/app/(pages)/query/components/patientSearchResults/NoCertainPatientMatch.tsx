/**
 * NoCertainPatientMatch component.
 * @returns - The NoCertainPatientMatch component.
 */
const NoCertainPatientMatch = () => {
  return (
    <>
      <h2 className="font-sans-xl text-bold margin-top-205">
        No Certain Match Found
      </h2>
      <p className="font-sans-lg text-light margin-top-0 margin-bottom-205">
        The matching operation found one or more possible matches, but did not
        find a certain match.
      </p>
    </>
  );
};

export default NoCertainPatientMatch;
