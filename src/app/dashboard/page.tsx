import React from "react";
import { UserService } from "@/services/server/UserService";
import { redirect } from "next/navigation";
import dynamic from "next/dynamic";

const KindTaoDashboard = dynamic(
  () => import("../(kindtao)/_components/KindTaoDashboard")
);
const KindBossingDashboard = dynamic(
  () => import("../(kindbossing)/_components/KindBossingDashboard")
);

const AdminDashboard = dynamic(
  () => import("../(admin)/_components/AdminDashboard")
);

export default async function Dashboard() {
  const { role } = await UserService.getCurrentUserRole();

  if (role === "kindtao") return <KindTaoDashboard />;
  if (role === "kindbossing") return <KindBossingDashboard />;
  if (role === "admin") return <AdminDashboard />;

  redirect("/error");
}
