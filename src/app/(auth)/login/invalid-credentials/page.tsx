import Link from "next/link";

export default function InvalidCredentialsPage() {
  return (
    <div className="min-h-screen flex items-center justify-center px-4">
      <div className="w-full max-w-md">
        <div className="text-center mb-8">
          <div className="mx-auto w-16 h-16 bg-red-100 rounded-full flex items-center justify-center mb-4">
            <svg className="w-8 h-8 text-red-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-2.5L13.732 4c-.77-.833-1.964-.833-2.732 0L3.732 16.5c-.77.833.192 2.5 1.732 2.5z" />
            </svg>
          </div>
          
          <h1 className="text-2xl font-bold text-gray-900 mb-2">
            Invalid Login Credentials
          </h1>
          
          <p className="text-gray-600">
            The email or password you entered is incorrect.
          </p>
        </div>

        <div className="bg-white rounded-lg shadow p-6">
          <div className="mb-6">
            <h2 className="text-lg font-semibold mb-3">Please check:</h2>
            <ul className="list-disc list-inside space-y-2 text-gray-600">
              <li>Your email address is spelled correctly</li>
              <li>Your password is correct</li>
              <li>You&apos;re using the right account</li>
            </ul>
          </div>

          <div className="space-y-3">
            <Link
              href="/login"
              className="block w-full text-center bg-blue-600 text-white py-2 px-4 rounded-md hover:bg-blue-700 font-medium"
            >
              Try Again
            </Link>
            
            <Link
              href="/signup"
              className="block w-full text-center text-blue-600 hover:text-blue-800 font-medium py-2"
            >
              Create New Account
            </Link>
            
            <Link
              href="/forgot-password"
              className="block w-full text-center text-gray-600 hover:text-gray-800 font-medium py-2"
            >
              Forgot Password?
            </Link>
          </div>
        </div>
      </div>
    </div>
  );
}
