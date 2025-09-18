"use client";

import Image from "next/image";
import React, { useMemo, useRef, useState, useEffect } from "react";
import { WorkItem, Day, AvailabilityItem } from "@/types/profile";
import {
  GET_MONTHS,
  GET_YEARS,
  GET_ALL_DAYS,
  GET_TIME_SLOTS,
} from "@/constants/profile";
import Card from "@/components/Card";
import Chip from "@/components/Chip";
import RedButton from "@/components/ui/RedButton";
import GhostButton from "@/components/ui/GhostButton";
import type { UserProfile } from "@/types/userProfile";
import { capitalizeWords } from "@/utils/capitalize";
import SupabaseImage from "@/components/SupabaseImage";

interface ProfileClientProps {
  user: UserProfile;
}

export default function ProfileClient({ user }: ProfileClientProps) {
  const {
    first_name,
    last_name,
    email,
    phone,
    profile_image_url,
    address,
    city,
    province,
    postal_code,
  } = user;

  const fullName = [first_name, last_name].filter(Boolean).join(" ");
  const fullAddress = [address, city, province, postal_code]
    .filter(Boolean)
    .join(", ");

  /* Work history */
  const [workItems, setWorkItems] = useState<WorkItem[]>(
    (user.helper_profiles?.work_experience as unknown as Array<{
      jobTitle: string;
      company: string;
      startDate: string;
      endDate: string;
      description: string;
    }>)?.map((exp, index) => ({
      id: `work-${index}`,
      jobTitle: exp.jobTitle || "Job Title",
      company: exp.company,
      startMonth: exp.startDate ? new Date(exp.startDate).toLocaleDateString('en-US', { month: 'long' }) : "",
      startYear: exp.startDate ? new Date(exp.startDate).getFullYear().toString() : "",
      endMonth: exp.endDate ? new Date(exp.endDate).toLocaleDateString('en-US', { month: 'long' }) : "",
      endYear: exp.endDate ? new Date(exp.endDate).getFullYear().toString() : "",
      description: exp.description,
      collapsed: true,
    })) || []
  );
  const [editingWork, setEditingWork] = useState(false);
  const [workForm, setWorkForm] = useState<Omit<WorkItem, "id">>({
    jobTitle: "",
    company: "",
    startMonth: "",
    startYear: "",
    endMonth: "",
    endYear: "",
    description: "",
  });
  const [showRemoveConfirm, setShowRemoveConfirm] = useState<string | null>(null);

  const months = useMemo(() => GET_MONTHS(), []);
  const years = useMemo(() => GET_YEARS(), []);

  // Click outside handler to close skills dropdown
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (
        skillDropdownRef.current && 
        !skillDropdownRef.current.contains(event.target as Node) &&
        skillInputRef.current && 
        !skillInputRef.current.contains(event.target as Node)
      ) {
        setSkillDropdownOpen(false);
      }
    };

    document.addEventListener('mousedown', handleClickOutside);
    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, []);



  const addWork = async () => {
    if (!workForm.jobTitle.trim()) return;
    
    try {
      // Add to local state first
      const newWorkItem = {
        id: crypto.randomUUID(),
        ...workForm,
        collapsed: true,
      };
      
      const updatedWorkItems = [newWorkItem, ...workItems];
      setWorkItems(updatedWorkItems);
      
      // Update database
      const { createClient } = await import("@/utils/supabase/client");
      const supabase = createClient();
      
      // Convert work items back to the database format
      const dbWorkExperience = updatedWorkItems.map((item) => ({
        jobTitle: item.jobTitle,
        company: item.company,
        startDate: item.startMonth && item.startYear ? `${item.startYear}-${item.startMonth}-01` : null,
        endDate: item.endMonth && item.endYear ? `${item.endYear}-${item.endMonth}-01` : null,
        description: item.description,
      }));
      
      const { error } = await supabase
        .from('helper_profiles')
        .update({ work_experience: dbWorkExperience })
        .eq('user_id', user.id);
        
      if (error) {
        console.error('Error updating work experience:', error);
        // Revert local state on error
        setWorkItems(workItems);
        alert('Failed to add work experience. Please try again.');
        return;
      }
      
      console.log('Work experience updated successfully');
      
      // Clear form and close editing mode
    setWorkForm({
      jobTitle: "",
      company: "",
      startMonth: "",
      startYear: "",
      endMonth: "",
      endYear: "",
      description: "",
    });
    setEditingWork(false);
      
    } catch (error) {
      console.error('Error adding work experience:', error);
      // Revert local state on error
      setWorkItems(workItems);
      alert('Failed to add work experience. Please try again.');
    }
  };

  const removeWork = async (id: string) => {
    try {
      // Remove from local state
      const updatedWorkItems = workItems.filter((w) => w.id !== id);
      setWorkItems(updatedWorkItems);
      
      // Update database
      const { createClient } = await import("@/utils/supabase/client");
      const supabase = createClient();
      
      // Convert work items back to the database format
      const dbWorkExperience = updatedWorkItems.map((item) => ({
        jobTitle: item.jobTitle,
        company: item.company,
        startDate: item.startMonth && item.startYear ? `${item.startYear}-${item.startMonth}-01` : null,
        endDate: item.endMonth && item.endYear ? `${item.endYear}-${item.endMonth}-01` : null,
        description: item.description,
      }));
      
      const { error } = await supabase
        .from('helper_profiles')
        .update({ work_experience: dbWorkExperience })
        .eq('user_id', user.id);
        
      if (error) {
        console.error('Error updating work experience:', error);
        // Revert local state on error
        setWorkItems(workItems);
        alert('Failed to remove work experience. Please try again.');
      } else {
        console.log('Work experience updated successfully');
      }
    } catch (error) {
      console.error('Error removing work experience:', error);
      // Revert local state on error
      setWorkItems(workItems);
      alert('Failed to remove work experience. Please try again.');
    }
    
    setShowRemoveConfirm(null);
  };

  const toggleCollapse = (id: string) =>
    setWorkItems((prev) =>
      prev.map((w) => (w.id === id ? { ...w, collapsed: !w.collapsed } : w))
    );

  /* Skills */
  const [skills, setSkills] = useState<string[]>(
    (user.helper_profiles?.skills ?? []).map(capitalizeWords)
  );

  const [editingSkills, setEditingSkills] = useState(false);
  const [skillInput, setSkillInput] = useState("");
  const [showRemoveSkillConfirm, setShowRemoveSkillConfirm] = useState<string | null>(null);
  const [showRemoveAvailabilityConfirm, setShowRemoveAvailabilityConfirm] = useState<{id: string, type: 'day' | 'slot', value: string} | null>(null);
  const [skillDropdownOpen, setSkillDropdownOpen] = useState(false);
  const skillDropdownRef = useRef<HTMLDivElement>(null);
  const skillInputRef = useRef<HTMLInputElement>(null);
  
  // Valid skills from database enum (same as SkillsAvailabilityClient)
  const VALID_SKILLS = ["childcare", "elderly_care", "cooking", "cleaning", "driving", "pet_care", "tutoring"];
  
  // Filter skills based on input and already selected skills
  const filteredSkills = VALID_SKILLS.filter(skill => 
    !skills.includes(capitalizeWords(skill)) && 
    skill.toLowerCase().includes(skillInput.toLowerCase())
  );
  
  // Helper function to capitalize skill names for display
  const capitalizeSkill = (skill: string) => {
    return skill.charAt(0).toUpperCase() + skill.slice(1).replace('_', ' ');
  };
  
  // Helper function to convert display format back to database format
  const toSkillDatabaseFormat = (displaySkill: string) => {
    return displaySkill.toLowerCase().replace(' ', '_');
  };

  const addSkill = async (skill?: string) => {
    const s = skill ? capitalizeWords(skill) : skillInput.trim();
    if (!s) return;
    if (skills.includes(s)) return; // Don't add if already exists
    
    try {
      // Add to local state first
      const updatedSkills = [...skills, s];
      setSkills(updatedSkills);
      
      // Convert to database format (lowercase with underscores)
      const dbSkills = updatedSkills.map(toSkillDatabaseFormat);
      
      // Update database
      const { createClient } = await import("@/utils/supabase/client");
      const supabase = createClient();
      
      // Check if helper_profile exists, if not create it
      const { data: existingProfile } = await supabase
        .from('helper_profiles')
        .select('id')
        .eq('user_id', user.id)
        .single();

      let result;
      if (existingProfile) {
        // Update existing profile
        result = await supabase
          .from('helper_profiles')
          .update({ 
            skills: dbSkills,
            updated_at: new Date().toISOString()
          })
          .eq('user_id', user.id);
      } else {
        // Create new profile
        result = await supabase
          .from('helper_profiles')
          .insert({
            user_id: user.id,
            skills: dbSkills,
            created_at: new Date().toISOString(),
            updated_at: new Date().toISOString()
          });
      }
        
      if (result.error) {
        console.error('Error updating skills:', result.error);
        console.error('User ID:', user.id);
        console.error('Display skills:', updatedSkills);
        console.error('Database skills:', dbSkills);
        // Revert local state on error
        setSkills(skills);
        alert(`Failed to add skill: ${result.error.message}`);
      } else {
        console.log('Skills updated successfully');
      }
    } catch (error) {
      console.error('Error adding skill:', error);
      // Revert local state on error
      setSkills(skills);
      alert('Failed to add skill. Please try again.');
    }
    
    setSkillInput("");
    setSkillDropdownOpen(false);
  };
  
  const removeSkill = async (s: string) => {
    try {
      // Remove from local state
      const updatedSkills = skills.filter((x) => x !== s);
      setSkills(updatedSkills);
      
      // Convert to database format (lowercase with underscores)
      const dbSkills = updatedSkills.map(toSkillDatabaseFormat);
      
      // Update database
      const { createClient } = await import("@/utils/supabase/client");
      const supabase = createClient();
      
      // Check if helper_profile exists, if not create it
      const { data: existingProfile } = await supabase
        .from('helper_profiles')
        .select('id')
        .eq('user_id', user.id)
        .single();

      let result;
      if (existingProfile) {
        // Update existing profile
        result = await supabase
          .from('helper_profiles')
          .update({ 
            skills: dbSkills,
            updated_at: new Date().toISOString()
          })
          .eq('user_id', user.id);
      } else {
        // Create new profile
        result = await supabase
          .from('helper_profiles')
          .insert({
            user_id: user.id,
            skills: dbSkills,
            created_at: new Date().toISOString(),
            updated_at: new Date().toISOString()
          });
      }
        
      if (result.error) {
        console.error('Error updating skills:', result.error);
        console.error('User ID:', user.id);
        console.error('Display skills:', updatedSkills);
        console.error('Database skills:', dbSkills);
        // Revert local state on error
        setSkills(skills);
        alert(`Failed to remove skill: ${result.error.message}`);
      } else {
        console.log('Skills updated successfully');
      }
    } catch (error) {
      console.error('Error removing skill:', error);
      // Revert local state on error
      setSkills(skills);
      alert('Failed to remove skill. Please try again.');
    }
    
    setShowRemoveSkillConfirm(null);
  };

  /* Availability */
  const allDays: Day[] = useMemo(() => GET_ALL_DAYS(), []);
  const timeSlots = useMemo(() => GET_TIME_SLOTS(), []);
  const [editingAvail, setEditingAvail] = useState(false);
  
  // Parse availability schedule from user data
  const userAvailability = user.helper_profiles?.availability_schedule;
  const [selectedDays, setSelectedDays] = useState<Day[]>(() => {
    if (!userAvailability) return [];
    return Object.entries(userAvailability)
      .filter(([, schedule]) => schedule.available)
      .map(([day]) => day.charAt(0).toUpperCase() + day.slice(1).toLowerCase() as Day);
  });
  const [selectedSlots, setSelectedSlots] = useState<string[]>(() => {
    if (!userAvailability) return [];
    // Extract time slots from availability schedule
    const slots: string[] = [];
    Object.values(userAvailability).forEach(schedule => {
      if (schedule.available) {
        // Handle both old and new format
        if ('timeSlot' in schedule) {
          const scheduleData = schedule as { timeSlot: string; morning?: boolean; evening?: boolean };
          const timeSlot = scheduleData.timeSlot;
          if (timeSlot && !slots.includes(timeSlot)) {
            slots.push(timeSlot);
          }
          // Also add morning/evening if they're set
          if (scheduleData.morning && !slots.includes("Morning")) {
            slots.push("Morning");
          }
          if (scheduleData.evening && !slots.includes("Evening")) {
            slots.push("Evening");
          }
        } else if ('hours' in schedule && schedule.hours) {
          const [start, end] = schedule.hours;
          if (start && end) {
            const timeSlot = `${start} - ${end}`;
            if (!slots.includes(timeSlot)) {
              slots.push(timeSlot);
            }
          }
        }
      }
    });
    return slots;
  });
  const toggleDay = (d: Day) =>
    setSelectedDays((prev) =>
      prev.includes(d) ? prev.filter((x) => x !== d) : [...prev, d]
    );
  const toggleSlot = (s: string) =>
    setSelectedSlots((prev) =>
      prev.includes(s) ? prev.filter((x) => x !== s) : [...prev, s]
    );
  const [availItems, setAvailItems] = useState<AvailabilityItem[]>(() => {
    // Initialize with current availability data
    if (!userAvailability) return [];
    
    const items: AvailabilityItem[] = [];
    const daysBySlot: { [key: string]: Day[] } = {};
    
    // Group days by their time slots
    Object.entries(userAvailability).forEach(([day, schedule]) => {
      if (schedule.available) {
        const dayFormatted = day.charAt(0).toUpperCase() + day.slice(1).toLowerCase() as Day;
        
        // Handle both old and new format
        if ('timeSlot' in schedule) {
          const scheduleData = schedule as { timeSlot: string; morning?: boolean; evening?: boolean };
          const primaryTimeSlot = scheduleData.timeSlot || "Evening";
          
          // Create a unique key for this combination of time slots
          const timeSlots = [primaryTimeSlot];
          if (scheduleData.morning && !timeSlots.includes("Morning")) {
            timeSlots.push("Morning");
          }
          if (scheduleData.evening && !timeSlots.includes("Evening")) {
            timeSlots.push("Evening");
          }
          
          const timeSlotKey = timeSlots.sort().join(", ");
          
          if (!daysBySlot[timeSlotKey]) {
            daysBySlot[timeSlotKey] = [];
          }
          daysBySlot[timeSlotKey].push(dayFormatted);
        } else if ('hours' in schedule && schedule.hours) {
          const [start, end] = schedule.hours;
          if (start && end) {
            const timeSlot = `${start} - ${end}`;
            if (!daysBySlot[timeSlot]) {
              daysBySlot[timeSlot] = [];
            }
            daysBySlot[timeSlot].push(dayFormatted);
          }
        }
      }
    });
    
    // Create availability items
    Object.entries(daysBySlot).forEach(([slot, days]) => {
      // Split the combined time slot key back into individual slots
      const individualSlots = slot.split(", ");
      
      items.push({
        id: crypto.randomUUID(),
        days: days.sort(),
        slots: individualSlots
      });
    });
    
    return items;
  });

  // Update edit mode state when availability items change
  useEffect(() => {
    if (editingAvail) {
      // When in edit mode, refresh the selectedDays and selectedSlots based on current availability
      const currentDays: Day[] = [];
      const currentSlots: string[] = [];
      
      if (userAvailability) {
        Object.entries(userAvailability).forEach(([day, schedule]) => {
          if (schedule.available) {
            const dayFormatted = day.charAt(0).toUpperCase() + day.slice(1).toLowerCase() as Day;
            if (!currentDays.includes(dayFormatted)) {
              currentDays.push(dayFormatted);
            }
            
            // Handle both old and new format
            if ('timeSlot' in schedule) {
              const scheduleData = schedule as { timeSlot: string; morning?: boolean; evening?: boolean };
              const timeSlot = scheduleData.timeSlot;
              if (timeSlot && !currentSlots.includes(timeSlot)) {
                currentSlots.push(timeSlot);
              }
              // Also add morning/evening if they're set
              if (scheduleData.morning && !currentSlots.includes("Morning")) {
                currentSlots.push("Morning");
              }
              if (scheduleData.evening && !currentSlots.includes("Evening")) {
                currentSlots.push("Evening");
              }
            } else if ('hours' in schedule && schedule.hours) {
              const [start, end] = schedule.hours;
              if (start && end) {
                const timeSlot = `${start} - ${end}`;
                if (!currentSlots.includes(timeSlot)) {
                  currentSlots.push(timeSlot);
                }
              }
            }
          }
        });
      }
      
      setSelectedDays(currentDays);
      setSelectedSlots(currentSlots);
    }
  }, [availItems, editingAvail, userAvailability]);

  // Force refresh edit mode state when availability items change (even when not in edit mode)
  useEffect(() => {
    // This effect runs whenever availItems changes, ensuring the edit mode state is always in sync
    if (userAvailability) {
      const currentDays: Day[] = [];
      const currentSlots: string[] = [];
      
      Object.entries(userAvailability).forEach(([day, schedule]) => {
        if (schedule.available) {
          const dayFormatted = day.charAt(0).toUpperCase() + day.slice(1).toLowerCase() as Day;
          if (!currentDays.includes(dayFormatted)) {
            currentDays.push(dayFormatted);
          }
          
          // Handle both old and new format
          if ('timeSlot' in schedule) {
            const scheduleData = schedule as { timeSlot: string; morning?: boolean; evening?: boolean };
            const timeSlot = scheduleData.timeSlot;
            if (timeSlot && !currentSlots.includes(timeSlot)) {
              currentSlots.push(timeSlot);
            }
            // Also add morning/evening if they're set
            if (scheduleData.morning && !currentSlots.includes("Morning")) {
              currentSlots.push("Morning");
            }
            if (scheduleData.evening && !currentSlots.includes("Evening")) {
              currentSlots.push("Evening");
            }
          } else if ('hours' in schedule && schedule.hours) {
            const [start, end] = schedule.hours;
            if (start && end) {
              const timeSlot = `${start} - ${end}`;
              if (!currentSlots.includes(timeSlot)) {
                currentSlots.push(timeSlot);
              }
            }
          }
        }
      });
      
      // Update the edit mode state to match current availability
      setSelectedDays(currentDays);
      setSelectedSlots(currentSlots);
    }
  }, [availItems, userAvailability]);

  const addAvailability = async () => {
    if (selectedDays.length === 0 && selectedSlots.length === 0) return;

    try {
      // Create new availability schedule using the same structure as SkillsAvailabilityClient
      const newSchedule: Record<string, {
        available: boolean;
        timeSlot: string;
        morning: boolean;
        evening: boolean;
      }> = {};
      
      // Start with existing schedule if available
      if (userAvailability) {
        Object.entries(userAvailability).forEach(([day, schedule]) => {
          // Handle both old and new format
          if ('timeSlot' in schedule) {
            newSchedule[day] = schedule as { available: boolean; timeSlot: string; morning: boolean; evening: boolean };
          } else {
            // Convert old format to new format
            newSchedule[day] = {
              available: schedule.available,
              timeSlot: "Evening",
              morning: false,
              evening: true
            };
          }
        });
      }
      
      // Initialize all days as not available if not already set
      const allDaysLower = ['monday', 'tuesday', 'wednesday', 'thursday', 'friday', 'saturday', 'sunday'];
      allDaysLower.forEach(day => {
        if (!newSchedule[day]) {
          newSchedule[day] = { 
            available: false, 
            timeSlot: "Evening", 
            morning: false, 
            evening: false 
          };
        }
      });
      
      // Set selected days as available
      selectedDays.forEach(day => {
        const dayLower = day.toLowerCase();
        // Determine the primary time slot and morning/evening flags
        const primaryTimeSlot = selectedSlots.length > 0 ? selectedSlots[0] : "Evening";
        const morning = selectedSlots.includes("Morning");
        const evening = selectedSlots.includes("Evening");
        
        newSchedule[dayLower] = { 
          available: true, 
          timeSlot: primaryTimeSlot,
          morning: morning,
          evening: evening
        };
      });

      console.log('Saving availability schedule:', newSchedule);

      // Update database first
      const { createClient } = await import("@/utils/supabase/client");
      const supabase = createClient();
      
      // Check if helper_profile exists, if not create it
      const { data: existingProfile } = await supabase
        .from('helper_profiles')
        .select('id')
        .eq('user_id', user.id)
        .single();

      let result;
      if (existingProfile) {
        // Update existing profile
        result = await supabase
          .from('helper_profiles')
          .update({ 
            availability_schedule: newSchedule,
            updated_at: new Date().toISOString()
          })
          .eq('user_id', user.id);
      } else {
        // Create new profile
        result = await supabase
          .from('helper_profiles')
          .insert({
            user_id: user.id,
            availability_schedule: newSchedule,
            created_at: new Date().toISOString(),
            updated_at: new Date().toISOString()
          });
      }
        
      if (result.error) {
        console.error('Error updating availability:', result.error);
        alert(`Failed to update availability: ${result.error.message}`);
      } else {
        console.log('Availability updated successfully');
        
        // Update local state to reflect the new schedule
        const items: AvailabilityItem[] = [];
        const daysBySlot: { [key: string]: Day[] } = {};
        
        // Group days by their time slots
        Object.entries(newSchedule).forEach(([day, schedule]) => {
          if (schedule.available) {
            const dayFormatted = day.charAt(0).toUpperCase() + day.slice(1).toLowerCase() as Day;
            const primaryTimeSlot = schedule.timeSlot || "Evening";
            
            // Create a unique key for this combination of time slots
            const timeSlots = [primaryTimeSlot];
            if (schedule.morning && !timeSlots.includes("Morning")) {
              timeSlots.push("Morning");
            }
            if (schedule.evening && !timeSlots.includes("Evening")) {
              timeSlots.push("Evening");
            }
            
            const timeSlotKey = timeSlots.sort().join(", ");
            
            if (!daysBySlot[timeSlotKey]) {
              daysBySlot[timeSlotKey] = [];
            }
            daysBySlot[timeSlotKey].push(dayFormatted);
          }
        });
        
        // Create availability items
        Object.entries(daysBySlot).forEach(([slot, days]) => {
          // Split the combined time slot key back into individual slots
          const individualSlots = slot.split(", ");
          
          items.push({
        id: crypto.randomUUID(),
            days: days.sort(),
            slots: individualSlots
          });
        });
        
        setAvailItems(items);
        setSelectedDays([]);
        setSelectedSlots([]);
    setEditingAvail(false);
      }
    } catch (error) {
      console.error('Error adding availability:', error);
      alert('Failed to update availability. Please try again.');
    }
  };

  // Remove just one day from an availability
  const removeDay = async (id: string, day: string) => {
    try {
      // Update local state first
      const updatedItems = availItems.map((a) =>
        a.id === id ? { ...a, days: a.days.filter((d) => d !== day) } : a
      );
      setAvailItems(updatedItems);
      
      // Update selectedDays state to reflect the removal
      setSelectedDays(prev => prev.filter(d => d !== day));

      // Update database
      const { createClient } = await import("@/utils/supabase/client");
      const supabase = createClient();
      
      // Rebuild availability schedule from updated items using the same structure as SkillsAvailabilityClient
      const newSchedule: Record<string, {
        available: boolean;
        timeSlot: string;
        morning: boolean;
        evening: boolean;
      }> = {};
      
      // Initialize all days as not available
      const allDaysLower = ['monday', 'tuesday', 'wednesday', 'thursday', 'friday', 'saturday', 'sunday'];
      allDaysLower.forEach(day => {
        newSchedule[day] = { 
          available: false, 
          timeSlot: "Evening", 
          morning: false, 
          evening: false 
        };
      });
      
      // Set available days from updated items
      updatedItems.forEach(item => {
        item.days.forEach(day => {
          const dayLower = day.toLowerCase();
          const timeSlot = item.slots.length > 0 ? item.slots[0] : "Evening";
          
          newSchedule[dayLower] = { 
            available: true, 
            timeSlot: timeSlot,
            morning: item.slots.includes("Morning"),
            evening: item.slots.includes("Evening")
          };
        });
      });

      const result = await supabase
        .from('helper_profiles')
        .update({ 
          availability_schedule: newSchedule,
          updated_at: new Date().toISOString()
        })
        .eq('user_id', user.id);
        
      if (result.error) {
        console.error('Error updating availability:', result.error);
        // Revert local state on error
        setAvailItems(availItems);
        setSelectedDays(prev => [...prev, day as Day]); // Revert selectedDays
        alert(`Failed to remove day: ${result.error.message}`);
      } else {
        console.log('Availability updated successfully');
        
        // Refresh the entire availability state to reflect database changes
        const refreshedItems: AvailabilityItem[] = [];
        const daysBySlot: { [key: string]: Day[] } = {};
        
        // Group days by their time slots from the updated schedule
        Object.entries(newSchedule).forEach(([day, schedule]) => {
          if (schedule.available) {
            const dayFormatted = day.charAt(0).toUpperCase() + day.slice(1).toLowerCase() as Day;
            const timeSlot = schedule.timeSlot || "Evening";
            
            if (!daysBySlot[timeSlot]) {
              daysBySlot[timeSlot] = [];
            }
            daysBySlot[timeSlot].push(dayFormatted);
          }
        });
        
        // Create refreshed availability items
        Object.entries(daysBySlot).forEach(([slot, days]) => {
          refreshedItems.push({
            id: crypto.randomUUID(),
            days: days.sort(),
            slots: [slot]
          });
        });
        
        setAvailItems(refreshedItems);
      }
    } catch (error) {
      console.error('Error removing day:', error);
      // Revert local state on error
      setAvailItems(availItems);
      alert('Failed to remove day. Please try again.');
    }
  };

  const removeSlot = async (id: string, slot: string) => {
    try {
      // Update local state first
      const updatedItems = availItems.map((a) =>
        a.id === id ? { ...a, slots: a.slots.filter((s) => s !== slot) } : a
      );
      setAvailItems(updatedItems);
      
      // Update selectedSlots state to reflect the removal
      setSelectedSlots(prev => prev.filter(s => s !== slot));

      // Update database
      const { createClient } = await import("@/utils/supabase/client");
      const supabase = createClient();
      
      // Rebuild availability schedule from updated items using the same structure as SkillsAvailabilityClient
      const newSchedule: Record<string, {
        available: boolean;
        timeSlot: string;
        morning: boolean;
        evening: boolean;
      }> = {};
      
      // Initialize all days as not available
      const allDaysLower = ['monday', 'tuesday', 'wednesday', 'thursday', 'friday', 'saturday', 'sunday'];
      allDaysLower.forEach(day => {
        newSchedule[day] = { 
          available: false, 
          timeSlot: "Evening", 
          morning: false, 
          evening: false 
        };
      });
      
      // Set available days from updated items
      updatedItems.forEach(item => {
        item.days.forEach(day => {
          const dayLower = day.toLowerCase();
          const timeSlot = item.slots.length > 0 ? item.slots[0] : "Evening";
          
          newSchedule[dayLower] = { 
            available: true, 
            timeSlot: timeSlot,
            morning: item.slots.includes("Morning"),
            evening: item.slots.includes("Evening")
          };
        });
      });

      const result = await supabase
        .from('helper_profiles')
        .update({ 
          availability_schedule: newSchedule,
          updated_at: new Date().toISOString()
        })
        .eq('user_id', user.id);
        
      if (result.error) {
        console.error('Error updating availability:', result.error);
        // Revert local state on error
        setAvailItems(availItems);
        setSelectedSlots(prev => [...prev, slot]); // Revert selectedSlots
        alert(`Failed to remove time slot: ${result.error.message}`);
      } else {
        console.log('Availability updated successfully');
        
        // Refresh the entire availability state to reflect database changes
        const refreshedItems: AvailabilityItem[] = [];
        const daysBySlot: { [key: string]: Day[] } = {};
        
        // Group days by their time slots from the updated schedule
        Object.entries(newSchedule).forEach(([day, schedule]) => {
          if (schedule.available) {
            const dayFormatted = day.charAt(0).toUpperCase() + day.slice(1).toLowerCase() as Day;
            const timeSlot = schedule.timeSlot || "Evening";
            
            if (!daysBySlot[timeSlot]) {
              daysBySlot[timeSlot] = [];
            }
            daysBySlot[timeSlot].push(dayFormatted);
          }
        });
        
        // Create refreshed availability items
        Object.entries(daysBySlot).forEach(([slot, days]) => {
          refreshedItems.push({
            id: crypto.randomUUID(),
            days: days.sort(),
            slots: [slot]
          });
        });
        
        setAvailItems(refreshedItems);
      }
    } catch (error) {
      console.error('Error removing time slot:', error);
      // Revert local state on error
      setAvailItems(availItems);
      alert('Failed to remove time slot. Please try again.');
    }
  };

  /* Location Preference */
  const [editingLoc, setEditingLoc] = useState(false);
  const [locs, setLocs] = useState<string[]>(() => {
    // Use location_preference from database, or fallback to city/province, or empty array
    const dbLocations = user.helper_profiles?.location_preference;
    console.log('Initializing locs state:', { dbLocations, user: user.helper_profiles });
    if (dbLocations && dbLocations.length > 0) {
      console.log('Using database locations:', dbLocations);
      return dbLocations;
    }
    const userLocations = [city, province].filter(Boolean);
    console.log('Using fallback locations:', userLocations);
    return userLocations.length > 0 ? userLocations as string[] : [];
  });
  const [locInput, setLocInput] = useState("");
  const [isAddingLocation, setIsAddingLocation] = useState(false);
  const [showRemoveLocationConfirm, setShowRemoveLocationConfirm] = useState<string | null>(null);
  

  
  const addLoc = async () => {
    const s = locInput.trim();
    if (!s) return;
    if (locs.includes(s)) return; // Don't add duplicates
    if (isAddingLocation) return; // Prevent multiple simultaneous adds
    
    setIsAddingLocation(true);
    try {
      // Add to local state first
      const updatedLocs = [...locs, s];
      setLocs(updatedLocs);
    setLocInput("");
      
      console.log('=== ADDING LOCATION ===');
      console.log('Location to add:', s);
      console.log('Current locs state:', locs);
      console.log('Updated locations:', updatedLocs);
      console.log('User ID:', user.id);
      console.log('User helper_profiles:', user.helper_profiles);
      
      // Update database
      const { createClient } = await import("@/utils/supabase/client");
      const supabase = createClient();
      
      // Test database connection
      console.log('Testing database connection...');
      const { data: testData, error: testError } = await supabase
        .from('helper_profiles')
        .select('id')
        .limit(1);
      console.log('Database connection test:', { testData, testError });
      
      // First check if helper_profiles record exists
      console.log('Checking for existing helper profile...');
      const { data: existingProfile, error: checkError } = await supabase
        .from('helper_profiles')
        .select('id, location_preference')
        .eq('user_id', user.id)
        .single();
        
      console.log('Existing profile check result:', { existingProfile, checkError });
        
      if (checkError && checkError.code !== 'PGRST116') {
        console.error('Error checking helper profile:', checkError);
        setLocs(locs);
        alert(`Failed to check profile: ${checkError.message}`);
        return;
      }
      
      let result;
      if (existingProfile) {
        // Update existing record
        console.log('Updating existing helper profile...');
        console.log('Update data:', { 
          location_preference: updatedLocs,
          updated_at: new Date().toISOString()
        });
        result = await supabase
          .from('helper_profiles')
          .update({ 
            location_preference: updatedLocs,
            updated_at: new Date().toISOString()
          })
          .eq('user_id', user.id)
          .select();
        console.log('Update result:', result);
      } else {
        // Create new record
        console.log('Creating new helper profile...');
        const insertData = {
          user_id: user.id,
          location_preference: updatedLocs,
          skills: [],
          experience_years: 0,
          languages_spoken: ['English', 'Filipino'],
          is_available_live_in: false,
          preferred_work_radius: 20
        };
        console.log('Insert data:', insertData);
        result = await supabase
          .from('helper_profiles')
          .insert(insertData)
          .select();
        console.log('Insert result:', result);
      }
        
      if (result.error) {
        console.error('Error updating location preference:', result.error);
        // Revert local state on error
        setLocs(locs);
        alert(`Failed to add location: ${result.error.message}`);
      } else {
        console.log('Location preference updated successfully:', result.data);
        // Refresh the component state to reflect the database changes
        if (result.data && result.data[0]) {
          const updatedProfile = result.data[0];
          console.log('Updated profile from database:', updatedProfile);
          console.log('Setting locs to:', updatedProfile.location_preference || []);
          setLocs(updatedProfile.location_preference || []);
        } else {
          console.log('No data returned from database update');
        }
      }
    } catch (error) {
      console.error('Error adding location:', error);
      // Revert local state on error
      setLocs(locs);
      alert('Failed to add location. Please try again.');
    } finally {
      setIsAddingLocation(false);
    }
  };
  
  const removeLoc = async (l: string) => {
    try {
      // Remove from local state first
      const updatedLocs = locs.filter((x) => x !== l);
      setLocs(updatedLocs);
      
      // Update database
      const { createClient } = await import("@/utils/supabase/client");
      const supabase = createClient();
      
      const { data, error } = await supabase
        .from('helper_profiles')
        .update({ 
          location_preference: updatedLocs,
          updated_at: new Date().toISOString()
        })
        .eq('user_id', user.id)
        .select();
        
      if (error) {
        console.error('Error updating location preference:', error);
        // Revert local state on error
        setLocs(locs);
        alert('Failed to remove location. Please try again.');
      } else {
        console.log('Location preference removed successfully:', data);
        // Refresh the component state to reflect the database changes
        if (data && data[0]) {
          const updatedProfile = data[0];
          setLocs(updatedProfile.location_preference || []);
        }
      }
    } catch (error) {
      console.error('Error removing location:', error);
      // Revert local state on error
      setLocs(locs);
      alert('Failed to remove location. Please try again.');
    } finally {
      setShowRemoveLocationConfirm(null);
    }
  };

  /* Job Preferences */
  const [editingJobs, setEditingJobs] = useState(false);
  const [prefs, setPrefs] = useState<string[]>(
    (user.helper_profiles?.preferred_job_types ?? []).map(capitalizeWords)
  );
  const [prefInput, setPrefInput] = useState("");
  const [isAddingPref, setIsAddingPref] = useState(false);
  const [showRemovePrefConfirm, setShowRemovePrefConfirm] = useState<string | null>(null);

  /* Profile Picture */
  const [isUploadingProfilePicture, setIsUploadingProfilePicture] = useState(false);
  const [showProfilePictureModal, setShowProfilePictureModal] = useState(false);
  const [localProfileImageUrl, setLocalProfileImageUrl] = useState<string | null>(null);

  const uploadProfilePicture = async (file: File) => {
    if (!file) return;
    
    setIsUploadingProfilePicture(true);
    
    // Create local preview immediately
    const localUrl = URL.createObjectURL(file);
    setLocalProfileImageUrl(localUrl);
    
    try {
      const { createClient } = await import("@/utils/supabase/client");
      const supabase = createClient();
      
      // Store the current profile image URL for deletion
      const currentProfileImageUrl = profile_image_url;
      
      // Generate a unique filename
      const fileExt = file.name.split('.').pop();
      const fileName = `${user.id}/profile-picture-${Date.now()}.${fileExt}`;
      const filePath = `profile-pictures/${fileName}`;
      
      // Upload the new file to Supabase Storage
      const { data: uploadData, error: uploadError } = await supabase.storage
        .from('profile-pictures')
        .upload(fileName, file, {
          cacheControl: '3600',
          upsert: true // Replace existing file if it exists
        });
      
      if (uploadError) {
        console.error('Error uploading profile picture:', uploadError);
        alert(`Failed to upload profile picture: ${uploadError.message}`);
        // Revert local preview on error
        setLocalProfileImageUrl(null);
        return;
      }
      
      console.log('Profile picture uploaded successfully:', uploadData);
      
      // Update the user's profile_image_url in the database
      const { error: updateError } = await supabase
        .from('users')
        .update({ 
          profile_image_url: filePath,
          updated_at: new Date().toISOString()
        })
        .eq('id', user.id);
      
      if (updateError) {
        console.error('Error updating profile image URL:', updateError);
        alert(`Failed to update profile: ${updateError.message}`);
        // Revert local preview on error
        setLocalProfileImageUrl(null);
        return;
      }
      
      console.log('Profile image URL updated successfully');
      
      // Delete the previous profile picture from storage
      await deleteOldProfilePicture(currentProfileImageUrl);
      
      // Close the modal
      setShowProfilePictureModal(false);
      
      // Show success message
      alert('Profile picture updated successfully!');
      
    } catch (error) {
      console.error('Error uploading profile picture:', error);
      alert('Failed to upload profile picture. Please try again.');
      // Revert local preview on error
      setLocalProfileImageUrl(null);
    } finally {
      setIsUploadingProfilePicture(false);
    }
  };

  const handleProfilePictureChange = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) return;
    
    // Validate file type
    const allowedTypes = ['image/jpeg', 'image/jpg', 'image/png', 'image/webp'];
    if (!allowedTypes.includes(file.type)) {
      alert('Please select a valid image file (JPEG, PNG, or WebP).');
      return;
    }
    
    // Validate file size (5MB limit)
    const maxSize = 5 * 1024 * 1024; // 5MB
    if (file.size > maxSize) {
      alert('File size must be less than 5MB.');
      return;
    }
    
    uploadProfilePicture(file);
  };

  // Cleanup local URL when component unmounts
  React.useEffect(() => {
    return () => {
      if (localProfileImageUrl) {
        URL.revokeObjectURL(localProfileImageUrl);
      }
    };
  }, [localProfileImageUrl]);

  // Helper function to delete old profile picture
  const deleteOldProfilePicture = async (oldImageUrl: string | null) => {
    if (!oldImageUrl) return;
    
    try {
      const { createClient } = await import("@/utils/supabase/client");
      const supabase = createClient();
      
      // Handle different URL formats
      let filePathToDelete: string | null = null;
      
      if (oldImageUrl.startsWith('profile-pictures/')) {
        // Direct database path format: "profile-pictures/user-id/filename.ext"
        filePathToDelete = oldImageUrl.replace('profile-pictures/', '');
      } else if (oldImageUrl.includes('/storage/v1/object/public/profile-pictures/')) {
        // Full URL format: "https://project.supabase.co/storage/v1/object/public/profile-pictures/user-id/filename.ext"
        const urlParts = oldImageUrl.split('/storage/v1/object/public/profile-pictures/');
        if (urlParts.length > 1) {
          filePathToDelete = urlParts[1];
        }
      }
      
      if (filePathToDelete) {
        const { error: deleteError } = await supabase.storage
          .from('profile-pictures')
          .remove([filePathToDelete]);
        
        if (deleteError) {
          console.warn('Failed to delete old profile picture:', deleteError);
        } else {
          console.log('Old profile picture deleted successfully:', filePathToDelete);
        }
      }
    } catch (error) {
      console.warn('Error deleting old profile picture:', error);
    }
  };

  // Convert display format to database format (e.g., "Full Time" -> "full_time")
  const toJobPrefDatabaseFormat = (displayPref: string): string => {
    return displayPref.toLowerCase().replace(/\s+/g, '_');
  };

  // Convert database format to display format (e.g., "full_time" -> "Full Time")
  const toJobPrefDisplayFormat = (dbPref: string): string => {
    return dbPref.split('_').map(word => 
      word.charAt(0).toUpperCase() + word.slice(1)
    ).join(' ');
  };

  const addPref = async () => {
    const s = prefInput.trim();
    if (!s) return;
    if (prefs.includes(s)) return; // Don't add duplicates
    if (isAddingPref) return; // Prevent multiple simultaneous adds
    
    setIsAddingPref(true);
    try {
      // Add to local state first
      const updatedPrefs = [...prefs, s];
      setPrefs(updatedPrefs);
    setPrefInput("");
      
      // Convert to database format
      const dbPrefs = updatedPrefs.map(toJobPrefDatabaseFormat);
      
      // Update database
      const { createClient } = await import("@/utils/supabase/client");
      const supabase = createClient();
      
      // First check if helper_profiles record exists
      const { data: existingProfile, error: checkError } = await supabase
        .from('helper_profiles')
        .select('id')
        .eq('user_id', user.id)
        .single();
        
      if (checkError && checkError.code !== 'PGRST116') {
        console.error('Error checking helper profile:', checkError);
        setPrefs(prefs);
        alert(`Failed to check profile: ${checkError.message}`);
        return;
      }
      
      let result;
      if (existingProfile) {
        // Update existing record
        result = await supabase
          .from('helper_profiles')
          .update({ 
            preferred_job_types: dbPrefs,
            updated_at: new Date().toISOString()
          })
          .eq('user_id', user.id)
          .select();
      } else {
        // Create new record
        result = await supabase
          .from('helper_profiles')
          .insert({
            user_id: user.id,
            preferred_job_types: dbPrefs,
            skills: [],
            experience_years: 0,
            languages_spoken: ['English', 'Filipino'],
            is_available_live_in: false,
            preferred_work_radius: 20
          })
          .select();
      }
        
      if (result.error) {
        console.error('Error updating job preferences:', result.error);
        // Revert local state on error
        setPrefs(prefs);
        alert(`Failed to add job preference: ${result.error.message}`);
      } else {
        console.log('Job preferences updated successfully:', result.data);
        // Refresh the component state to reflect the database changes
        if (result.data && result.data[0]) {
          const updatedProfile = result.data[0];
          const displayPrefs = (updatedProfile.preferred_job_types || []).map(toJobPrefDisplayFormat);
          setPrefs(displayPrefs);
        }
      }
    } catch (error) {
      console.error('Error adding job preference:', error);
      // Revert local state on error
      setPrefs(prefs);
      alert('Failed to add job preference. Please try again.');
    } finally {
      setIsAddingPref(false);
    }
  };

  const removePref = async (p: string) => {
    try {
      // Remove from local state first
      const updatedPrefs = prefs.filter((x) => x !== p);
      setPrefs(updatedPrefs);
      
      // Convert to database format
      const dbPrefs = updatedPrefs.map(toJobPrefDatabaseFormat);
      
      // Update database
      const { createClient } = await import("@/utils/supabase/client");
      const supabase = createClient();
      
      const { data, error } = await supabase
        .from('helper_profiles')
        .update({ 
          preferred_job_types: dbPrefs,
          updated_at: new Date().toISOString()
        })
        .eq('user_id', user.id)
        .select();
        
      if (error) {
        console.error('Error updating job preferences:', error);
        // Revert local state on error
        setPrefs(prefs);
        alert('Failed to remove job preference. Please try again.');
      } else {
        console.log('Job preferences removed successfully:', data);
        // Refresh the component state to reflect the database changes
        if (data && data[0]) {
          const updatedProfile = data[0];
          const displayPrefs = (updatedProfile.preferred_job_types || []).map(toJobPrefDisplayFormat);
          setPrefs(displayPrefs);
        }
      }
    } catch (error) {
      console.error('Error removing job preference:', error);
      // Revert local state on error
      setPrefs(prefs);
      alert('Failed to remove job preference. Please try again.');
    } finally {
      setShowRemovePrefConfirm(null);
    }
  };

  /* Document Uploads */
  const [editingDocs, setEditingDocs] = useState(false);
  const [docs, setDocs] = useState<string[]>(() => {
    const documentPaths: string[] = [];
    
    // Add verification documents
    if (user.user_verifications?.valid_id_url) {
      documentPaths.push(user.user_verifications.valid_id_url);
    }
    if (user.user_verifications?.barangay_clearance_url) {
      documentPaths.push(user.user_verifications.barangay_clearance_url);
    }
    if (user.user_verifications?.clinic_certificate_url) {
      documentPaths.push(user.user_verifications.clinic_certificate_url);
    }
    
    // Add user documents
    if (user.user_documents) {
      user.user_documents.forEach(doc => {
        if (doc.file_path) {
          documentPaths.push(doc.file_path);
        }
      });
    }
    
    // If no documents, show placeholders
    return documentPaths.length > 0 ? documentPaths : [
    "/profile/id_placeholder_one.png",
    "/profile/id_placeholder_two.png",
    ];
  });
  const fileRef = useRef<HTMLInputElement | null>(null);
  const chooseFile = () => fileRef.current?.click();
  const onFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const f = e.target.files?.[0];
    if (!f) return;
    const url = URL.createObjectURL(f);
    setDocs((prev) => [...prev, url]);
  };
  const removeDoc = (url: string) =>
    setDocs((prev) => prev.filter((d) => d !== url));

  return (
    <main className="min-h-screen px-4 md:px-6 py-6 flex items-start justify-center">
      {/* Outer bordered container */}
      <div className="w-full max-w-6xl border border-[#E5E7EB] rounded-[30px] p-6 md:p-5 bg-white grid grid-cols-1 lg:grid-cols-12 gap-6">
        {/* Left column */}
        <div className="lg:col-span-7 space-y-4">
          {/* Personal Information */}
          <Card
            title="Personal Information"
            right={
              <button
                type="button"
                aria-label="Edit personal info"
                className="h-8 w-8 rounded-full border border-[#E5E7EB] flex items-center justify-center cursor-pointer hover:bg-gray-50 transition-colors"
                onClick={() => setShowProfilePictureModal(true)}
                title="Change profile picture"
              >
                ✎
              </button>
            }
          >
            <div className="flex items-start gap-4 mt-6 ml-5">
              <div className="relative w-[196px]">
                <div className="absolute -top-5 left-1/2 -translate-x-1/2 text-center">
                  <div className="text-[13px] font-semibold text-[#21C36D] leading-none">
                    {(() => {
                      const completed = [
                        workItems.length > 0,
                        fullName && fullAddress,
                        skills.length > 0,
                        profile_image_url,
                        selectedDays.length > 0,
                        locs.length > 0,
                        prefs.length > 0,
                        docs.length > 0 && docs[0] !== "/profile/id_placeholder_one.png"
                      ].filter(Boolean).length;
                      return Math.round((completed / 8) * 100);
                    })()}%
                  </div>
                </div>
                <div className="relative group">
                  <span className="absolute -inset-1 rounded-full" />
                  {localProfileImageUrl ? (
                    <div className="relative">
                      <img
                        src={localProfileImageUrl}
                        alt="Profile"
                        width={196}
                        height={196}
                        className="relative rounded-full object-cover cursor-pointer hover:opacity-80 transition-opacity"
                        onClick={() => setShowProfilePictureModal(true)}
                      />
                      {isUploadingProfilePicture && (
                        <div className="absolute inset-0 bg-black bg-opacity-50 rounded-full flex items-center justify-center">
                          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-white"></div>
                        </div>
                      )}
                    </div>
                  ) : (
                    <SupabaseImage
                      filePath={profile_image_url}
                      alt="Profile"
                      width={196}
                      height={196}
                      className="relative rounded-full object-cover cursor-pointer hover:opacity-80 transition-opacity"
                      fallbackSrc="/profile/profile_placeholder.png"
                      clickable={true}
                      onError={(e) => {
                        console.error('Profile image failed to load:', e.currentTarget.src);
                      }}
                      onLoad={() => {
                        console.log('Profile image loaded successfully');
                      }}
                    />
                  )}
                  {/* Edit button overlay */}
                  <button
                    onClick={() => setShowProfilePictureModal(true)}
                    className="absolute bottom-2 right-2 bg-white rounded-full p-2 shadow-lg opacity-0 group-hover:opacity-100 transition-opacity cursor-pointer hover:bg-gray-50"
                    title="Change profile picture"
                  >
                    <svg className="w-4 h-4 text-gray-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15.232 5.232l3.536 3.536m-2.036-5.036a2.5 2.5 0 113.536 3.536L6.5 21.036H3v-3.572L16.732 3.732z" />
                    </svg>
                  </button>
                </div>
              </div>
              <div className="flex-1">
                <div className="text-xl sm:text-[1.417rem] font-semibold text-[#222222] mt-1">
                  {fullName || "No name"}
                </div>
                <div className="text-sm sm:text-[1.006rem] text-[#667282] mt-1">
                  {email}
                </div>
                <div className="text-sm sm:text-[1.006rem] text-[#667282] mt-1">
                  {phone || "No phone"}
                </div>
                <div className="text-sm sm:text-[1.006rem] text-[#667282] mt-1">
                  {fullAddress || "No address provided"}
                </div>
              </div>
            </div>
          </Card>

          {/* Work History */}
          <Card
            title="Work History"
            right={
              <button
                type="button"
                aria-label="Add work"
                onClick={() => setEditingWork((v) => !v)}
                className="h-8 w-8 rounded-full border border-[#E5E7EB] flex items-center justify-center cursor-pointer hover:bg-gray-50 transition-colors"
              >
                +
              </button>
            }
          >
            {!editingWork ? (
              <>
                {workItems.length === 0 ? (
                  <div className="text-sm opacity-70">
                    No work experience has been added yet
                  </div>
                ) : (
                  <ul className="space-y-2">
                    {workItems.map((w) => (
                      <li
                        key={w.id}
                        className="rounded-md bg-white p-3 border border-white"
                      >
                        <div className="flex items-center justify-between">
                          <div className="font-medium">{w.jobTitle}</div>
                          <div className="flex gap-2">
                            <button
                              className="text-sm underline cursor-pointer hover:opacity-80 transition-opacity"
                              onClick={() => toggleCollapse(w.id)}
                            >
                              {w.collapsed ? "Expand" : "Collapse"}
                            </button>
                            <button
                              className="text-sm underline cursor-pointer hover:opacity-80 transition-opacity"
                              onClick={() => setShowRemoveConfirm(w.id)}
                            >
                              Remove
                            </button>
                          </div>
                        </div>
                        {!w.collapsed && (
                          <div className="mt-2 text-sm opacity-80">
                            <div>{w.company}</div>
                            <div>
                              {w.startMonth} {w.startYear} – {w.endMonth}{" "}
                              {w.endYear}
                            </div>
                            {w.description ? (
                              <div className="mt-1">{w.description}</div>
                            ) : null}
                          </div>
                        )}
                      </li>
                    ))}
                  </ul>
                )}
              </>
            ) : (
              <div className="space-y-4">
                <div>
                  <label className="block mb-1 profileSkills">Job Title</label>
                  <input
                    value={workForm.jobTitle}
                    onChange={(e) =>
                      setWorkForm((f) => ({ ...f, jobTitle: e.target.value }))
                    }
                    placeholder="Job Title"
                    className="w-full h-10 rounded-md border border-white bg-white px-3 outline-none"
                  />
                </div>

                <div>
                  <label className="block mb-1 profileSkills">Company</label>
                  <input
                    value={workForm.company}
                    onChange={(e) =>
                      setWorkForm((f) => ({ ...f, company: e.target.value }))
                    }
                    placeholder="Company"
                    className="w-full h-10 rounded-md border border-white bg-white px-3 outline-none"
                  />
                </div>

                <div>
                  <label className="block mb-1 profileSkills">Start Date</label>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                    <select
                      value={workForm.startMonth}
                      onChange={(e) =>
                        setWorkForm((f) => ({
                          ...f,
                          startMonth: e.target.value,
                        }))
                      }
                      className="w-full h-10 rounded-md border border-white bg-white px-3 outline-none"
                    >
                      <option value="">Month</option>
                      {months.map((m) => (
                        <option key={m} value={m}>
                          {m}
                        </option>
                      ))}
                    </select>
                    <select
                      value={workForm.startYear}
                      onChange={(e) =>
                        setWorkForm((f) => ({
                          ...f,
                          startYear: e.target.value,
                        }))
                      }
                      className="w-full h-10 rounded-md border border-white bg-white px-3 outline-none"
                    >
                      <option value="">Year</option>
                      {years.map((y) => (
                        <option key={y} value={y}>
                          {y}
                        </option>
                      ))}
                    </select>
                  </div>
                </div>

                <div>
                  <label className="block mb-1 profileSkills">End Date</label>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                    <select
                      value={workForm.endMonth}
                      onChange={(e) =>
                        setWorkForm((f) => ({ ...f, endMonth: e.target.value }))
                      }
                      className="w-full h-10 rounded-md border border-white bg-white px-3 outline-none"
                    >
                      <option value="">Month</option>
                      {months.map((m) => (
                        <option key={m} value={m}>
                          {m}
                        </option>
                      ))}
                    </select>
                    <select
                      value={workForm.endYear}
                      onChange={(e) =>
                        setWorkForm((f) => ({ ...f, endYear: e.target.value }))
                      }
                      className="w-full h-10 rounded-md border border-white bg-white px-3 outline-none"
                    >
                      <option value="">Year</option>
                      {years.map((y) => (
                        <option key={y} value={y}>
                          {y}
                        </option>
                      ))}
                    </select>
                  </div>
                </div>

                <div>
                  <label className="block mb-1 profileSkills">
                    Description
                  </label>
                  <textarea
                    value={workForm.description}
                    onChange={(e) =>
                      setWorkForm((f) => ({
                        ...f,
                        description: e.target.value,
                      }))
                    }
                    placeholder="Type Here…."
                    className="w-full min-h-[120px] rounded-md border border-white bg-white px-3 py-2 outline-none resize-y"
                  />
                </div>

                <div className="flex gap-3">
                  <GhostButton onClick={() => setEditingWork(false)}>
                    Cancel
                  </GhostButton>
                  <RedButton onClick={addWork}>Add</RedButton>
                </div>
              </div>
            )}
          </Card>

          {/* Skills */}
          <Card
            title="Skills"
            right={
              <button
                type="button"
                aria-label="Add skill"
                onClick={() => setEditingSkills((v) => !v)}
                className="h-8 w-8 rounded-full border border-[#E5E7EB] flex items-center justify-center cursor-pointer hover:bg-gray-50 transition-colors"
              >
                +
              </button>
            }
          >
            {!editingSkills ? (
              <div className="flex flex-wrap gap-2">
                {skills.map((s) => (
                  <Chip key={s} onRemove={() => setShowRemoveSkillConfirm(s)}>
                    {s}
                  </Chip>
                ))}
              </div>
            ) : (
              <div className="space-y-3">
                <div className="relative">
                <input
                    ref={skillInputRef}
                  value={skillInput}
                    onChange={(e) => {
                      setSkillInput(e.target.value);
                      setSkillDropdownOpen(true);
                    }}
                    onFocus={() => setSkillDropdownOpen(true)}
                  onKeyDown={(e) =>
                    e.key === "Enter" ? (e.preventDefault(), addSkill()) : null
                  }
                    placeholder="Type to search skills..."
                  className="w-full h-10 rounded-md border border-white bg-white px-3 outline-none"
                />
                  
                  {/* Skills Dropdown */}
                  {skillDropdownOpen && filteredSkills.length > 0 && (
                    <div 
                      ref={skillDropdownRef}
                      className="absolute top-full left-0 right-0 mt-1 bg-white border border-gray-300 rounded-md shadow-lg z-20 max-h-48 overflow-y-auto"
                    >
                      {filteredSkills.map((skill) => (
                        <button
                          key={skill}
                          type="button"
                          onClick={() => addSkill(skill)}
                          className="w-full text-left px-3 py-2 hover:bg-gray-50 border-b border-gray-100 last:border-b-0 cursor-pointer"
                        >
                          {capitalizeSkill(skill)}
                        </button>
                      ))}
                    </div>
                  )}
                </div>
                
                <div className="text-xs text-gray-500">
                  Valid skills: childcare, elderly_care, cooking, cleaning, driving, pet_care, tutoring
                </div>
                
                <div className="flex flex-wrap gap-2">
                  {skills.map((s) => (
                    <Chip key={s} onRemove={() => setShowRemoveSkillConfirm(s)}>
                      {s}
                    </Chip>
                  ))}
                </div>
                <div className="flex gap-3">
                  <GhostButton onClick={() => {
                    setEditingSkills(false);
                    setSkillInput("");
                    setSkillDropdownOpen(false);
                  }}>
                    Cancel
                  </GhostButton>
                  <RedButton onClick={() => {
                    setEditingSkills(false);
                    setSkillInput("");
                    setSkillDropdownOpen(false);
                  }}>
                    Add
                  </RedButton>
                </div>
              </div>
            )}
          </Card>

          {/* Availability */}
          <Card
            title="Availability"
            right={
              <button
                type="button"
                aria-label="Edit availability"
                onClick={() => {
                  setEditingAvail((v) => {
                    if (!v) {
                      // When opening edit mode, populate the form with current availability
                      const currentDays: Day[] = [];
                      const currentSlots: string[] = [];
                      
                      if (userAvailability) {
                        Object.entries(userAvailability).forEach(([day, schedule]) => {
                          if (schedule.available) {
                            const dayFormatted = day.charAt(0).toUpperCase() + day.slice(1).toLowerCase() as Day;
                            if (!currentDays.includes(dayFormatted)) {
                              currentDays.push(dayFormatted);
                            }
                            
                            // Handle both old and new format
                            if ('timeSlot' in schedule) {
                              const scheduleData = schedule as { timeSlot: string; morning?: boolean; evening?: boolean };
                              const timeSlot = scheduleData.timeSlot;
                              if (timeSlot && !currentSlots.includes(timeSlot)) {
                                currentSlots.push(timeSlot);
                              }
                              // Also add morning/evening if they're set
                              if (scheduleData.morning && !currentSlots.includes("Morning")) {
                                currentSlots.push("Morning");
                              }
                              if (scheduleData.evening && !currentSlots.includes("Evening")) {
                                currentSlots.push("Evening");
                              }
                            } else if ('hours' in schedule && schedule.hours) {
                              const [start, end] = schedule.hours;
                              if (start && end) {
                                const timeSlot = `${start} - ${end}`;
                                if (!currentSlots.includes(timeSlot)) {
                                  currentSlots.push(timeSlot);
                                }
                              }
                            }
                          }
                        });
                      }
                      
                      setSelectedDays(currentDays);
                      setSelectedSlots(currentSlots);
                    }
                    return !v;
                  });
                }}
                className="h-8 w-8 rounded-full border border-[#E5E7EB] flex items-center justify-center cursor-pointer hover:bg-gray-50 transition-colors"
              >
                +
              </button>
            }
          >
            {!editingAvail ? (
              <div className="space-y-3">
                {availItems.map((a) => (
                  <div key={a.id} className="flex flex-wrap gap-2 items-center">
                    {a.days.map((d) => (
                      <Chip key={d} onRemove={() => setShowRemoveAvailabilityConfirm({id: a.id, type: 'day', value: d})}>
                        {d}
                      </Chip>
                    ))}
                    {a.slots.map((s) => (
                      <Chip key={s} onRemove={() => setShowRemoveAvailabilityConfirm({id: a.id, type: 'slot', value: s})}>
                        {s}
                      </Chip>
                    ))}
                  </div>
                ))}
              </div>
            ) : (
              <div className="space-y-3">
                {/* Days Available */}
                <input
                  disabled
                  placeholder="Days Available"
                  className="w-full h-10 rounded-md border border-white bg-white px-3 outline-none opacity-60"
                />
                <div className="flex flex-wrap gap-2">
                  {allDays.map((d) => {
                    const checked = selectedDays.includes(d);
                    return (
                      <button
                        key={d}
                        type="button"
                        onClick={() => toggleDay(d)}
                        className={[
                          "h-9 rounded-md px-3 border flex items-center gap-2 cursor-pointer hover:opacity-80 transition-opacity",
                          checked
                            ? "border-[#CC0000] bg-white"
                            : "border-white bg-white/70",
                        ].join(" ")}
                      >
                        <span
                          className={[
                            "inline-flex items-center justify-center w-5 h-5 rounded-[4px] border",
                            checked
                              ? "border-[#CC0000] bg-[#CC0000]"
                              : "border-[#667282] bg-[#EDEDED]",
                          ].join(" ")}
                        >
                          {checked ? (
                            <svg
                              className="w-3 h-3 text-white"
                              viewBox="0 0 24 24"
                              fill="none"
                              stroke="currentColor"
                              strokeWidth={3}
                              strokeLinecap="round"
                              strokeLinejoin="round"
                            >
                              <path d="M5 13l4 4L19 7" />
                            </svg>
                          ) : null}
                        </span>
                        <span>{d}</span>
                      </button>
                    );
                  })}
                </div>

                {/* Time Slots */}
                <input
                  disabled
                  placeholder="Time Slots"
                  className="w-full h-10 rounded-md border border-white bg-white px-3 outline-none opacity-60"
                />
                <div className="flex flex-wrap gap-2">
                  {timeSlots.map((s) => {
                    const checked = selectedSlots.includes(s);
                    return (
                      <button
                        key={s}
                        type="button"
                        onClick={() => toggleSlot(s)}
                        className={[
                          "h-9 rounded-md px-3 border flex items-center gap-2 cursor-pointer hover:opacity-80 transition-opacity",
                          checked
                            ? "border-[#CC0000] bg-white"
                            : "border-white bg-white/70",
                        ].join(" ")}
                      >
                        <span
                          className={[
                            "inline-flex items-center justify-center w-5 h-5 rounded-[4px] border",
                            checked
                              ? "border-[#CC0000] bg-[#CC0000]"
                              : "border-[#667282] bg-[#EDEDED]",
                          ].join(" ")}
                        >
                          {checked ? (
                            <svg
                              className="w-3 h-3 text-white"
                              viewBox="0 0 24 24"
                              fill="none"
                              stroke="currentColor"
                              strokeWidth={3}
                              strokeLinecap="round"
                              strokeLinejoin="round"
                            >
                              <path d="M5 13l4 4L19 7" />
                            </svg>
                          ) : null}
                        </span>
                        <span>{s}</span>
                      </button>
                    );
                  })}
                </div>

                <div className="flex gap-3">
                  <GhostButton onClick={() => setEditingAvail(false)}>
                    Cancel
                  </GhostButton>
                  <RedButton onClick={addAvailability}>Add</RedButton>
                </div>
              </div>
            )}
          </Card>

          {/* Location Preference */}
          <Card
            title="Location Preference"
            right={
              <button
                type="button"
                aria-label="Add location"
                onClick={() => setEditingLoc((v) => !v)}
                className="h-8 w-8 rounded-full border border-[#E5E7EB] flex items-center justify-center"
              >
                +
              </button>
            }
          >
            {!editingLoc ? (
              <div className="flex flex-wrap gap-2">
                {locs.map((l) => (
                  <Chip key={l} onRemove={() => setShowRemoveLocationConfirm(l)}>
                    {l}
                  </Chip>
                ))}
                {locs.length === 0 && (
                  <div className="text-sm opacity-70">
                    No location preference found
                  </div>
                )}
              </div>
            ) : (
              <div className="space-y-3">
                <input
                  value={locInput}
                  onChange={(e) => setLocInput(e.target.value)}
                  onKeyDown={(e) =>
                    e.key === "Enter" ? (e.preventDefault(), addLoc()) : null
                  }
                  disabled={isAddingLocation}
                  placeholder="Type Here"
                  className="w-full h-10 rounded-md border border-white bg-white px-3 outline-none"
                />
                <div className="flex flex-wrap gap-2">
                  {locs.map((l) => (
                    <Chip key={l} onRemove={() => setShowRemoveLocationConfirm(l)}>
                      {l}
                    </Chip>
                  ))}
                </div>
                <div className="flex gap-3">
                  <GhostButton onClick={() => setEditingLoc(false)}>
                    Cancel
                  </GhostButton>
                  <RedButton 
                    onClick={async () => {
                      // If there's text in the input, add it first
                      if (locInput.trim()) {
                        await addLoc();
                      }
                      // Then close the edit mode
                      setEditingLoc(false);
                    }}
                    disabled={isAddingLocation}
                  >
                    {isAddingLocation ? 'Saving...' : 'Done'}
                  </RedButton>
                </div>
              </div>
            )}
          </Card>

          {/* Job Preferences */}
          <Card
            title="Job Preferences"
            right={
              <button
                type="button"
                aria-label="Add preference"
                onClick={() => setEditingJobs((v) => !v)}
                className="h-8 w-8 rounded-full border border-[#E5E7EB] flex items-center justify-center"
              >
                +
              </button>
            }
          >
            {!editingJobs ? (
              <div className="flex flex-wrap gap-2">
                {prefs.map((p) => (
                  <Chip key={p} onRemove={() => setShowRemovePrefConfirm(p)}>
                    {p}
                  </Chip>
                ))}
                {prefs.length === 0 && (
                  <div className="text-sm opacity-70">
                    No job preference found
                  </div>
                )}
              </div>
            ) : (
              <div className="space-y-3">
                <input
                  value={prefInput}
                  onChange={(e) => setPrefInput(e.target.value)}
                  onKeyDown={(e) =>
                    e.key === "Enter" ? (e.preventDefault(), addPref()) : null
                  }
                  disabled={isAddingPref}
                  placeholder="Type Here"
                  className="w-full h-10 rounded-md border border-white bg-white px-3 outline-none"
                />
                <div className="flex flex-wrap gap-2">
                  {prefs.map((p) => (
                    <Chip key={p} onRemove={() => setShowRemovePrefConfirm(p)}>
                      {p}
                    </Chip>
                  ))}
                </div>
                <div className="flex gap-3">
                  <GhostButton onClick={() => setEditingJobs(false)}>
                    Cancel
                  </GhostButton>
                  <RedButton 
                    onClick={async () => {
                      // If there's text in the input, add it first
                      if (prefInput.trim()) {
                        await addPref();
                      }
                      // Then close the edit mode
                      setEditingJobs(false);
                    }}
                    disabled={isAddingPref}
                  >
                    {isAddingPref ? 'Saving...' : 'Done'}
                  </RedButton>
                </div>
              </div>
            )}
          </Card>

          {/* Document Uploads */}
          <Card
            title="Document Uploads"
            right={
              <button
                type="button"
                aria-label="Add document"
                onClick={() => setEditingDocs((v) => !v)}
                className="h-8 w-8 rounded-full border border-[#E5E7EB] flex items-center justify-center"
              >
                +
              </button>
            }
          >
            <div className="flex flex-wrap items-center gap-3">
              {docs.map((filePath) => (
                <div key={filePath} className="relative">
                  <SupabaseImage
                    filePath={filePath.startsWith('/') ? null : filePath} // If it's a placeholder path, pass null
                    alt="ID"
                    width={180}
                    height={120}
                    className="rounded-md border border-white object-cover"
                    fallbackSrc={filePath.startsWith('/') ? filePath : "/profile/id_placeholder_one.png"}
                    clickable={!filePath.startsWith('/')} // Only make clickable if it's a real document
                    enlargedWidth={1000}
                    enlargedHeight={800}
                    onError={(e) => {
                      console.error('Document image failed to load:', e.currentTarget.src);
                    }}
                    onLoad={() => {
                      console.log('Document image loaded successfully:', filePath);
                    }}
                  />
                  <button
                    className="absolute -bottom-2 left-1/2 -translate-x-1/2 text-red-600 text-lg leading-none cursor-pointer hover:opacity-80 transition-opacity"
                    onClick={() => removeDoc(filePath)}
                    aria-label="Remove document"
                  >
                    •
                  </button>
                </div>
              ))}
            </div>

            {editingDocs && (
              <div className="mt-4 flex items-center gap-3">
                <input
                  ref={fileRef}
                  type="file"
                  accept="image/*"
                  onChange={onFileChange}
                  className="hidden"
                />
                <RedButton className="w-[140px]" onClick={chooseFile}>
                  Upload
                </RedButton>
              </div>
            )}
          </Card>
        </div>

        {/* Right column */}
        <div className="lg:col-span-5 space-y-4">
          {/* My Video */}
          <Card
            title="My Video"
            right={
              <button
                type="button"
                aria-label="Upload video"
                className="h-8 w-8 rounded-full border border-[#E5E7EB] flex items-center justify-center"
              >
                ⟳
              </button>
            }
          >
            <div className="overflow-hidden rounded-xl border border-[#E5E7EB]">
              <Image
                src="/profile/video_image_placeholder.png"
                alt="Video placeholder"
                width={640}
                height={360}
                className="w-full h-auto object-cover"
              />
            </div>
          </Card>

          {/* Progress / Tips */}
          <Card>
            <h3 className="profileLabel mb-2">
              Update your profile for better job recommendations
            </h3>
            <div className="mt-2">
              <div className="text-sm opacity-80 mb-1">
                {(() => {
                  const completed = [
                    workItems.length > 0,
                    fullName && fullAddress,
                    skills.length > 0,
                    profile_image_url,
                    selectedDays.length > 0,
                    locs.length > 0,
                    prefs.length > 0,
                    docs.length > 0 && docs[0] !== "/profile/id_placeholder_one.png"
                  ].filter(Boolean).length;
                  return Math.round((completed / 8) * 100);
                })()}% Complete
              </div>
              <div className="h-2 rounded-full bg-[#ECECEC] overflow-hidden">
                <div
                  className="h-2 bg-[#CC0000] rounded-full"
                  style={{ 
                    width: `${(() => {
                      const completed = [
                        workItems.length > 0,
                        fullName && fullAddress,
                        skills.length > 0,
                        profile_image_url,
                        selectedDays.length > 0,
                        locs.length > 0,
                        prefs.length > 0,
                        docs.length > 0 && docs[0] !== "/profile/id_placeholder_one.png"
                      ].filter(Boolean).length;
                      return Math.round((completed / 8) * 100);
                    })()}%` 
                  }}
                />
              </div>
            </div>
            <ul className="mt-3 space-y-1 text-sm">
              <li>{workItems.length > 0 ? "✔️" : "❌"} Work History</li>
              <li>{fullName && fullAddress ? "✔️" : "❌"} Personal Info</li>
              <li>{skills.length > 0 ? "✔️" : "❌"} Skills</li>
              <li>{profile_image_url ? "✔️" : "❌"} Profile Picture</li>
              <li>{selectedDays.length > 0 ? "✔️" : "❌"} Availability</li>
              <li>{locs.length > 0 ? "✔️" : "❌"} Location Preference</li>
              <li>{prefs.length > 0 ? "✔️" : "❌"} Job Preferences</li>
              <li>{docs.length > 0 && docs[0] !== "/profile/id_placeholder_one.png" ? "✔️" : "❌"} Document Uploads</li>
            </ul>
          </Card>

          {/* Logout */}
          <Card>
            <div className="flex items-center justify-between">
              <span className="profileLabel">Logout</span>
              <button
                type="button"
                className="h-8 w-8 rounded-full border border-[#E5E7EB] flex items-center justify-center"
                aria-label="Logout"
              >
                ↪
              </button>
            </div>
          </Card>
        </div>
      </div>
      
      {/* Remove Work Experience Confirmation Modal */}
      {showRemoveConfirm && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-lg p-6 max-w-md w-full">
            <h3 className="text-lg font-semibold mb-4">Remove Work Experience</h3>
            <p className="text-gray-600 mb-6">
              Are you sure you want to remove this work experience? This action cannot be undone.
            </p>
            <div className="flex gap-3 justify-end">
              <button
                onClick={() => setShowRemoveConfirm(null)}
                className="px-4 py-2 text-gray-600 border border-gray-300 rounded-md hover:bg-gray-50 transition-colors cursor-pointer"
              >
                Cancel
              </button>
              <button
                onClick={() => removeWork(showRemoveConfirm)}
                className="px-4 py-2 bg-red-600 text-white rounded-md hover:bg-red-700 transition-colors cursor-pointer"
              >
                Remove
              </button>
            </div>
          </div>
        </div>
      )}
      
      {/* Remove Skill Confirmation Modal */}
      {showRemoveSkillConfirm && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-lg p-6 max-w-md w-full">
            <h3 className="text-lg font-semibold mb-4">Remove Skill</h3>
            <p className="text-gray-600 mb-6">
              Are you sure you want to remove the skill &quot;{showRemoveSkillConfirm}&quot;? This action cannot be undone.
            </p>
            <div className="flex gap-3 justify-end">
              <button
                onClick={() => setShowRemoveSkillConfirm(null)}
                className="px-4 py-2 text-gray-600 border border-gray-300 rounded-md hover:bg-gray-50 transition-colors cursor-pointer"
              >
                Cancel
              </button>
              <button
                onClick={() => removeSkill(showRemoveSkillConfirm)}
                className="px-4 py-2 bg-red-600 text-white rounded-md hover:bg-red-700 transition-colors cursor-pointer"
              >
                Remove
              </button>
            </div>
          </div>
        </div>
      )}
      
      {/* Remove Availability Confirmation Modal */}
      {showRemoveAvailabilityConfirm && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-lg p-6 max-w-md w-full">
            <h3 className="text-lg font-semibold mb-4">Remove Availability</h3>
            <p className="text-gray-600 mb-6">
              Are you sure you want to remove {showRemoveAvailabilityConfirm.type === 'day' ? 'the day' : 'the time slot'} &quot;{showRemoveAvailabilityConfirm.value}&quot;? This action cannot be undone.
            </p>
            <div className="flex gap-3 justify-end">
              <button
                onClick={() => setShowRemoveAvailabilityConfirm(null)}
                className="px-4 py-2 text-gray-600 border border-gray-300 rounded-md hover:bg-gray-50 transition-colors cursor-pointer"
              >
                Cancel
              </button>
              <button
                onClick={() => {
                  if (showRemoveAvailabilityConfirm.type === 'day') {
                    removeDay(showRemoveAvailabilityConfirm.id, showRemoveAvailabilityConfirm.value);
                  } else {
                    removeSlot(showRemoveAvailabilityConfirm.id, showRemoveAvailabilityConfirm.value);
                  }
                  setShowRemoveAvailabilityConfirm(null);
                }}
                className="px-4 py-2 bg-red-600 text-white rounded-md hover:bg-red-700 transition-colors cursor-pointer"
              >
                Remove
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Location Remove Confirmation Modal */}
      {showRemoveLocationConfirm && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white rounded-lg p-6 max-w-sm w-full mx-4">
            <h3 className="text-lg font-semibold mb-4">Remove Location</h3>
            <p className="text-gray-600 mb-6">
              Are you sure you want to remove &quot;{showRemoveLocationConfirm}&quot; from your location preferences?
            </p>
            <div className="flex gap-3 justify-end">
              <GhostButton onClick={() => setShowRemoveLocationConfirm(null)}>
                Cancel
              </GhostButton>
              <RedButton onClick={() => removeLoc(showRemoveLocationConfirm)}>
                Remove
              </RedButton>
            </div>
          </div>
        </div>
      )}

      {/* Job Preference Remove Confirmation Modal */}
      {showRemovePrefConfirm && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white rounded-lg p-6 max-w-sm w-full mx-4">
            <h3 className="text-lg font-semibold mb-4">Remove Job Preference</h3>
            <p className="text-gray-600 mb-6">
              Are you sure you want to remove &quot;{showRemovePrefConfirm}&quot; from your job preferences?
            </p>
            <div className="flex gap-3 justify-end">
              <GhostButton onClick={() => setShowRemovePrefConfirm(null)}>
                Cancel
              </GhostButton>
              <RedButton onClick={() => removePref(showRemovePrefConfirm)}>
                Remove
              </RedButton>
            </div>
          </div>
        </div>
      )}

      {/* Profile Picture Upload Modal */}
      {showProfilePictureModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white rounded-lg p-6 max-w-md w-full mx-4">
            <h3 className="text-lg font-semibold mb-4">Change Profile Picture</h3>
            <p className="text-gray-600 mb-6">
              Select a new profile picture. Supported formats: JPEG, PNG, WebP. Maximum size: 5MB.
            </p>
            
            <div className="mb-6">
              <input
                type="file"
                accept="image/jpeg,image/jpg,image/png,image/webp"
                onChange={handleProfilePictureChange}
                disabled={isUploadingProfilePicture}
                className="w-full p-3 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-red-500"
              />
            </div>
            
            {isUploadingProfilePicture && (
              <div className="mb-4 text-center">
                <div className="inline-flex items-center px-4 py-2 bg-gray-100 rounded-md">
                  <svg className="animate-spin -ml-1 mr-3 h-5 w-5 text-gray-600" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                    <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                    <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                  </svg>
                  Uploading...
                </div>
              </div>
            )}
            
            <div className="flex gap-3 justify-end">
              <GhostButton 
                onClick={() => setShowProfilePictureModal(false)}
                disabled={isUploadingProfilePicture}
              >
                Cancel
              </GhostButton>
            </div>
          </div>
        </div>
      )}
    </main>
  );
}
