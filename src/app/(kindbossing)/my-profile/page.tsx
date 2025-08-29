import { postedJobs } from "@/lib/kindBossing/data";
import MyProfileClient from "./_components/MyProfileClient";

export default function MyProfilePage() {
  return <MyProfileClient jobs={postedJobs} />;
}
