import Image from 'next/image';
import Link from 'next/link';

export default function Header() {
  return (
    <header className="bg-white shadow-md">
      <div className="w-full px-35 mx-auto flex justify-between items-center p-4">
        
        {/* Logo on the Left */}
        <div className="flex items-center">
          <Image src="/kindLogo.png" alt="Kind Logo" width={150} height={50} />
        </div>

        {/* Menu Links */}
        <nav className="flex space-x-10 text-lg font-medium">
          <Link href="/" className="custom-link hover:text-red-600">Home</Link>
          <Link href="/find-help" className="custom-link hover:text-red-600">Find Help</Link>
          <Link href="/find-work" className="custom-link hover:text-red-600">Find Work</Link>
          <Link href="/about" className="custom-link hover:text-red-600">About</Link>
          <Link href="/pricing" className="custom-link hover:text-red-600">Pricing</Link>
          <Link href="/contact-us" className="custom-link hover:text-red-600">Contact Us</Link>
        </nav>

        {/* Register and Sign In Button */}
        <div className="flex space-x-4">
          <Link href="/register">
            <button className="px-6 py-2 bg-white custom-link  text-lg">
              Register
            </button>
          </Link>
          <Link href="/signin">
            <button className="px-6 py-2 bg-red-600 text-white rounded-md text-lg hover:bg-red-700 custom-link-button">
              Sign In
            </button>
          </Link>
        </div>
      </div>
    </header>
  );
}
