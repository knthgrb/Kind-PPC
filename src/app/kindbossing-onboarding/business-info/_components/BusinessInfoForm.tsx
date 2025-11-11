"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { createClient } from "@/utils/supabase/client";
import { useAuthStore } from "@/stores/useAuthStore";
import { useForm } from "react-hook-form";
import { z } from "zod";
import { zodResolver } from "@hookform/resolvers/zod";

export default function BusinessInfoForm() {
  const [isLoading, setIsLoading] = useState(false);
  const { user } = useAuthStore();
  const [error, setError] = useState<string | null>(null);
  const router = useRouter();
  const supabase = createClient();

  const formSchema = z.object({
    businessName: z.string().optional(),
    phoneNumber: z
      .string()
      .trim()
      .min(1, { message: "Phone number is required" }),
    barangay: z.string().trim().min(1, { message: "Barangay is required" }),
    municipality: z
      .string()
      .trim()
      .min(1, { message: "Municipality/City is required" }),
    province: z.string().trim().min(1, { message: "Province is required" }),
    zipCode: z.string().min(1, { message: "ZIP Code is required" }),
  });

  type FormValues = z.infer<typeof formSchema>;

  const {
    register,
    handleSubmit,
    formState: { errors, isSubmitting },
  } = useForm<FormValues>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      businessName: "",
      phoneNumber: "",
      barangay: "",
      municipality: "",
      province: "",
      zipCode: "",
    },
  });

  const formatPhoneNumber = (phone: string) => {
    // Remove all non-digits
    const digits = phone.replace(/\D/g, "");

    // If it starts with 63, keep it as is
    if (digits.startsWith("63")) {
      return `+${digits}`;
    }

    // If it starts with 0, replace with +63
    if (digits.startsWith("0")) {
      return `+63${digits.substring(1)}`;
    }

    // If it's just 9 digits, add +63
    if (digits.length === 9) {
      return `+63${digits}`;
    }

    // Otherwise, add +63 prefix
    return `+63${digits}`;
  };

  const onSubmit = async (data: FormValues) => {
    setIsLoading(true);
    setError(null);

    try {
      const formattedPhone = formatPhoneNumber(data.phoneNumber);

      const fullAddress = `Brgy. ${data.barangay}, ${data.municipality}, ${
        data.province
      } ${data.zipCode ? data.zipCode + ", " : ""}Philippines`;

      const completeAddressForSearch = `${data.barangay}, ${
        data.municipality
      }, ${data.province} ${data.zipCode ?? ""}, Philippines`;

      const response = await fetch(
        `https://geocode.maps.co/search?q=${encodeURIComponent(
          completeAddressForSearch
        )}&api_key=${process.env.NEXT_PUBLIC_GEO_CODE_API_KEY}`
      );

      if (!response.ok) throw new Error("Error fetching geocode data");

      const geocodeData = await response.json();
      if (!Array.isArray(geocodeData) || geocodeData.length === 0) {
        setError(
          "Unable to find the location. Please check the address details."
        );
        setIsLoading(false);
        return;
      }

      const { lat, lon } = geocodeData[0];

      const [{ error: userErr }, { error: kbErr }] = await Promise.all([
        supabase
          .from("users")
          .update({
            phone: formattedPhone,
            barangay:
              data.barangay.trim().charAt(0).toUpperCase() +
              data.barangay.trim().slice(1),
            municipality:
              data.municipality.trim().charAt(0).toUpperCase() +
              data.municipality.trim().slice(1),
            province:
              data.province.trim().charAt(0).toUpperCase() +
              data.province.trim().slice(1),
            zip_code: (data.zipCode ?? "").trim() || null,
            location_coordinates: lat && lon ? `(${lon},${lat})` : null,
            updated_at: new Date().toISOString(),
          })
          .eq("id", user!.id),
        supabase.from("kindbossings").upsert(
          {
            id: crypto.randomUUID(),
            user_id: user!.id,
            business_name: (data.businessName ?? "").trim() || null,
          },
          { onConflict: "user_id" }
        ),
      ]);

      if (userErr) {
        console.error("Error updating users:", userErr);
        setError("An error occurred. Please try again.");
        return;
      }
      if (kbErr) {
        console.error("Error upserting kindbossings:", kbErr);
        setError("An error occurred. Please try again.");
        return;
      }

      await supabase.auth.updateUser({
        data: {
          has_completed_onboarding: true,
        },
      });

      router.push("/my-jobs");
    } catch (error) {
      console.error("Error updating user data:", error);
      setError("An error occurred. Please try again.");
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="w-full flex items-center justify-center px-4">
      <div className="w-full max-w-lg">
        <h1 className="text-3xl font-bold text-center mb-2">
          Business Information
        </h1>
        <p className="text-center text-sm text-gray-600 mb-8">
          Provide business details and address to help us match you with nearby
          helpers in the Philippines.
        </p>

        <form onSubmit={handleSubmit(onSubmit)} className="space-y-6">
          <div>
            <label
              htmlFor="businessName"
              className="block text-sm font-medium text-gray-700 mb-2"
            >
              Business Name{" "}
              <span className="text-xs text-gray-500">(Optional)</span>
            </label>
            <input
              id="businessName"
              type="text"
              {...register("businessName")}
              placeholder="e.g., BrightCare Homes"
              className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              disabled={isLoading}
            />
          </div>

          <div>
            <label
              htmlFor="phoneNumber"
              className="block text-sm font-medium text-gray-700 mb-2"
            >
              Phone Number
            </label>
            <input
              id="phoneNumber"
              type="tel"
              {...register("phoneNumber")}
              placeholder="e.g., 09123456789 or +639123456789"
              className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              disabled={isLoading}
            />
            {errors.phoneNumber && (
              <p className="text-xs text-red-600 mt-1">
                {errors.phoneNumber.message}
              </p>
            )}
            <p className="text-xs text-gray-500 mt-1">
              Enter your phone number with or without +63 prefix
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label
                htmlFor="barangay"
                className="block text-sm font-medium text-gray-700 mb-2"
              >
                Barangay
              </label>
              <input
                id="barangay"
                type="text"
                {...register("barangay")}
                placeholder="e.g., San Isidro"
                className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                disabled={isLoading}
              />
              {errors.barangay && (
                <p className="text-xs text-red-600 mt-1">
                  {errors.barangay.message}
                </p>
              )}
            </div>
            <div>
              <label
                htmlFor="municipality"
                className="block text-sm font-medium text-gray-700 mb-2"
              >
                Municipality/City
              </label>
              <input
                id="municipality"
                type="text"
                {...register("municipality")}
                placeholder="e.g., Quezon City"
                className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                disabled={isLoading}
              />
              {errors.municipality && (
                <p className="text-xs text-red-600 mt-1">
                  {errors.municipality.message}
                </p>
              )}
            </div>
            <div>
              <label
                htmlFor="province"
                className="block text-sm font-medium text-gray-700 mb-2"
              >
                Province
              </label>
              <input
                id="province"
                type="text"
                {...register("province")}
                placeholder="e.g., Metro Manila"
                className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                disabled={isLoading}
              />
              {errors.province && (
                <p className="text-xs text-red-600 mt-1">
                  {errors.province.message}
                </p>
              )}
            </div>
            <div>
              <label
                htmlFor="zipCode"
                className="block text-sm font-medium text-gray-700 mb-2"
              >
                ZIP Code (optional)
              </label>
              <input
                id="zipCode"
                type="text"
                {...register("zipCode")}
                placeholder="e.g., 1100"
                className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                disabled={isLoading}
              />
            </div>
          </div>

          {error && (
            <div className="text-red-600 text-sm text-center">{error}</div>
          )}

          <button
            type="submit"
            disabled={isLoading || isSubmitting}
            className="w-full bg-[#CC0000] cursor-pointer px-4 py-3 text-white rounded-lg hover:bg-brandColor/90 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
          >
            {isLoading || isSubmitting ? "Processing..." : "Continue"}
          </button>
        </form>
      </div>
    </div>
  );
}
