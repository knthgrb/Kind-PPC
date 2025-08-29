"use client";

import { useState, useEffect } from "react";
import { createClient } from "@/utils/supabase/client";
import { OnboardingService, OnboardingProgress } from "@/services/OnboardingService";

export default function KindTaoProfilePage() {
  const [user, setUser] = useState<{ id: string; [key: string]: unknown } | null>(null);
  const [onboardingProgress, setOnboardingProgress] = useState<OnboardingProgress | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const supabase = createClient();
    
    const getUser = async () => {
      try {
        const { data: { user } } = await supabase.auth.getUser();
        if (user) {
          // Convert Supabase User to expected shape for setUser
          // Avoid duplicate 'id' property
          const { id, ...rest } = user;
          setUser({ id, ...rest });
          
          // Get onboarding progress
          const progress = await OnboardingService.checkOnboardingProgress(id);
          setOnboardingProgress(progress);
        }
      } catch (error) {
        console.error("Error getting user:", error);
      } finally {
        setLoading(false);
      }
    };

    getUser();
  }, []);

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-xl">Loading...</div>
      </div>
    );
  }

  if (!user) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-xl text-red-600">User not found</div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50 p-8">
      <div className="max-w-4xl mx-auto">
        <div className="bg-white rounded-lg shadow p-6 mb-6">
          <h1 className="text-3xl font-bold text-gray-900 mb-6">
            Welcome to Your Profile!
          </h1>
          
          <p className="text-gray-600 mb-6">
            Congratulations! You have completed your onboarding and can now access all features.
          </p>

          {onboardingProgress && (
            <div className="mb-6">
              <h2 className="text-xl font-semibold mb-4">Onboarding Status</h2>
              <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                <div className={`p-4 rounded-lg border ${onboardingProgress.personalInfo ? 'bg-green-50 border-green-200' : 'bg-gray-50 border-gray-200'}`}>
                  <div className="text-center">
                    <div className={`w-8 h-8 mx-auto mb-2 rounded-full flex items-center justify-center ${onboardingProgress.personalInfo ? 'bg-green-500 text-white' : 'bg-gray-300 text-gray-600'}`}>
                      {onboardingProgress.personalInfo ? '✓' : '1'}
                    </div>
                    <p className="text-sm font-medium">Personal Info</p>
                  </div>
                </div>
                
                <div className={`p-4 rounded-lg border ${onboardingProgress.skillsAvailability ? 'bg-green-50 border-green-200' : 'bg-gray-50 border-gray-200'}`}>
                  <div className="text-center">
                    <div className={`w-8 h-8 mx-auto mb-2 rounded-full flex items-center justify-center ${onboardingProgress.skillsAvailability ? 'bg-green-500 text-white' : 'bg-gray-300 text-gray-600'}`}>
                      {onboardingProgress.skillsAvailability ? '✓' : '2'}
                    </div>
                    <p className="text-sm font-medium">Skills & Availability</p>
                  </div>
                </div>
                
                <div className={`p-4 rounded-lg border ${onboardingProgress.workHistory ? 'bg-green-50 border-green-200' : 'bg-gray-50 border-gray-200'}`}>
                  <div className="text-center">
                    <div className={`w-8 h-8 mx-auto mb-2 rounded-full flex items-center justify-center ${onboardingProgress.workHistory ? 'bg-green-500 text-white' : 'bg-gray-300 text-gray-600'}`}>
                      {onboardingProgress.workHistory ? '✓' : '3'}
                    </div>
                    <p className="text-sm font-medium">Work History</p>
                  </div>
                </div>
                
                <div className={`p-4 rounded-lg border ${onboardingProgress.documentUpload ? 'bg-green-50 border-green-200' : 'bg-gray-50 border-gray-200'}`}>
                  <div className="text-center">
                    <div className={`w-8 h-8 mx-auto mb-2 rounded-full flex items-center justify-center ${onboardingProgress.documentUpload ? 'bg-green-500 text-white' : 'bg-gray-300 text-gray-600'}`}>
                      {onboardingProgress.documentUpload ? '✓' : '4'}
                    </div>
                    <p className="text-sm font-medium">Documents</p>
                  </div>
                </div>
              </div>
              
              <div className="mt-4 text-center">
                <div className="inline-flex items-center bg-green-100 text-green-800 px-4 py-2 rounded-full">
                  <span className="w-2 h-2 bg-green-500 rounded-full mr-2"></span>
                  Onboarding Complete - 100%
                </div>
              </div>
            </div>
          )}
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <div className="bg-white rounded-lg shadow p-6">
            <h2 className="text-xl font-semibold mb-4">Quick Actions</h2>
            <div className="space-y-3">
              <button className="w-full text-left p-3 rounded-lg border border-gray-200 hover:border-blue-300 hover:bg-blue-50 transition-colors">
                <div className="font-medium">Find Work</div>
                <div className="text-sm text-gray-600">Browse available jobs</div>
              </button>
              
              <button className="w-full text-left p-3 rounded-lg border border-gray-200 hover:border-blue-300 hover:bg-blue-50 transition-colors">
                <div className="font-medium">Update Profile</div>
                <div className="text-sm text-gray-600">Edit your information</div>
              </button>
              
              <button className="w-full text-left p-3 rounded-lg border border-gray-200 hover:border-blue-300 hover:bg-blue-50 transition-colors">
                <div className="font-medium">View Applications</div>
                <div className="text-sm text-gray-600">Track your job applications</div>
              </button>
            </div>
          </div>

          <div className="bg-white rounded-lg shadow p-6">
            <h2 className="text-xl font-semibold mb-4">Profile Stats</h2>
            <div className="space-y-4">
              <div className="flex justify-between items-center">
                <span className="text-gray-600">Profile Views</span>
                <span className="font-semibold">0</span>
              </div>
              
              <div className="flex justify-between items-center">
                <span className="text-gray-600">Job Applications</span>
                <span className="font-semibold">0</span>
              </div>
              
              <div className="flex justify-between items-center">
                <span className="text-gray-600">Response Rate</span>
                <span className="font-semibold">--</span>
              </div>
              
              <div className="flex justify-between items-center">
                <span className="text-gray-600">Rating</span>
                <span className="font-semibold">--</span>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
