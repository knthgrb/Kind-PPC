import Stepper from "@/components/Stepper";
import PersonalInfoClient from "./_components/PersonalInfoClient";

export default function PersonalInfoForm() {
  return (
    <main className="min-h-screen px-4 flex items-start justify-center">
      <section className="w-full max-w-3xl rounded-2xl border border-[#DFDFDF] shadow-sm p-6 md:p-8 mt-8 bg-white">
        <Stepper steps={4} activeStep={1} />
        <br />
        <h1 className="mb-6 stepsH1">Personal Information</h1>

        <PersonalInfoClient />
      </section>
    </main>
  );
}
