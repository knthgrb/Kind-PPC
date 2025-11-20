import { createAuth } from "../../convex/auth";
import { getToken as getTokenNextjs } from "@convex-dev/better-auth/nextjs";

export const getToken = () => {
  return getTokenNextjs(createAuth);
};

// Export createAuth for use in route handlers
export { createAuth };
