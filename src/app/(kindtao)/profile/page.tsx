import { redirect } from "next/navigation";
import { ProfileService } from "@/services/ProfileService";
import { getServerActionContext } from "@/utils/server-action-context";
import ProfileClient from "./_components/ProfileClient";

export default async function ProfilePage() {
  const { convex, user, error } = await getServerActionContext({
    requireUser: true,
  });

  if (error || !user || !convex) {
    redirect("/login");
  }

  const userId =
    (user as { userId?: string | null })?.userId ??
    (user as { id?: string | null })?.id ??
    (user as { _id?: string | null })?._id ??
    null;

  if (!userId) {
    redirect("/login");
  }

  const profile = await ProfileService.getCompleteKindTaoProfile(convex, userId);

  if (!profile) {
    redirect("/login");
  }

  return <ProfileClient user={profile} />;
}
