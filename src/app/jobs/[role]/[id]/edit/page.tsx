import { redirect } from "next/navigation";
import { JobService } from "@/services/JobService";
import JobForm from "../_components/jobForm";

export default async function EditJobPage({
  params,
}: {
  params: { role: string; id: string };
}) {
  const job = await JobService.fetchById(params.id);

  if (!job) redirect("/my-profile");

  return (
    <main className="flex justify-center px-4 py-6">
      <JobForm job={job} />
    </main>
  );
}
