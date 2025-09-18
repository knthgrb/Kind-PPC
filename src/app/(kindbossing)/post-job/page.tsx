import { ProfileService } from "@/services/ProfileService";
import PostJobClient from "./_components/PostJobClient";
import { FamilyService } from "@/services/client/FamilyService";
import { redirect } from "next/navigation";

export default async function PostJobPage() {
  const profileData = await ProfileService.fetchUserProfile();
  if (!profileData) redirect("/login");

  const familyId = await FamilyService.fetchFamilyIdByUserId(profileData.id);
  if (!familyId) redirect("/login");

  return <PostJobClient familyId={familyId} />;
}
