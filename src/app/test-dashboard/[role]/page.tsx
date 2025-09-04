import dynamic from "next/dynamic";

type DashboardPageProps = {
  params: Promise<{ role: string }>;
};

export default async function DashboardPage({ params }: DashboardPageProps) {
  const { role } = await params;

  const AdminDashboard = dynamic(() => import("./_components/adminDashboard"));
  const KindBossingDashboard = dynamic(
    () => import("./_components/kindBossingDashboard")
  );

  if (role === "admin") return <AdminDashboard />;
  if (role === "kindbossing") return <KindBossingDashboard />;

  return <div>Not Found</div>;
}
