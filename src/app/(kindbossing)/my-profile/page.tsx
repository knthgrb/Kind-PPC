import { redirect } from "next/navigation";
import { fetchUserProfile } from "@/services/profile/fetchUserProfile";
import { fetchPaginatedKindBossingPosts } from "@/services/jobs/(kindBossing)/fetchPaginatedKindBossingPosts";
import MyProfileClient from "./_components/MyProfileClient";
import { fetchFamilyIdByUserId } from "@/services/family/fetchFamilyProfile";

export default async function MyProfilePage({
  searchParams,
}: {
  searchParams: { page?: string };
}) {
  const profileData = await fetchUserProfile();
  if (!profileData) redirect("/login");

  const familyId = await fetchFamilyIdByUserId(profileData.id);
  if (!familyId) redirect("/login");

  const page = Number(searchParams?.page) || 1;
  const pageSize = 8;

  const { jobs, total } = await fetchPaginatedKindBossingPosts(
    profileData.id,
    page,
    pageSize
  );

  return (
    <MyProfileClient
      user={profileData}
      familyId={familyId}
      postedJobs={jobs}
      page={page}
      totalPages={Math.ceil(total / pageSize)}
    />
  );
}
