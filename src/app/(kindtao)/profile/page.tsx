import { redirect } from "next/navigation";
import { ProfileService } from "@/services/ProfileService";
import ProfileClient from "./_components/ProfileClient";

export default async function ProfilePage() {
  const profile = await ProfileService.getCompleteKindTaoProfile();

  if (!profile) {
    redirect("/login");
  }

  return <ProfileClient user={profile} />;
}
