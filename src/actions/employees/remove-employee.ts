"use server";

import { getServerActionContext } from "@/utils/server-action-context";
import { api } from "@/utils/convex/server";
import { logger } from "@/utils/logger";

export async function removeEmployee(
  employeeId: string
): Promise<{ success: boolean; error?: string }> {
  try {
    const { convex, user, error } = await getServerActionContext({
      requireUser: true,
    });

    if (error || !user) {
      return { success: false, error: "Unauthorized" };
    }

    if (!convex) {
      return { success: false, error: "Database connection failed" };
    }

    // Extract user ID
    const userId =
      (user as { userId?: string | null })?.userId ??
      (user as { id?: string | null })?.id ??
      (user as { _id?: string | null })?._id ??
      null;

    if (!userId) {
      return { success: false, error: "User ID not found" };
    }

    // Verify the employee belongs to the user
    const employee = await convex.query(api.employees.getEmployeeById, {
      employeeId: employeeId as any,
    }) as any;

    if (!employee) {
      return { success: false, error: "Employee not found" };
    }

    if (employee.kindbossing_user_id !== userId) {
      return { success: false, error: "Unauthorized to remove this employee" };
    }

    await convex.mutation(api.employees.removeEmployee, {
      employeeId: employee._id,
    });

    logger.info("Employee removed successfully:", { employeeId, userId });

    return { success: true };
  } catch (err) {
    logger.error("Failed to remove employee:", err);
    return {
      success: false,
      error: err instanceof Error ? err.message : "Failed to remove employee",
    };
  }
}

