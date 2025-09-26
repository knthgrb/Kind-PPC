import Stepper from "@/components/Stepper";
import WorkEnvironmentForm from "./_components/WorkEnvironmentForm";
import { redirect } from "next/navigation";
import { createClient } from "@/utils/supabase/server";
import { FamilyOnboardingService } from "@/services/client/FamilyOnboardingService";
import { FamilyService } from "@/services/client/FamilyService";

export default async function WorkEnvironmentPage() {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  // Fetch existing family profile data on the server
  const { data: existingProfile, error: profileError } =
    await FamilyService.getFamilyProfile(user?.id || "");

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
