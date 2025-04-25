const useSession = jest
  .fn()
  .mockReturnValue({ data: undefined, status: "loading" });

const signOut = jest.fn();
/**
 *
 * @param root0 - root0
 * @param root0.children - root0.children
 * @returns - JSX.Element
 */
const SessionProvider = ({ children }) => <>{children}</>;

export { useSession, signOut, SessionProvider };
