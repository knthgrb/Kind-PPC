"use client";

import { useState } from "react";
import { loginDebug } from "@/app/_actions/auth/login-debug";

export default function TestLoginPage() {
  const [result, setResult] = useState<any>(null);
  const [isLoading, setIsLoading] = useState(false);

  const handleSubmit = async (formData: FormData) => {
    setIsLoading(true);
    setResult(null);
    
    try {
      const result = await loginDebug(formData);
      setResult(result);
    } catch (error) {
      setResult({ success: false, error: "Form submission failed", details: error });
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-gray-50 p-8">
      <div className="max-w-2xl mx-auto">
        <h1 className="text-3xl font-bold text-gray-900 mb-8">Test Login Debug</h1>
        
        <div className="bg-white rounded-lg shadow p-6 mb-6">
          <h2 className="text-xl font-semibold mb-4">Login Form</h2>
          
          <form action={handleSubmit} className="space-y-4">
            <div>
              <label htmlFor="email" className="block mb-2 font-medium">
                Email
              </label>
              <input
                id="email"
                name="email"
                type="email"
                required
                className="w-full rounded-md border px-4 py-2"
                placeholder="Enter your email"
              />
            </div>
            
            <div>
              <label htmlFor="password" className="block mb-2 font-medium">
                Password
              </label>
              <input
                id="password"
                name="password"
                type="password"
                required
                className="w-full rounded-md border px-4 py-2"
                placeholder="Enter your password"
              />
            </div>
            
            <button
              type="submit"
              disabled={isLoading}
              className="w-full bg-blue-600 text-white py-2 px-4 rounded-md hover:bg-blue-700 disabled:opacity-50"
            >
              {isLoading ? "Testing..." : "Test Login"}
            </button>
          </form>
        </div>

        {result && (
          <div className="bg-white rounded-lg shadow p-6">
            <h2 className="text-xl font-semibold mb-4">Debug Result</h2>
            
            <div className="space-y-4">
              <div>
                <span className="font-medium">Success:</span>
                <span className={`ml-2 px-2 py-1 rounded text-sm ${
                  result.success ? 'bg-green-100 text-green-800' : 'bg-red-100 text-red-800'
                }`}>
                  {result.success ? 'Yes' : 'No'}
                </span>
              </div>
              
              {result.error && (
                <div>
                  <span className="font-medium">Error:</span>
                  <span className="ml-2 text-red-600">{result.error}</span>
                </div>
              )}
              
              {result.user && (
                <div>
                  <span className="font-medium">User:</span>
                  <pre className="mt-2 p-3 bg-gray-100 rounded text-sm overflow-auto">
                    {JSON.stringify(result.user, null, 2)}
                  </pre>
                </div>
              )}
              
              {result.redirectPath && (
                <div>
                  <span className="font-medium">Redirect Path:</span>
                  <span className="ml-2 text-blue-600">{result.redirectPath}</span>
                </div>
              )}
              
              {result.onboardingStatus && (
                <div>
                  <span className="font-medium">Onboarding Status:</span>
                  <pre className="mt-2 p-3 bg-gray-100 rounded text-sm overflow-auto">
                    {JSON.stringify(result.onboardingStatus, null, 2)}
                  </pre>
                </div>
              )}
              
              {result.details && (
                <div>
                  <span className="font-medium">Details:</span>
                  <pre className="mt-2 p-3 bg-gray-100 rounded text-sm overflow-auto">
                    {JSON.stringify(result.details, null, 2)}
                  </pre>
                </div>
              )}
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
