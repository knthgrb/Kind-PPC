import Stepper from "@/components/Stepper";
import HouseholdInfoForm from "./_components/HouseholdInfoForm";
import { redirect } from "next/navigation";
import { createClient } from "@/utils/supabase/server";
import { FamilyProfileService } from "@/services/FamilyProfileService";
import { FamilyProfile } from "@/types/familyProfile";

export default async function HouseholdInfoPage() {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) redirect("/login");

  const progress = await FamilyProfileService.checkFamilyOnboardingProgress(
    user.id
  );
  if (progress.isComplete) redirect("/kindbossing-dashboard");

  // Fetch existing family profile data on the server
  const { data: existingProfile, error: profileError } =
    await FamilyProfileService.getFamilyProfile(user.id);

  // Prepare initial form data
  const initialFormData = {
    household_size: existingProfile?.household_size || 0,
    children_count: existingProfile?.children_count || 0,
    children_ages: Array.isArray(existingProfile?.children_ages)
      ? existingProfile.children_ages.map((age: any) =>
          typeof age === "string" ? parseInt(age) : age
        )
      : [],
    elderly_count: existingProfile?.elderly_count || 0,
    pets_count: existingProfile?.pets_count || 0,
    pet_types: existingProfile?.pet_types || [],
  };

  return (
    <main className="min-h-screen px-4 flex items-start justify-center">
      <section className="w-full max-w-3xl rounded-2xl border border-[#DFDFDF] shadow-sm p-6 md:p-8 mt-8 bg-white">
        <Stepper steps={3} activeStep={1} />
        <br />
        <h1 className="mb-6 stepsH1">Household Information</h1>

        <HouseholdInfoForm initialData={initialFormData} />
      </section>
    </main>
  );
}
