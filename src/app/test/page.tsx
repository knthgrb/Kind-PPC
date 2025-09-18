"use client";

import { getMultipleUsers } from "@/actions/user/get-multiple-users";
import { useState } from "react";

export default function TestPage() {
  const testUserId = "29cae447-9a4b-4520-96d7-db68034dac5a";
  const [result, setResult] = useState<any>(null);
  const [loading, setLoading] = useState(false);

  const handleTest = async () => {
    setLoading(true);
    console.log("Testing getMultipleUsers with ID:", testUserId);

    const testResult = await getMultipleUsers([testUserId]);
    setResult(testResult);
    console.log("Result:", testResult);
    setLoading(false);
  };

  return (
    <div className="p-8">
      <h1 className="text-2xl font-bold mb-4">User Details Test</h1>
      <p className="mb-4">Testing getMultipleUsers with ID: {testUserId}</p>

      <button
        onClick={handleTest}
        disabled={loading}
        className="bg-blue-500 hover:bg-blue-700 text-white font-bold py-2 px-4 rounded disabled:opacity-50"
      >
        {loading ? "Testing..." : "Test getMultipleUsers"}
      </button>

      {result && (
        <div className="mt-8">
          <h2 className="text-xl font-semibold mb-4">Result:</h2>
          <pre className="bg-gray-100 p-4 rounded overflow-auto">
            {JSON.stringify(result, null, 2)}
          </pre>
        </div>
      )}
    </div>
  );
}
