import { redirect } from "next/navigation";
import { getBossingProfile } from "@/services/profile/kindBossing/getKindBossingProfile";
import MyProfileClient from "./_components/MyProfileClient";
import { fetchUserWithJobs } from "@/services/jobs/(kindBossing)/fetchUserWithJobs";

export default async function MyProfilePage() {
  const profileData = await getBossingProfile();

  if (!profileData || !profileData.profile) {
    redirect("/login");
  }

  const data = await fetchUserWithJobs();

  const user = profileData.profile;
  const postedJobs = data?.jobs ?? [];

  return <MyProfileClient user={user} postedJobs={postedJobs} />;
}
