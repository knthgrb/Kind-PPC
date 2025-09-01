import Stepper from "@/components/Stepper";
import PersonalInfoForm from "@/components/onboarding/PersonalInfoForm";
import { redirect } from "next/navigation";
import { createClient } from "@/utils/supabase/server";
import { OnboardingService } from "@/services/OnboardingService";

export default async function PersonalInfoPage() {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) redirect("/login");
  const progress = await OnboardingService.checkOnboardingProgress(user.id);
  if (progress.isComplete) redirect("/profile");
  // Allow access to personal-info step (first step) - no redirect needed
  return (
    <main className="min-h-screen px-4 flex items-start justify-center">
      <section className="w-full max-w-3xl rounded-2xl border border-[#DFDFDF] shadow-sm p-6 md:p-8 mt-8 bg-white">
        <Stepper steps={4} activeStep={1} />
        <br />
        <h1 className="mb-6 stepsH1">Personal Information</h1>

        <PersonalInfoForm />
      </section>
    </main>
  );
}
