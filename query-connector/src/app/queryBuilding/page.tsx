"use client";
import UserQueriesDisplay from "./dataState/UserQueriesDisplay";
import EmptyQueriesDisplay from "./emptyState/EmptyQueriesDisplay";
import { CustomUserQuery } from "@/app/query-building";
import styles from "@/app/queryBuilding/queryBuilding.module.scss";

/**
 * Component for Query Building Flow
 * @returns The Query Building component flow
 */
const QueryBuilding: React.FC = () => {
  // Example data
  const queries: CustomUserQuery[] = [
    {
      query_name:
        "SNHD: Custom Query with an overly elaborate long name to truncate",
      query_id: "A125",
      valuesets: [
        {
          valueSetId: "VS123",
          valueSetVersion: "1.0",
          valueSetName: "Chlamydia Value Set",
          author: "Author Name",
          system: "System Name",
          ersdConceptType: "ostc",
          dibbsConceptType: "labs",
          includeValueSet: true,
          concepts: [
            { code: "12345", display: "Chlamydia", include: true },
            { code: "67890", display: "HIV", include: false },
          ],
        },
      ],
    },
    {
      query_name: "SNHD: Custom Query 2",
      query_id: "A123901849080294819428013284019 =-4190-6",
      valuesets: [
        {
          valueSetId: "VS456",
          valueSetVersion: "2.0",
          valueSetName: "Cancer Value Set",
          author: "Another Author",
          system: "Another System",
          ersdConceptType: "dxtc",
          dibbsConceptType: "conditions",
          includeValueSet: false,
          concepts: [
            { code: "11111", display: "Cancer 1", include: true },
            { code: "22222", display: "Cancer 2", include: true },
          ],
        },
      ],
    },
  ];
  // const [queries, setQueries] = useState<CustomUserQuery[]>([]);
  // const [loading, setLoading] = useState(true);

  // useEffect(() => {
  //   const fetchQueries = async () => {
  //     try {
  //       const data = await getCustomQueries();
  //       setQueries(data);
  //     } catch (error) {
  //       console.error("Failed to fetch queries:", error);
  //     } finally {
  //       setLoading(false);
  //     }
  //   };

  //   fetchQueries();
  // }, []);

  // if (loading) {
  //   return <div>Loading...</div>;
  // }

  return (
    <>
      {queries.length === 0 ? (
        <div className="main-container">
          <h1 className={styles.queryTitle}>My queries</h1>
          <EmptyQueriesDisplay />
        </div>
      ) : (
        <div className="main-container__wide">
          <UserQueriesDisplay queries={queries} />
        </div>
      )}
    </>
  );
};

export default QueryBuilding;
