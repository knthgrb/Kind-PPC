"use client";

import { useState, useEffect } from "react";
import { createClient } from "@/utils/supabase/client";

interface SupabaseUser {
  id: string;
  email?: string;
  user_metadata?: {
    role?: string;
    first_name?: string;
    last_name?: string;
  };
}

export default function KindBossingProfilePage() {
  const [user, setUser] = useState<SupabaseUser | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const supabase = createClient();
    
    const getUser = async () => {
      try {
        const { data: { user } } = await supabase.auth.getUser();
        if (user) {
          setUser(user as SupabaseUser);
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
            Welcome to Your KindBossing Profile!
          </h1>
          
          <p className="text-gray-600 mb-6">
            You are logged in as a KindBossing user. This is your profile dashboard.
          </p>

          <div className="mb-6">
            <h2 className="text-xl font-semibold mb-4">User Information</h2>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <span className="text-gray-600">Email:</span>
                <span className="ml-2 font-medium">{user.email}</span>
              </div>
              <div>
                <span className="text-gray-600">Role:</span>
                <span className="ml-2 font-medium">{user.user_metadata?.role || 'kindbossing'}</span>
              </div>
              <div>
                <span className="text-gray-600">Name:</span>
                <span className="ml-2 font-medium">
                  {user.user_metadata?.first_name} {user.user_metadata?.last_name}
                </span>
              </div>
            </div>
          </div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <div className="bg-white rounded-lg shadow p-6">
            <h2 className="text-xl font-semibold mb-4">Quick Actions</h2>
            <div className="space-y-3">
              <button className="w-full text-left p-3 rounded-lg border border-gray-200 hover:border-blue-300 hover:bg-blue-50 transition-colors">
                <div className="font-medium">Post a Job</div>
                <div className="text-sm text-gray-600">Create new job listings</div>
              </button>
              
              <button className="w-full text-left p-3 rounded-lg border border-gray-200 hover:border-blue-300 hover:bg-blue-50 transition-colors">
                <div className="font-medium">Manage Jobs</div>
                <div className="text-sm text-gray-600">View and edit your job posts</div>
              </button>
              
              <button className="w-full text-left p-3 rounded-lg border border-gray-200 hover:border-blue-300 hover:bg-blue-50 transition-colors">
                <div className="font-medium">View Applications</div>
                <div className="text-sm text-gray-600">Review job applications</div>
              </button>
            </div>
          </div>

          <div className="bg-white rounded-lg shadow p-6">
            <h2 className="text-xl font-semibold mb-4">Profile Stats</h2>
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
                <span className="text-gray-600">Response Rate</span>
                <span className="font-semibold">--</span>
              </div>
              
              <div className="flex justify-between items-center">
                <span className="text-gray-600">Profile Views</span>
                <span className="font-semibold">0</span>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
