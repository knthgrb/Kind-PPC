import { IoIosMail } from "react-icons/io";
import { GoVerified } from "react-icons/go";

export default function Subscribe() {
  return (
    <section className="bg-white pt-[100px]">
      <div className="max-w-7xl bg-red-700 mx-auto rounded-2xl py-8 px-6 sm:py-10 sm:px-12 md:py-14 md:px-20">
        {/* default: column; lg: row */}
        <div className="flex flex-col lg:flex-row justify-between gap-8 text-center lg:text-left">
          {/* text */}
          <div className="w-full lg:w-1/2 flex flex-col justify-center">
            <p className="subscribeH2">Never Miss an Opportunity</p>
            <p className="subscribeH2">
              Subscribe for latest job postings to your inbox.
            </p>
          </div>

          {/* form */}
          <div className="w-full lg:w-1/2 flex flex-col gap-4 items-center lg:items-start">
            <div className="flex items-center bg-white rounded-lg px-8 py-6 w-full">
              <IoIosMail className="text-red-700 text-xl mr-2" />
              <input
                type="email"
                placeholder="Enter your email"
                className="subscribeP flex-1 bg-transparent text-red-700 placeholder-red-700 focus:outline-none"
              />
            </div>
            <button className="subscribeP flex items-center justify-center gap-2 px-8 py-4 bg-white text-red-700 rounded-lg w-full lg:w-fit border-2 border-transparent hover:border-white hover:bg-[#CC0000] hover:text-white">
              <GoVerified className="text-xl" />
              Subscribe
            </button>
          </div>
        </div>
      </div>
    </section>
  );
}
