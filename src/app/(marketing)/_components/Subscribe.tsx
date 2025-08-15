import Image from "next/image";
import { IoIosMail } from "react-icons/io";
import { GoVerified } from "react-icons/go";

export default function Subscribe() {
  return (
    <section className="bg-white pt-[100px]">
      <div className="max-w-7xl bg-red-700 mx-auto rounded-2xl py-[55px] px-[75px]">
        <div className="flex justify-between gap-8">
          <div className="w-1/2">
            <p className="subscribeH2">Never Miss an Opportunity</p>
            <p className="subscribeH2">
              Subscribe for latest job postings to your inbox.
            </p>
          </div>
          <div className="w-1/2 flex flex-col gap-4">
            <div className="flex items-center bg-white rounded-lg px-8 py-6">
              <IoIosMail className="text-red-700 text-xl mr-2" />
              <input
                type="email"
                placeholder="Enter your email"
                className="subscribeP flex-1 bg-transparent text-red-700 placeholder-red-700 focus:outline-none"
              />
            </div>
            <button className="subscribeP flex items-center gap-2 px-8 py-4 bg-white text-red-700 rounded-lg w-fit border-2 border-transparent hover:border-white hover:bg-[#CC0000] hover:text-white">
              <GoVerified className="text-xl" />
              Subscribe
            </button>
          </div>
        </div>
      </div>
    </section>
  );
}
