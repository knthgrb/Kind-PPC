import Stepper from "@/components/Stepper";
import WorkEnvironmentForm from "./_components/WorkEnvironmentForm";
import { redirect } from "next/navigation";
import { createClient } from "@/utils/supabase/server";
import { FamilyProfileService } from "@/services/FamilyProfileService";

export default async function WorkEnvironmentPage() {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) redirect("/login");

  const progress = await FamilyProfileService.checkFamilyOnboardingProgress(
    user.id
  );
  if (progress.isComplete) redirect("/kindbossing-dashboard");

  // Allow access if household-info is complete OR if user is trying to go back
  // Only redirect forward if they haven't completed household-info yet
  if (!progress.completedStages?.includes("household-info")) {
    redirect("/family-profile/household-info");
  }

  // Fetch existing family profile data on the server
  const { data: existingProfile, error: profileError } =
    await FamilyProfileService.getFamilyProfile(user.id);

  // Prepare initial form data
  const initialFormData = {
    household_description: existingProfile?.household_description || "",
    work_environment_description:
      existingProfile?.work_environment_description || "",
    special_requirements: existingProfile?.special_requirements || "",
  };

  return (
    <main className="min-h-screen px-4 flex items-start justify-center">
      <section className="w-full max-w-3xl rounded-2xl border border-[#DFDFDF] shadow-sm p-6 md:p-8 mt-8 bg-white">
        <Stepper steps={3} activeStep={2} />
        <br />
        <h1 className="mb-6 stepsH1">Work Environment</h1>

        <WorkEnvironmentForm initialData={initialFormData} />
      </section>
    </main>
  );
}
