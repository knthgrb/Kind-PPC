import Stepper from "@/components/Stepper";
import DocumentUploadClient from "./_components/DocumentUploadClient";
import { redirect } from "next/navigation";
import { createClient } from "@/utils/supabase/server";
import { OnboardingService } from "@/services/OnboardingService";

export default async function DocumentUploadPage() {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) redirect("/login");
  const progress = await OnboardingService.checkOnboardingProgress(user.id);
  if (progress.isComplete) redirect("/profile");
  
  // Allow access if previous steps are complete OR if user is trying to go back
  // Only redirect forward if they haven't completed required previous steps
  if (!progress.personalInfo) {
    redirect("/onboarding/personal-info");
  }
  if (!progress.skillsAvailability) {
    redirect("/onboarding/skills-availability");
  }
  if (!progress.workHistory) {
    redirect("/onboarding/work-history");
  }
  return (
    <main className="min-h-screen px-4 flex items-start justify-center">
      <section className="w-full max-w-3xl rounded-2xl border border-[#DFDFDF] shadow-sm p-6 md:p-8 mt-8">
        <Stepper steps={4} activeStep={4} />
        <br />
        <h1 className="mb-4 stepsH1">Document Upload</h1>

        <DocumentUploadClient />
      </section>
    </main>
  );
}
