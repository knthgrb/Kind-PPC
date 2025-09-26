import { ProfileService } from "@/services/ProfileService";
import PostJobClient from "./_components/PostJobClient";
import { redirect } from "next/navigation";

export default async function PostJobPage() {
  const profileData = await ProfileService.fetchUserProfile();
  if (!profileData) redirect("/login");

  return <PostJobClient familyId={profileData.id} />;
}
