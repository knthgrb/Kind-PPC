import Stepper from "@/components/Stepper";
import SkillsAvailabilityClient from "./_components/SkillsAvailabilityClient";
import { redirect } from "next/navigation";
import { createClient } from "@/utils/supabase/server";
import { OnboardingService } from "@/services/OnboardingService";

export default async function SkillsAvailabilityPage() {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) redirect("/login");
  const progress = await OnboardingService.checkOnboardingProgress(user.id);
  if (progress.isComplete) redirect("/profile");
  
  // Allow access if personal info is complete OR if user is trying to go back
  // Only redirect forward if they haven't completed personal info yet
  if (!progress.personalInfo) {
    redirect("/onboarding/personal-info");
  }
  return (
    <main className="min-h-screen px-4 flex items-start justify-center">
      <section className="w-full max-w-3xl rounded-2xl border border-[#DFDFDF] shadow-sm p-6 md:p-8 mt-8">
        <Stepper steps={4} activeStep={2} />
        <br />
        <h1 className="mb-4 stepsH1">Skills &amp; Availability</h1>

        <SkillsAvailabilityClient />
      </section>
    </main>
  );
}
