import Stepper from "@/components/Stepper";
import PreferencesForm from "./_components/PreferencesForm";
import { redirect } from "next/navigation";
import { createClient } from "@/utils/supabase/server";
import { FamilyProfileService } from "@/services/FamilyProfileService";

export default async function PreferencesPage() {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) redirect("/login");

  const progress = await FamilyProfileService.checkFamilyOnboardingProgress(
    user.id
  );
  if (progress.isComplete) redirect("/kindbossing-dashboard");

  // Allow access if previous steps are complete OR if user is trying to go back
  // Only redirect forward if they haven't completed required previous steps
  if (!progress.completedStages?.includes("household-info")) {
    redirect("/family-profile/household-info");
  }
  if (!progress.completedStages?.includes("work-environment")) {
    redirect("/family-profile/work-environment");
  }

  // Fetch existing family profile data on the server
  const { data: existingProfile, error: profileError } =
    await FamilyProfileService.getFamilyProfile(user.id);

  // Prepare initial form data
  const initialFormData = {
    preferredLanguages: existingProfile?.preferred_languages || [
      "English",
      "Filipino",
    ],
  };

  return (
    <main className="min-h-screen px-4 flex items-start justify-center">
      <section className="w-full max-w-3xl rounded-2xl border border-[#DFDFDF] shadow-sm p-6 md:p-8 mt-8 bg-white">
        <Stepper steps={3} activeStep={3} />
        <br />
        <h1 className="mb-6 stepsH1">Preferences</h1>

        <PreferencesForm initialData={initialFormData} />
      </section>
    </main>
  );
}
