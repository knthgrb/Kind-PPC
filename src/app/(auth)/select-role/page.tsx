"use client";

import { useState, useEffect } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import Link from "next/link";
import Image from "next/image";
import { useConvex } from "convex/react";
import { api } from "@/utils/convex/client";
import { useSession, authClient } from "@/lib/auth-client";
import RoleCard from "@/app/(marketing)/_components/RoleCard";
import { logger } from "@/utils/logger";

export default function SelectRolePage() {
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const router = useRouter();
  const searchParams = useSearchParams();
  const convex = useConvex();
  const { data: session, isPending: sessionLoading } = useSession();

  // Wait for session to be available after OAuth redirect
  useEffect(() => {
    if (!sessionLoading && !session?.user) {
      // Session not available - try refreshing after a short delay
      const timer = setTimeout(() => {
        logger.warn("Session not available on select-role page, refreshing...");
        window.location.reload();
      }, 1000);
      return () => clearTimeout(timer);
    }
  }, [sessionLoading, session]);

  const handleRoleSelection = async (role: "kindbossing" | "kindtao") => {
    if (isLoading || sessionLoading || !session?.user) {
      return; // Prevent clicks while loading or no session
    }
    await proceedWithRole(role);
  };

  const proceedWithRole = async (role: "kindbossing" | "kindtao") => {
    setIsLoading(true);
    setError(null);

    try {
      // Use session from hook (already available)
      if (!session?.user) {
        // Try to get session one more time
        const freshSession = await authClient.getSession();
        if (!freshSession?.data?.session?.user) {
          throw new Error("No authenticated user. Please try signing in again.");
      }
        const authUser = freshSession.data.session.user;
        await updateUserRole(authUser, role);
      } else {
        await updateUserRole(session.user, role);
      }
    } catch (error) {
      logger.error("Error updating role:", error);
      setError(
        error instanceof Error
          ? error.message
          : "An error occurred. Please try again."
      );
    } finally {
      setIsLoading(false);
    }
  };

  const updateUserRole = async (
    authUser: { id: string; email?: string | null; name?: string | null; image?: string | null },
    role: "kindbossing" | "kindtao"
  ) => {
      const nameParts = (authUser.name || "").split(" ");
      const firstName = nameParts[0] || "";
      const lastName = nameParts.slice(1).join(" ") || "";

    // Check if user exists in Convex using authenticated client
      const existingUser = await convex.query(api.users.getUserById, {
        userId: authUser.id,
      });

      // Create or update user in Convex
      if (!existingUser) {
        await convex.mutation(api.users.createUser, {
          id: authUser.id,
          email: authUser.email || "",
          role,
          first_name: firstName,
          last_name: lastName,
          profile_image_url: authUser.image || null,
          has_completed_onboarding: false,
        });
      } else {
        // Update role if different
        if (existingUser.role !== role) {
          await convex.mutation(api.users.updateUser, {
            userId: authUser.id,
            updates: { role },
          });
        }
      }

      // Redirect to onboarding
      if (role === "kindbossing") {
        router.push("/kindbossing-onboarding/business-info");
      } else {
        router.push("/kindtao-onboarding");
    }
  };

  // Show role selection
  return (
    <main className="min-h-screen flex items-start justify-center px-4 relative">
      {/* Logo in upper left */}
      <Link href="/" className="absolute top-6 left-6 z-10">
        <Image
          src="/kindLogo.png"
          width={120}
          height={40}
          alt="Kind"
          priority
          className="h-8 w-auto"
        />
      </Link>
      <section className="w-full max-w-5xl">
        <div className="text-center mt-10 mb-8">
          <h1 className="mb-2 signupH1">Choose Your Role</h1>
          <h2 className="signupH2">
            Are you looking to hire help or find rewarding
            <br /> household work?
          </h2>
        </div>

        <div className="flex flex-col md:flex-row items-center justify-center gap-4 md:gap-6">
          <RoleCard
            selected={false}
            onSelect={() => handleRoleSelection("kindbossing")}
            iconSrc="/icons/reg_kind_bossing.png"
            title="I'm a kindBossing, looking to hire:"
            bullets={[
              "Quickly find verified, reliable help tailored to your family's needs.",
              "Access trusted yayas, caregivers, helpers, drivers, and skilled labor.",
              "Benefit from built-in HR management tools for stress-free hiring.",
            ]}
          />

          <RoleCard
            selected={false}
            onSelect={() => handleRoleSelection("kindtao")}
            iconSrc="/icons/reg_kind_tao.png"
            title="I'm a kindTao, looking for work:"
            bullets={[
              "Easily find flexible and rewarding household employment.",
              "Showcase your skills and connect with kindBossing who value you.",
              "Enjoy secure communication and straightforward job applications.",
            ]}
          />
        </div>

        {sessionLoading && (
          <div className="flex justify-center mt-6">
            <p className="text-gray-600 text-center">
              Loading your account...
            </p>
          </div>
        )}

        {!sessionLoading && !session?.user && (
          <div className="flex justify-center mt-6">
            <p className="text-yellow-600 text-center">
              Waiting for authentication... Please wait a moment.
            </p>
          </div>
        )}

        {error && (
          <div className="flex justify-center mt-6">
            <p className="text-red-600 text-center">{error}</p>
          </div>
        )}

        {isLoading && (
          <div className="flex justify-center mt-6">
            <p className="text-gray-600 text-center">
              Setting up your account...
            </p>
          </div>
        )}
      </section>
    </main>
  );
}
