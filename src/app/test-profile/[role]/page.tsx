import dynamic from "next/dynamic";

type ProfilePageProps = {
  params: Promise<{ role: string }>;
};

export default async function ProfilePage({ params }: ProfilePageProps) {
  const { role } = await params;

  const KindBossingProfile = dynamic(
    () => import("./_components/kindBossingProfile")
  );
  const KindTaoProfile = dynamic(() => import("./_components/kindTaoProfile"));

  if (role === "kindbossing") return <KindBossingProfile />;
  if (role === "kindtao") return <KindTaoProfile />;

  return <div>Not Found</div>;
}
