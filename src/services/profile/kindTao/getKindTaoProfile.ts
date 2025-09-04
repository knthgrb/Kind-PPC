import { fetchUserProfile } from "../fetchUserProfile";
import { fetchHelperDetails } from "./fetchHelperDetails";

export async function getTaoProfile() {
  const base = await fetchUserProfile();
  if (!base) return null;

  const helperDetails = await fetchHelperDetails(base.id);

  return { profile: base, helperDetails };
}
