"use client";

import { useState, useEffect, useCallback } from "react";
import { createClient } from "@/utils/supabase/client";

// Define the data types directly to avoid server-side imports
interface PersonalInfoData {
  day: string;
  month: string;
  year: string;
  gender: string;
  location: string;
}

interface SkillsAvailabilityData {
  skills: string[];
  availability_schedule: Record<string, { available: boolean; hours?: [string, string] }>;
}

interface WorkHistoryData {
  work_experience: Array<{
    employer: string;
    duration: string;
    description: string;
    start_date?: string;
    end_date?: string;
    job_type: string;
    skills_used: string[];
  }>;
}

interface UseOnboardingFormProps<T> {
  stage: 'personal-info' | 'skills-availability' | 'work-history';
  initialData?: T;
  onDataChange?: (data: T) => void;
}

// Define proper types for the data structures
interface OnboardingDataResult {
  success: boolean;
  data?: {
    personalInfo: Partial<PersonalInfoData> | null;
    skillsAvailability: Partial<SkillsAvailabilityData> | null;
    workHistory: Array<Record<string, unknown>> | null;
    documentUpload: Record<string, unknown> | null;
  };
  error?: string;
}

interface SaveResult {
  success: boolean;
  message?: string;
  error?: string;
}

export function useOnboardingForm<T extends PersonalInfoData | SkillsAvailabilityData | WorkHistoryData>({
  stage,
  initialData,
  onDataChange
}: UseOnboardingFormProps<T>) {
  const [data, setData] = useState<T>(initialData as T);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [lastSaved, setLastSaved] = useState<Date | null>(null);
  const [error, setError] = useState<string | null>(null);

  const supabase = createClient();

  // Load existing data when component mounts
  useEffect(() => {
    loadExistingData();
  }, [stage]);

  // Auto-save data after user stops typing
  useEffect(() => {
    if (!data || !initialData) return;

    const timeoutId = setTimeout(() => {
      if (JSON.stringify(data) !== JSON.stringify(initialData)) {
        autoSaveData();
      }
    }, 2000); // Auto-save after 2 seconds of no typing

    return () => clearTimeout(timeoutId);
  }, [data]);

  const loadExistingData = async () => {
    try {
      setLoading(true);
      setError(null);

      const { data: { user } } = await supabase.auth.getUser();
      if (!user) {
        setError("User not authenticated");
        setLoading(false);
        return;
      }

      // Get existing onboarding data using client-side approach
      const result = await getCurrentOnboardingDataClient(user.id);
      
      if (result.success && result.data) {
        let stageData: Record<string, unknown> = {};

        switch (stage) {
          case 'personal-info':
            stageData = result.data.personalInfo || {};
            break;
          case 'skills-availability':
            stageData = result.data.skillsAvailability || {};
            break;
          case 'work-history':
            stageData = {
              work_experience: result.data.workHistory || []
            };
            break;
        }

        // Merge with initial data (form defaults)
        const mergedData = { ...initialData, ...stageData } as T;
        setData(mergedData);
        
        // Notify parent component
        if (onDataChange) {
          onDataChange(mergedData);
        }
      }
    } catch (err) {
      console.error("Error loading existing data:", err);
      setError("Failed to load existing data");
    } finally {
      setLoading(false);
    }
  };

  const autoSaveData = async () => {
    try {
      setSaving(true);
      setError(null);

      const { data: { user } } = await supabase.auth.getUser();
      if (!user) {
        setError("User not authenticated");
        return;
      }

      let result: SaveResult;

      switch (stage) {
        case 'personal-info':
          result = await savePersonalInfoClient(user.id, data as PersonalInfoData);
          break;
        case 'skills-availability':
          result = await saveSkillsAvailabilityClient(user.id, data as SkillsAvailabilityData);
          break;
        case 'work-history':
          result = await saveWorkHistoryClient(user.id, data as WorkHistoryData);
          break;
        default:
          result = { success: false, error: 'Unknown stage' };
      }

      if (result.success) {
        setLastSaved(new Date());
        console.log(`✅ Auto-saved ${stage} data`);
      } else {
        setError(result.error || "Auto-save failed");
      }
    } catch (err) {
      console.error("Error auto-saving data:", err);
      setError("Auto-save failed");
    } finally {
      setSaving(false);
    }
  };

  const updateField = useCallback((field: keyof T, value: string | number | boolean) => {
    setData(prev => ({
      ...prev,
      [field]: value
    }));
  }, []);

  const updateNestedField = useCallback((parentField: keyof T, field: string, value: string | number | boolean) => {
    setData(prev => ({
      ...prev,
      [parentField]: {
        ...(prev[parentField] as Record<string, unknown>),
        [field]: value
      }
    }));
  }, []);

  const updateArrayField = useCallback((field: keyof T, value: string[]) => {
    setData(prev => ({
      ...prev,
      [field]: value
    }));
  }, []);

  const addToArrayField = useCallback((field: keyof T, value: string) => {
    setData(prev => ({
      ...prev,
      [field]: [...(prev[field] as string[] || []), value]
    }));
  }, []);

  const removeFromArrayField = useCallback((field: keyof T, index: number) => {
    setData(prev => ({
      ...prev,
      [field]: (prev[field] as string[] || []).filter((_, i) => i !== index)
    }));
  }, []);

  const resetToInitial = useCallback(() => {
    setData(initialData as T);
    setError(null);
  }, [initialData]);

  return {
    data,
    loading,
    saving,
    lastSaved,
    error,
    updateField,
    updateNestedField,
    updateArrayField,
    addToArrayField,
    removeFromArrayField,
    resetToInitial,
    autoSaveData,
    loadExistingData
  };
}

// Client-side data fetching functions
async function getCurrentOnboardingDataClient(userId: string): Promise<OnboardingDataResult> {
  try {
    const supabase = createClient();
    
    // Get user data
    const { data: userData, error: userError } = await supabase
      .from('users')
      .select('*')
      .eq('id', userId)
      .single();

    if (userError) throw userError;

    // Get helper profile data
    const { data: helperProfile, error: helperError } = await supabase
      .from('helper_profiles')
      .select('*')
      .eq('user_id', userId)
      .single();

    // Helper profile might not exist yet, so we don't throw on error
    if (helperError && helperError.code !== 'PGRST116') {
      console.warn('Helper profile error:', helperError);
    }

    // Get verification data
    const { data: verification, error: verificationError } = await supabase
      .from('user_verifications')
      .select('*')
      .eq('user_id', userId)
      .single();

    // Verification might not exist yet, so we don't throw on error
    if (verificationError && verificationError.code !== 'PGRST116') {
      console.warn('Verification error:', verificationError);
    }

    // Convert date_of_birth to day/month/year format for personal info
    let personalInfo: Partial<PersonalInfoData> = {};
    if (userData?.date_of_birth) {
      const date = new Date(userData.date_of_birth);
      personalInfo = {
        day: date.getDate().toString(),
        month: (date.getMonth() + 1).toString(),
        year: date.getFullYear().toString(),
        gender: userData.gender || '',
        location: userData.location || 'Philippines'
      };
    } else if (userData) {
      personalInfo = {
        gender: userData.gender || '',
        location: userData.location || 'Philippines'
      };
    }

    return {
      success: true,
      data: {
        personalInfo,
        skillsAvailability: helperProfile,
        workHistory: helperProfile?.work_experience || [],
        documentUpload: verification
      }
    };
  } catch (error) {
    console.error('Error fetching onboarding data:', error);
    return { success: false, error: 'Failed to fetch data' };
  }
}

async function savePersonalInfoClient(userId: string, data: PersonalInfoData): Promise<SaveResult> {
  try {
    const supabase = createClient();
    
    // Convert to date format for database
    const dateOfBirth = data.year && data.month && data.day 
      ? `${data.year}-${data.month.padStart(2, '0')}-${data.day.padStart(2, '0')}`
      : null;

    const { error } = await supabase
      .from('users')
      .update({
        date_of_birth: dateOfBirth,
        gender: data.gender,
        // You might want to save location to a different field or add it to your users table
        updated_at: new Date().toISOString()
      })
      .eq('id', userId);

    if (error) throw error;

    return { success: true, message: 'Personal info saved successfully' };
  } catch (error) {
    console.error('Error saving personal info:', error);
    return { success: false, error: 'Failed to save personal info' };
  }
}

async function saveSkillsAvailabilityClient(userId: string, data: SkillsAvailabilityData): Promise<SaveResult> {
  try {
    const supabase = createClient();
    
    const { error } = await supabase
      .from('helper_profiles')
      .upsert({
        user_id: userId,
        skills: data.skills || [],
        availability_schedule: data.availability_schedule || {},
        updated_at: new Date().toISOString()
      }, {
        onConflict: 'user_id'
      });

    if (error) throw error;

    return { success: true, message: 'Skills and availability saved successfully' };
  } catch (error) {
    console.error('Error saving skills and availability:', error);
    return { success: false, error: 'Failed to save skills and availability' };
  }
}

async function saveWorkHistoryClient(userId: string, data: WorkHistoryData): Promise<SaveResult> {
  try {
    const supabase = createClient();
    
    const { error } = await supabase
      .from('helper_profiles')
      .upsert({
        user_id: userId,
        work_experience: data.work_experience || [],
        updated_at: new Date().toISOString()
      }, {
        onConflict: 'user_id'
      });

    if (error) throw error;

    return { success: true, message: 'Work history saved successfully' };
  } catch (error) {
    console.error('Error saving work history:', error);
    return { success: false, error: 'Failed to save work history' };
  }
}

// Export types for use in components
export type { PersonalInfoData, SkillsAvailabilityData, WorkHistoryData };
