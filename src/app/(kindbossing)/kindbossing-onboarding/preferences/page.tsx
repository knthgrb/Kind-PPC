import Stepper from "@/components/Stepper";
import PreferencesForm from "./_components/PreferencesForm";
import { redirect } from "next/navigation";
import { createClient } from "@/utils/supabase/server";
import { FamilyOnboardingService } from "@/services/client/FamilyOnboardingService";
import { FamilyService } from "@/services/client/FamilyService";

export default async function PreferencesPage() {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) redirect("/login");

  // Fetch existing family profile data on the server
  const { data: existingProfile, error: profileError } =
    await FamilyService.getFamilyProfile(user.id);

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
