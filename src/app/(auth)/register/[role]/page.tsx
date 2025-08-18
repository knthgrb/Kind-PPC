import Image from "next/image";
import Link from "next/link";

export default async function SignUpPage({
  params,
}: {
  params: { role: string };
}) {
  return (
    <main className="min-h-screen flex items-center justify-center px-4">
      <section className="w-full max-w-xl rounded-2xl border border-[#DFDFDF] shadow-sm p-8 md:p-10">
        <h1 className="text-center mb-8 registerH1">Sign up</h1>

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
          <span className="registerInput">Continue with Google</span>
        </button>

        {/* Email */}
        <div className="mb-6">
          <label htmlFor="email" className="block mb-2 registerLabel">
            Enter your email address
          </label>
          <input
            id="email"
            name="email"
            type="email"
            placeholder="Username or email address"
            className="registerInput w-full rounded-md border-[1px] border-[#ADADAD] px-4 h-12"
          />
        </div>

        {/* Name row */}
        <div className="mb-6 grid grid-cols-1 md:grid-cols-2 gap-3">
          <div>
            <label htmlFor="firstName" className="block mb-2 registerLabel">
              First name
            </label>
            <input
              id="firstName"
              name="firstName"
              type="text"
              placeholder="First name"
              className="registerInput w-full rounded-md border-[1px] border-[#ADADAD] px-4 h-12"
            />
          </div>

          <div>
            <label htmlFor="lastName" className="block mb-2 registerLabel">
              Last name
            </label>
            <input
              id="lastName"
              name="lastName"
              type="text"
              placeholder="Last Name"
              className="registerInput w-full rounded-md border-[1px] border-[#ADADAD] px-4 h-12"
            />
          </div>
        </div>

        {/* Business name */}
        <div className="mb-6">
          <label htmlFor="businessName" className="block mb-2 registerLabel">
            Business Name
          </label>
          <input
            id="businessName"
            name="businessName"
            type="text"
            placeholder="BrightCare Homes"
            className="registerInput w-full rounded-md border-[1px] border-[#ADADAD] px-4 h-12"
          />
        </div>

        {/* Phone */}
        <div className="mb-6">
          <label htmlFor="phone" className="block mb-2 registerLabel">
            Enter your Phone
          </label>
          <div className="flex gap-2">
            <div className="flex items-center gap-2 rounded-md border-[1px] border-[#ADADAD] h-12 px-3">
              <Image
                src="/icons/ph_flag.png"
                width={24}
                height={16}
                alt="Philippines Flag"
              />
              <span>+63</span>
            </div>
            <input
              id="phone"
              name="phone"
              type="tel"
              placeholder="Phone Number"
              className="registerInput flex-1 rounded-md border-[1px] border-[#ADADAD] px-4 h-12"
            />
          </div>
        </div>

        {/* Password */}
        <div className="mb-6">
          <label htmlFor="password" className="block mb-2 registerLabel">
            Enter your Password
          </label>
          <input
            id="password"
            name="password"
            type="password"
            placeholder="Password"
            className="registerInput w-full rounded-md border-[1px] border-[#ADADAD] px-4 h-12"
          />
        </div>

        {/* Submit */}
        <div className="flex justify-center mb-6">
          <button
            type="submit"
            className="h-12 w-[233px] rounded-md px-4 bg-[#CB0000] text-white"
          >
            Register
          </button>
        </div>

        {/* Footer */}
        <p className="text-center">
          Have an Account ?{" "}
          <Link href="/login" className="underline underline-offset-2">
            Sign in
          </Link>
        </p>
      </section>
    </main>
  );
}
