import Image from "next/image";

export default function Hero() {
  return (
    <section className="relative bg-white pt-10">
      <div className="w-full mx-auto flex flex-col sm:flex-row items-center justify-between">
        {/* Left Image */}
        <div className="mb-6 sm:mb-0 self-end">
          <Image
            src="/homepage/dashboardHeroLeft.png"
            alt="Hero Left Image"
            width={255}
            height={184}
            className="object-cover rounded-lg"
          />
        </div>

        {/* Hero Text */}
        <div className="w-full sm:w-1/2 text-center flex flex-col justify-start flex-grow pt-10">
          <h1 className="text-[#05264E] leading-tight mb-4 text-center headingH1">
            Connecting{" "}
            <span className="text-[#CC0000] headingH1">kindBossing</span> <br />
            with Trusted{" "}
            <span className="text-[#CC0000] headingH1">kindTao</span>
          </h1>
          <p className="headingP mb-6 text-center mt-4">
            Easily find verified yayas, caregivers, drivers, and
            <br /> household service providers near you. Safe, fast, and
            <br /> reliable hiring has never been simpler.
          </p>
          <div className="mt-4 flex flex-col sm:flex-row justify-center sm:justify-center items-center space-y-4 sm:space-y-0 sm:space-x-4 w-full">
            <div className="flex w-full max-w-2xl rounded-lg shadow-lg py-2 px-4">
              <input
                type="text"
                placeholder="What help do you need today? (e.g., Yaya, Caregiver, Driver)"
                className="px-4 py-3 rounded-l-lg text-lg w-full"
                style={{ fontSize: "15.67px", color: "#000" }}
              />
              <button className="py-3 px-8 bg-[#CC0000] text-white rounded-lg text-lg hover:bg-red-700 w-full sm:w-auto">
                <span className="text-sm">Search</span>
              </button>
            </div>
          </div>
        </div>

        {/* Right Image */}
        <div className="mt-6 sm:mt-0">
          <Image
            src="/homepage/dashboardHeroRight.png"
            alt="Hero Right Image"
            width={278}
            height={305}
            className="object-cover rounded-lg"
          />
        </div>
      </div>
    </section>
  );
}
