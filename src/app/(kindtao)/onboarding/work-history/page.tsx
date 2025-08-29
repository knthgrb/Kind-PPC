import Stepper from "@/components/Stepper";
import WorkHistoryClient from "./_components/WorkHistoryClient";

export default function WorkHistoryPage() {
  return (
    <main className="min-h-screen px-4 flex items-start justify-center">
      <section className="w-full max-w-3xl rounded-2xl border border-[#DFDFDF] shadow-sm p-6 md:p-8 mt-8">
        <Stepper steps={4} activeStep={3} />
        <br />
        <h1 className="mb-4 stepsH1">Work History</h1>

        <WorkHistoryClient />
      </section>
    </main>
  );
}
