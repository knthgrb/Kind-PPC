export default function AuthCodeErrorPage() {
  return (
    <div className="min-h-screen flex items-center justify-center px-4">
      <div className="text-center">
        <h1 className="text-2xl font-bold text-red-600 mb-4">
          Authentication Error
        </h1>
        <p className="text-gray-600 mb-6">
          There was an error with your authentication. Please try again.
        </p>
        <a
          href="/login"
          className="bg-blue-500 text-white px-6 py-2 rounded-lg hover:bg-blue-600"
        >
          Back to Login
        </a>
      </div>
    </div>
  );
}
