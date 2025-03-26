const useSession = jest
  .fn()
  .mockReturnValue({ data: undefined, status: "loading" });

const signOut = jest.fn();
/**
 *
 * @param root0
 * @param root0.children
 */
const SessionProvider = ({ children }) => <>{children}</>;

export { useSession, signOut, SessionProvider };
