import { redirect } from "next/navigation";
import { ProfileService } from "@/services/ProfileService";
import { JobService } from "@/services/JobService";
import MyProfileClient from "./_components/MyProfileClient";
import { FamilyProfileService } from "@/services/client/FamilyOnboardingService";

export default async function MyProfilePage({
  searchParams,
}: {
  searchParams: { page?: string };
}) {
  const profileData = await ProfileService.fetchUserProfile();
  if (!profileData) redirect("/login");

  const { data: familyProfile } = await FamilyProfileService.getFamilyProfile(
    profileData.id
  );
  if (!familyProfile) redirect("/login");

  const page = Number(searchParams?.page) || 1;
  const pageSize = 8;

  const { jobs, total } = await JobService.fetchPaginatedKindBossingPosts(
    profileData.id,
    page,
    pageSize
  );

  return (
    <MyProfileClient
      user={profileData}
      familyId={familyProfile.id}
      postedJobs={jobs}
      page={page}
      totalPages={Math.ceil(total / pageSize)}
    />
  );
}
