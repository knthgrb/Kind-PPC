import { fetchUserProfile } from "@/services/profile/fetchUserProfile";
import PostJobClient from "./_components/PostJobClient";
import { FamilyProfileService } from "@/services/FamilyProfileService";
import { redirect } from "next/navigation";

export default async function PostJobPage() {
  const profileData = await fetchUserProfile();
  if (!profileData) redirect("/login");

  const familyId = await FamilyProfileService.fetchFamilyIdByUserId(
    profileData.id
  );
  if (!familyId) redirect("/login");

  return <PostJobClient familyId={familyId} />;
}
