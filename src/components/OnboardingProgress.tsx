"use client";

import { useState, useEffect } from "react";
import { createClient } from "@/utils/supabase/client";

interface OnboardingProgress {
  personalInfo: boolean;
  skillsAvailability: boolean;
  workHistory: boolean;
  documentUpload: boolean;
}

interface OnboardingProgressProps {
  currentStage: string;
  className?: string;
}

export default function OnboardingProgressComponent({ currentStage, className = "" }: OnboardingProgressProps) {
  const [progress, setProgress] = useState<OnboardingProgress | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const supabase = createClient();
    
    const getProgress = async () => {
      try {
        const { data: { user } } = await supabase.auth.getUser();
        if (user) {
          const onboardingProgress = await checkOnboardingProgressClient(user.id);
          setProgress(onboardingProgress);
        }
      } catch (error) {
        console.error("Error getting onboarding progress:", error);
      } finally {
        setLoading(false);
      }
    };

    getProgress();
  }, []);

  if (loading || !progress) {
    return (
      <div className={`bg-white rounded-lg shadow p-4 ${className}`}>
        <div className="animate-pulse">
          <div className="h-4 bg-gray-200 rounded w-1/3 mb-4"></div>
          <div className="flex space-x-2">
            {[1, 2, 3, 4].map((i) => (
              <div key={i} className="h-8 bg-gray-200 rounded flex-1"></div>
            ))}
          </div>
        </div>
      </div>
    );
  }

  const stages = [
    { key: 'personalInfo', name: 'Personal Info', path: '/onboarding/personal-info' },
    { key: 'skillsAvailability', name: 'Skills & Availability', path: '/onboarding/skills-availability' },
    { key: 'workHistory', name: 'Work History', path: '/onboarding/work-history' },
    { key: 'documentUpload', name: 'Documents', path: '/onboarding/document-upload' }
  ];

  const currentStageIndex = stages.findIndex(stage => stage.path === currentStage);
  const progressPercentage = getProgressPercentage(progress);

  return (
    <div className={`bg-white rounded-lg shadow p-6 ${className}`}>
      <div className="mb-4">
        <h3 className="text-lg font-semibold text-gray-900 mb-2">Onboarding Progress</h3>
        <div className="flex items-center space-x-2">
          <div className="flex-1 bg-gray-200 rounded-full h-2">
            <div 
              className="bg-blue-600 h-2 rounded-full transition-all duration-300"
              style={{ width: `${progressPercentage}%` }}
            ></div>
          </div>
          <span className="text-sm font-medium text-gray-600">
            {progressPercentage}%
          </span>
        </div>
      </div>

      <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
        {stages.map((stage, index) => {
          const isCompleted = progress[stage.key as keyof OnboardingProgress] as boolean;
          const isCurrent = stage.path === currentStage;
          const isAccessible = index <= currentStageIndex || isCompleted;

          return (
            <div
              key={stage.key}
              className={`relative p-3 rounded-lg border-2 transition-all duration-200 ${
                isCompleted
                  ? 'bg-green-50 border-green-200'
                  : isCurrent
                  ? 'bg-blue-50 border-blue-300'
                  : isAccessible
                  ? 'bg-gray-50 border-gray-200'
                  : 'bg-gray-100 border-gray-100'
              }`}
            >
              <div className="text-center">
                <div className={`w-8 h-8 mx-auto mb-2 rounded-full flex items-center justify-center text-sm font-medium ${
                  isCompleted
                    ? 'bg-green-500 text-white'
                    : isCurrent
                    ? 'bg-blue-500 text-white'
                    : isAccessible
                    ? 'bg-gray-400 text-white'
                    : 'bg-gray-300 text-gray-600'
                }`}>
                  {isCompleted ? '✓' : index + 1}
                </div>
                <p className={`text-xs font-medium ${
                  isCompleted
                    ? 'text-green-700'
                    : isCurrent
                    ? 'text-blue-700'
                    : isAccessible
                    ? 'text-gray-600'
                    : 'text-gray-400'
                }`}>
                  {stage.name}
                </p>
              </div>
              
              {isCurrent && (
                <div className="absolute -top-1 -right-1 w-3 h-3 bg-blue-500 rounded-full border-2 border-white"></div>
              )}
            </div>
          );
        })}
      </div>

      <div className="mt-4 text-center">
        <p className="text-sm text-gray-600">
          {progressPercentage === 100 
            ? "🎉 Onboarding Complete!" 
            : `Step ${currentStageIndex + 1} of ${stages.length}`
          }
        </p>
      </div>
    </div>
  );
}

// Client-side progress checking functions
async function checkOnboardingProgressClient(userId: string): Promise<OnboardingProgress> {
  try {
    const supabase = createClient();
    
    // Get user data
    const { data: userData, error: userError } = await supabase
      .from('users')
      .select('first_name, last_name, phone, date_of_birth, gender, address, city, province')
      .eq('id', userId)
      .single();

    if (userError) throw userError;

    // Get helper profile data
    const { data: helperProfile, error: helperError } = await supabase
      .from('helper_profiles')
      .select('skills, availability_schedule, work_experience')
      .eq('user_id', userId)
      .single();

    // Get verification data
    const { data: verification, error: verificationError } = await supabase
      .from('user_verifications')
      .select('*')
      .eq('user_id', userId)
      .single();

    // Check completion status
    const personalInfo = !!(userData?.first_name && userData?.last_name && userData?.phone && userData?.date_of_birth && userData?.gender && userData?.address && userData?.city && userData?.province);
    const skillsAvailability = !!(helperProfile?.skills && helperProfile?.availability_schedule);
    const workHistory = !!(helperProfile?.work_experience && Array.isArray(helperProfile.work_experience) && helperProfile.work_experience.length > 0);
    const documentUpload = !!verification;

    return {
      personalInfo,
      skillsAvailability,
      workHistory,
      documentUpload
    };
  } catch (error) {
    console.error('Error checking onboarding progress:', error);
    return {
      personalInfo: false,
      skillsAvailability: false,
      workHistory: false,
      documentUpload: false
    };
  }
}

function getProgressPercentage(progress: OnboardingProgress): number {
  const completed = Object.values(progress).filter(Boolean).length;
  return Math.round((completed / 4) * 100);
}
