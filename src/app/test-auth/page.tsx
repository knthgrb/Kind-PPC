"use client";

import { useState, useEffect } from "react";
import { createClient } from "@/utils/supabase/client";

export default function TestAuthPage() {
  const [user, setUser] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const supabase = createClient();
    
    const checkAuth = async () => {
      try {
        const { data: { user }, error } = await supabase.auth.getUser();
        
        if (error) {
          setError(error.message);
        } else {
          setUser(user);
        }
      } catch (err) {
        setError("Failed to check auth");
      } finally {
        setLoading(false);
      }
    };

    checkAuth();

    // Listen for auth changes
    const { data: { subscription } } = supabase.auth.onAuthStateChange((event, session) => {
      setUser(session?.user ?? null);
    });

    return () => subscription.unsubscribe();
  }, []);

  const handleSignOut = async () => {
    const supabase = createClient();
    await supabase.auth.signOut();
    setUser(null);
  };

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-xl">Loading...</div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50 p-8">
      <div className="max-w-2xl mx-auto">
        <h1 className="text-3xl font-bold text-gray-900 mb-8">Authentication Test</h1>
        
        <div className="bg-white rounded-lg shadow p-6">
          {error ? (
            <div className="text-red-600 mb-4">
              <strong>Error:</strong> {error}
            </div>
          ) : null}
          
          {user ? (
            <div className="space-y-4">
              <h2 className="text-xl font-semibold text-green-600">✅ Authenticated</h2>
              
              <div>
                <strong>User ID:</strong> {user.id}
              </div>
              
              <div>
                <strong>Email:</strong> {user.email}
              </div>
              
              <div>
                <strong>Email Verified:</strong> {user.email_confirmed_at ? 'Yes' : 'No'}
              </div>
              
              <div>
                <strong>Created At:</strong> {new Date(user.created_at).toLocaleString()}
              </div>
              
              <div>
                <strong>Last Sign In:</strong> {user.last_sign_in_at ? new Date(user.last_sign_in_at).toLocaleString() : 'Never'}
              </div>
              
              <button
                onClick={handleSignOut}
                className="bg-red-600 text-white px-4 py-2 rounded-md hover:bg-red-700"
              >
                Sign Out
              </button>
            </div>
          ) : (
            <div className="space-y-4">
              <h2 className="text-xl font-semibold text-red-600">❌ Not Authenticated</h2>
              
              <p>You are not currently logged in.</p>
              
              <a
                href="/login"
                className="inline-block bg-blue-600 text-white px-4 py-2 rounded-md hover:bg-blue-700"
              >
                Go to Login
              </a>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
