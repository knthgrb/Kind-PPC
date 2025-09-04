import { redirect } from "next/navigation";
import { getCompleteKindTaoProfile } from "@/services/profile/getCompleteKindTaoProfile";
import ProfileClient from "./_components/ProfileClient";

export default async function ProfilePage() {
  const profile = await getCompleteKindTaoProfile();

  if (!profile) {
    redirect("/login");
  }

  return <ProfileClient user={profile} />;
}
