import Skeleton from "react-loading-skeleton";

interface LoadingRowProps {
  numCells: number;
}

/**
 * Loading placeholder
 * @param param0 - param
 * @param param0.numCells - number of cells to generate in the row
 * @returns a loading placeholder
 */
export const LoadingRow: React.FC<LoadingRowProps> = ({ numCells }) => {
  return (
    <tr>
      {[...Array(numCells).keys()].map((i) => {
        return (
          <td className="no-border" key={i}>
            <Skeleton />
          </td>
        );
      })}
    </tr>
  );
};

export default LoadingRow;
