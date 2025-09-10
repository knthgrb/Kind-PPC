import { redirect } from "next/navigation";
import { createClient } from "@/utils/supabase/server";
import { FamilyProfileService } from "@/services/FamilyProfileService";

export default async function FamilyOnboarding() {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) redirect("/login");

  const progress = await FamilyProfileService.checkFamilyOnboardingProgress(
    user.id
  );
  if (progress.isComplete) redirect("/kindbossing-dashboard");
  if (progress.nextStage) redirect(progress.nextStage);

  return (
    <div className="min-h-screen bg-gray-50 p-8">
      <div className="max-w-4xl mx-auto">
        <h1 className="text-3xl font-bold text-gray-900 mb-8">
          Complete Your Family Profile
        </h1>

        <div className="bg-white rounded-lg shadow p-6 mb-6">
          <h2 className="text-xl font-semibold mb-4">
            Welcome to KindBossing!
          </h2>
          <p className="text-gray-600 mb-4">
            To get started, please complete your family profile setup. This
            helps us match you with the right helpers for your household needs.
          </p>

          <div className="space-y-4">
            <div className="flex items-center space-x-3">
              <div className="w-6 h-6 bg-green-500 rounded-full flex items-center justify-center">
                <span className="text-white text-sm">✓</span>
              </div>
              <span className="text-gray-700">Account created</span>
            </div>

            <div className="flex items-center space-x-3">
              <div className="w-6 h-6 bg-blue-500 rounded-full flex items-center justify-center">
                <span className="text-white text-sm">2</span>
              </div>
              <span className="text-gray-700">Family profile information</span>
            </div>

            <div className="flex items-center space-x-3">
              <div className="w-6 h-6 bg-gray-300 rounded-full flex items-center justify-center">
                <span className="text-gray-600 text-sm">3</span>
              </div>
              <span className="text-gray-500">Start finding helpers</span>
            </div>
          </div>
        </div>

        <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
          <p className="text-blue-800 text-sm">
            <strong>Note:</strong> You'll need to complete all steps before you
            can start finding helpers for your household.
          </p>
        </div>
      </div>
    </div>
  );
}
