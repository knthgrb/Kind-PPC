"use client";

import { useState, useEffect } from "react";
import { createClient } from "@/utils/supabase/client";

type SupabaseUser = {
  id: string;
  aud: string;
  email?: string;
  phone?: string;
  app_metadata: Record<string, unknown>;
  user_metadata: Record<string, unknown>;
  created_at: string;
  [key: string]: unknown;
};

export default function KindBossingProfilePage() {
  const [user, setUser] = useState<SupabaseUser | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const supabase = createClient();
    
    const getUser = async () => {
      try {
        const { data } = await supabase.auth.getUser();
        if (data && data.user) {
          setUser(data.user as SupabaseUser);
        }
      } catch (error) {
        console.error("Error getting user:", error);
        setUser(null);
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
            Welcome to Your Family Profile!
          </h1>
          
          <p className="text-gray-600 mb-6">
            You can now post jobs and find reliable helpers for your family.
          </p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <div className="bg-white rounded-lg shadow p-6">
            <h2 className="text-xl font-semibold mb-4">Quick Actions</h2>
            <div className="space-y-3">
              <button className="w-full text-left p-3 rounded-lg border border-gray-200 hover:border-blue-300 hover:bg-blue-50 transition-colors">
                <div className="font-medium">Post a Job</div>
                <div className="text-sm text-gray-600">Create a new job listing</div>
              </button>
              
              <button className="w-full text-left p-3 rounded-lg border border-gray-200 hover:border-blue-300 hover:bg-blue-50 transition-colors">
                <div className="font-medium">View Applications</div>
                <div className="text-sm text-gray-600">See who applied to your jobs</div>
              </button>
              
              <button className="w-full text-left p-3 rounded-lg border border-gray-200 hover:border-blue-300 hover:bg-blue-50 transition-colors">
                <div className="font-medium">Browse Helpers</div>
                <div className="text-sm text-gray-600">Find helpers in your area</div>
              </button>
              
              <button className="w-full text-left p-3 rounded-lg border border-gray-200 hover:border-blue-300 hover:bg-blue-50 transition-colors">
                <div className="font-medium">Update Profile</div>
                <div className="text-sm text-gray-600">Edit your family information</div>
              </button>
            </div>
          </div>

          <div className="bg-white rounded-lg shadow p-6">
            <h2 className="text-xl font-semibold mb-4">Family Stats</h2>
            <div className="space-y-4">
              <div className="flex justify-between items-center">
                <span className="text-gray-600">Active Jobs</span>
                <span className="font-semibold">0</span>
              </div>
              
              <div className="flex justify-between items-center">
                <span className="text-gray-600">Total Applications</span>
                <span className="font-semibold">0</span>
              </div>
              
              <div className="flex justify-between items-center">
                <span className="text-gray-600">Hired Helpers</span>
                <span className="font-semibold">0</span>
              </div>
              
              <div className="flex justify-between items-center">
                <span className="text-gray-600">Family Rating</span>
                <span className="font-semibold">--</span>
              </div>
            </div>
          </div>
        </div>

        <div className="bg-white rounded-lg shadow p-6 mt-6">
          <h2 className="text-xl font-semibold mb-4">Getting Started</h2>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div className="text-center p-4 border border-gray-200 rounded-lg">
              <div className="w-12 h-12 bg-blue-100 rounded-full flex items-center justify-center mx-auto mb-3">
                <span className="text-blue-600 font-bold">1</span>
              </div>
              <h3 className="font-medium mb-2">Complete Your Profile</h3>
              <p className="text-sm text-gray-600">Add family details and preferences</p>
            </div>
            
            <div className="text-center p-4 border border-gray-200 rounded-lg">
              <div className="w-12 h-12 bg-blue-100 rounded-full flex items-center justify-center mx-auto mb-3">
                <span className="text-blue-600 font-bold">2</span>
              </div>
              <h3 className="font-medium mb-2">Post Your First Job</h3>
              <p className="text-sm text-gray-600">Describe what help you need</p>
            </div>
            
            <div className="text-center p-4 border border-gray-200 rounded-lg">
              <div className="w-12 h-12 bg-blue-100 rounded-full flex items-center justify-center mx-auto mb-3">
                <span className="text-blue-600 font-bold">3</span>
              </div>
              <h3 className="font-medium mb-2">Review Applications</h3>
              <p className="text-sm text-gray-600">Choose the best helper for your family</p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
