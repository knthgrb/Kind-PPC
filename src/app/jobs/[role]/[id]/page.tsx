import { redirect } from "next/navigation";
import { fetchJobById } from "@/services/jobs/fetchJobById";
import JobDetails from "./_components/jobDetails";

export default async function JobDetailsPage(props: {
  params: Promise<{ role: string; id: string }>;
}) {
  const params = await props.params;
  const job = await fetchJobById(params.id);

  if (!job) redirect("/my-profile");

  return (
    <main className="flex justify-center px-4 py-6">
      <JobDetails job={job} role={params.role} />
    </main>
  );
}
