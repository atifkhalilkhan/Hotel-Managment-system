/* Shared auth context object used by the provider and its consumer hook. */
import { createContext } from "react";

const AuthContext = createContext(null);
export default AuthContext;
