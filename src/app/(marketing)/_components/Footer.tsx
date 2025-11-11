import Image from "next/image";
import Link from "next/link";
import { FaFacebookF, FaTwitter, FaLinkedinIn } from "react-icons/fa";

export default function Footer() {
  return (
    <footer className="bg-white shadow-md pt-[75px] py-12">
      <div
        className="
          max-w-7xl mx-auto px-4 
          grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-12 
          gap-8 gap-y-12
        "
      >
        {/* Logo + description */}
        <div className="col-span-12 sm:col-span-6 lg:col-span-3 space-y-6 justify-center text-center lg:text-left">
          <Image
            src="/kindLogo.png"
            alt="Kind Logo"
            width={120}
            height={60}
            className="mx-auto lg:mx-0"
          />
          <p className="footerSubText max-w-sm mx-auto lg:mx-0">
            Lorem Ipsum is simply dummy text of the printing and typesetting
            industry. Lorem Ipsum has been the industry&apos;s standard dummy
            text.
          </p>
          <div className="flex justify-center lg:justify-start space-x-4">
            <span className="bg-red-600 text-white p-2 rounded-full hover:bg-red-700 cursor-pointer">
              <FaFacebookF className="w-4 h-4" />
            </span>
            <span className="bg-red-600 text-white p-2 rounded-full hover:bg-red-700 cursor-pointer">
              <FaTwitter className="w-4 h-4" />
            </span>
            <span className="bg-red-600 text-white p-2 rounded-full hover:bg-red-700 cursor-pointer">
              <FaLinkedinIn className="w-4 h-4" />
            </span>
          </div>
        </div>

        {/* Links section */}
        <div className="col-span-12 sm:col-span-6 lg:col-span-6 grid grid-cols-2 sm:grid-cols-4 gap-8 text-center lg:text-left">
          <div className="space-y-4">
            <h3 className="footerH4">Resources</h3>
            <div className="flex flex-col space-y-2">
              <Link href="/how-it-works" className="footerP hover:text-red-600">
                How It Works
              </Link>
              <Link href="/pricing" className="footerP hover:text-red-600">
                Pricing
              </Link>
              <Link href="/faq" className="footerP hover:text-red-600">
                FAQ
              </Link>
            </div>
          </div>

          <div className="space-y-4">
            <h3 className="footerH4">Community</h3>
            <div className="flex flex-col space-y-2">
              <Link href="/recs" className="footerP hover:text-red-600">
                Find Work
              </Link>
              <Link href="/find-help" className="footerP hover:text-red-600">
                Find Help
              </Link>
              <Link href="/about" className="footerP hover:text-red-600">
                About Us
              </Link>
            </div>
          </div>

          <div className="space-y-4">
            <h3 className="footerH4">Quick links</h3>
            <div className="flex flex-col space-y-2">
              <Link href="/register" className="footerP hover:text-red-600">
                Sign Up
              </Link>
              <Link href="/login" className="footerP hover:text-red-600">
                Login
              </Link>
              <Link href="/contact-us" className="footerP hover:text-red-600">
                Contact Us
              </Link>
            </div>
          </div>

          <div className="space-y-4">
            <h3 className="footerH4">More</h3>
            <div className="flex flex-col space-y-2">
              <Link href="/privacy" className="footerP hover:text-red-600">
                Privacy Policy
              </Link>
              <Link href="/terms" className="footerP hover:text-red-600">
                Terms of Use
              </Link>
              <Link href="/help" className="footerP hover:text-red-600">
                Help
              </Link>
            </div>
          </div>
        </div>

        {/* App downloads */}
        <div className="col-span-12 sm:col-span-6 lg:col-span-3 space-y-6 text-center lg:text-left">
          <h3 className="footerH4">Download Our App</h3>
          <p className="footerSubText">Available soon on Android and iOS</p>
          <div className="flex flex-col sm:flex-row justify-center lg:justify-start gap-4">
            <Link href="https://apps.apple.com">
              <Image
                src="/homepage/appStore.png"
                alt="Download on the App Store"
                width={150}
                height={50}
                className="hover:opacity-90 cursor-pointer mx-auto sm:mx-0"
              />
            </Link>
            <Link href="https://play.google.com">
              <Image
                src="/homepage/googlePlay.png"
                alt="Get it on Google Play"
                width={150}
                height={50}
                className="hover:opacity-90 cursor-pointer mx-auto sm:mx-0"
              />
            </Link>
          </div>
        </div>
      </div>
    </footer>
  );
}
