import Image from "next/image";
import Link from "next/link";

export default function LoginPage() {
  return (
    <main className="min-h-screen flex items-center justify-center px-4">
      <section className="w-full max-w-xl rounded-2xl border border-[#DFDFDF] shadow-sm p-8 md:p-10">
        <h1 className="text-center mb-8 loginH1">Login</h1>

        {/* Google SSO */}
        <button
          type="button"
          className="w-full rounded-md border border-[#D8D8D8] h-12 px-4 flex items-center justify-center gap-3 mb-8"
        >
          <Image
            src="/icons/google_ic.png"
            width={27}
            height={27}
            alt="Google"
            priority
          />
          <h2 className="loginInput">Continue with Google</h2>
        </button>

        {/* Username / Email */}
        <div className="mb-6">
          <label htmlFor="email" className="block mb-2 loginLabel">
            Enter your username or email address
          </label>
          <input
            id="email"
            name="email"
            type="text"
            placeholder="Username or email address"
            className="input-placeholder w-full rounded-md border-1 border-[#ADADAD] px-4 h-12"
          />
        </div>

        {/* Password */}
        <div className="mb-2">
          <label htmlFor="password" className="block mb-2 loginLabel">
            Enter your Password
          </label>
          <input
            id="password"
            name="password"
            type="password"
            placeholder="Password"
            className="input-placeholder w-full rounded-md border-[1px] border-[#ADADAD] px-4 h-12"
          />
        </div>

        {/* Forgot password */}
        <div className="mb-6 flex justify-end">
          <Link href="/forgot-password" className="underline underline-offset-2">
            Forgot Password?
          </Link>
        </div>

        {/* Submit */}
        <div className="flex justify-center mb-6">
          <button
            type="submit"
            className="h-12 w-[233px] rounded-md px-4 bg-[#CB0000] text-white"
          >
            Sign in
          </button>
        </div>

        {/* Footer links */}
        <p className="text-center">
          No Account ?{" "}
          <Link href="/register" className="underline underline-offset-2">
            Sign up
          </Link>
        </p>
      </section>
    </main>
  );
}
