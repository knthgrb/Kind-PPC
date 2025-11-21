"use client";

import { useState, useEffect } from "react";
import { useQuery } from "convex/react";
import { api } from "@/utils/convex/client";
import { getEmployees } from "@/actions/employees/get-employees";
import { useToastActions } from "@/stores/useToastStore";
import { logger } from "@/utils/logger";
import {
  FaPlus,
  FaUser,
  FaBriefcase,
  FaMapMarkerAlt,
  FaEye,
  FaChevronLeft,
  FaChevronRight,
} from "react-icons/fa";
import { format } from "date-fns";
import { removeEmployee } from "@/actions/employees/remove-employee";
import { getOrCreateConversation } from "@/actions/employees/get-or-create-conversation";
import { useRouter } from "next/navigation";
import EmployeeSkeleton from "@/app/(kindbossing)/employees/_components/EmployeeSkeleton";
import { useOptionalCurrentUser } from "@/hooks/useOptionalCurrentUser";
import dynamic from "next/dynamic";
const AddEmployeeModal = dynamic(
  () => import("@/components/modals/AddEmployeeModal"),
  {
    ssr: false,
  }
);
const EmployeeDetailModal = dynamic(
  () => import("@/components/modals/EmployeeDetailModal"),
  {
    ssr: false,
  }
);
const JobActionModal = dynamic(
  () => import("@/components/modals/JobActionModal"),
  {
    ssr: false,
  }
);

export default function EmployeesPage() {
  const router = useRouter();
  const { showSuccess, showError } = useToastActions();
  const [isAddModalOpen, setIsAddModalOpen] = useState(false);
  const [viewingEmployee, setViewingEmployee] = useState<any | null>(null);
  const [actionModal, setActionModal] = useState<{
    isOpen: boolean;
    employee: any | null;
  }>({
    isOpen: false,
    employee: null,
  });
  const [employees, setEmployees] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [isLoading, setIsLoading] = useState(false);
  const [currentPage, setCurrentPage] = useState(1);
  const itemsPerPage = 10;

  // Get current user
  const { currentUser } = useOptionalCurrentUser();

  // Fetch employees when user is available
  useEffect(() => {
    const fetchEmployees = async () => {
      if (!currentUser) return;

      setLoading(true);
      try {
        const result = await getEmployees();
        if (result.success && result.employees) {
          setEmployees(result.employees);
        } else {
          logger.error("Failed to fetch employees:", result.error);
          showError("Failed to load employees");
        }
      } catch (error) {
        logger.error("Failed to fetch employees:", error);
        showError("Failed to load employees");
      } finally {
        setLoading(false);
      }
    };

    fetchEmployees();
  }, [currentUser, showError]);

  const handleEmployeeAdded = async () => {
    // Refresh employees
    const result = await getEmployees();
    if (result.success && result.employees) {
      setEmployees(result.employees);
      // Reset to first page if current page would be empty
      const newTotalPages = Math.ceil(result.employees.length / itemsPerPage);
      if (currentPage > newTotalPages && newTotalPages > 0) {
        setCurrentPage(1);
      }
    }
  };

  const handleViewEmployee = (employee: any) => {
    setViewingEmployee(employee);
  };

  const handleMessageEmployee = async (employee: any) => {
    setIsLoading(true);
    try {
      const result = await getOrCreateConversation(employee.kindtao_user_id);

      if (result.success && result.conversationId) {
        router.push(`/messages/${result.conversationId}`);
      } else {
        showError(result.error || "Failed to start conversation with employee");
      }
    } catch (error) {
      logger.error("Failed to message employee:", error);
      showError("Failed to start conversation");
    } finally {
      setIsLoading(false);
    }
  };

  const handleRemoveEmployee = async () => {
    if (!actionModal.employee) return;

    setIsLoading(true);
    try {
      const result = await removeEmployee(actionModal.employee.id);

      if (result.success) {
        showSuccess("Employee removed successfully");
        setActionModal({ isOpen: false, employee: null });
        // Refresh employees
        const fetchedEmployees = await getEmployees();
        if (fetchedEmployees.success && fetchedEmployees.employees) {
          setEmployees(fetchedEmployees.employees);
          // Reset to first page if current page would be empty
          const newTotalPages = Math.ceil(
            fetchedEmployees.employees.length / itemsPerPage
          );
          if (currentPage > newTotalPages && newTotalPages > 0) {
            setCurrentPage(1);
          }
        }
      } else {
        showError(result.error || "Failed to remove employee");
      }
    } catch (error) {
      logger.error("Failed to remove employee:", error);
      showError("Failed to remove employee");
    } finally {
      setIsLoading(false);
    }
  };

  const getStatusBadge = (status: string) => {
    const statusConfig = {
      active: {
        label: "Active",
        className: "bg-green-100 text-green-800",
      },
      inactive: {
        label: "Inactive",
        className: "bg-gray-100 text-gray-800",
      },
    };

    const config = statusConfig[status as keyof typeof statusConfig] || {
      label: status,
      className: "bg-gray-100 text-gray-800",
    };

    return (
      <span
        className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${config.className}`}
      >
        {config.label}
      </span>
    );
  };

  const formatDate = (dateString: string) => {
    try {
      return format(new Date(dateString), "MMM d, yyyy");
    } catch {
      return dateString;
    }
  };

  // Pagination calculations
  const totalPages = Math.ceil(employees.length / itemsPerPage);
  const startIndex = (currentPage - 1) * itemsPerPage;
  const endIndex = startIndex + itemsPerPage;
  const paginatedEmployees = employees.slice(startIndex, endIndex);

  const handlePageChange = (page: number) => {
    setCurrentPage(page);
    window.scrollTo({ top: 0, behavior: "smooth" });
  };

  return (
    <div className="px-4 py-4">
      <div className="mx-auto max-w-7xl space-y-8">
        <header className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
          <div>
            <p className="text-sm uppercase tracking-wide text-gray-500">
              Team Management
            </p>
            <h1 className="text-3xl font-semibold text-gray-900">Employees</h1>
            <p className="mt-2 text-sm text-gray-600">
              View and manage your employees.
            </p>
          </div>
          <div className="flex flex-wrap gap-3">
            <button
              onClick={() => setIsAddModalOpen(true)}
              className="hidden sm:inline-flex cursor-pointer items-center justify-center gap-2 rounded-xl bg-[#CB0000] px-4 py-2 text-sm font-semibold text-white hover:bg-[#a10000] transition-colors"
            >
              <FaPlus className="w-4 h-4" />
              Add Employee
            </button>
          </div>
        </header>

        {loading ? (
          <EmployeeSkeleton />
        ) : employees.length === 0 ? (
          <div className="rounded-2xl border border-dashed border-gray-300 bg-white p-10 text-center">
            <p className="text-xl font-semibold text-gray-900">
              No employees yet
            </p>
            <p className="mt-3 text-sm text-gray-600">
              Add employees to your team by selecting from matched candidates
              for your job posts.
            </p>
          </div>
        ) : (
          <div className="bg-white rounded-xl border border-gray-200 overflow-hidden">
            <div className="overflow-x-auto">
              <table className="min-w-full divide-y divide-gray-200">
                <thead className="bg-gray-50">
                  <tr>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Employee
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Job
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Location
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Status
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Added
                    </th>
                    <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Actions
                    </th>
                  </tr>
                </thead>
                <tbody className="bg-white divide-y divide-gray-200">
                  {paginatedEmployees.map((employee) => {
                    const employeeName =
                      employee.kindtao?.user?.first_name &&
                      employee.kindtao?.user?.last_name
                        ? `${employee.kindtao.user.first_name} ${employee.kindtao.user.last_name}`
                        : employee.kindtao?.user?.email || "Unknown Employee";

                    return (
                      <tr
                        key={employee.id}
                        className="hover:bg-gray-50 transition-colors"
                      >
                        <td className="px-6 py-4 whitespace-nowrap">
                          <div className="flex items-center gap-3">
                            <div className="w-10 h-10 rounded-full bg-gray-200 flex items-center justify-center shrink-0">
                              {employee.kindtao?.user?.profile_image_url ? (
                                <img
                                  src={employee.kindtao.user.profile_image_url}
                                  alt={employeeName}
                                  className="w-10 h-10 rounded-full object-cover"
                                />
                              ) : (
                                <FaUser className="w-5 h-5 text-gray-400" />
                              )}
                            </div>
                            <div>
                              <div className="text-sm font-medium text-gray-900">
                                {employeeName}
                              </div>
                              {employee.kindtao?.user?.email && (
                                <div className="text-sm text-gray-500">
                                  {employee.kindtao.user.email}
                                </div>
                              )}
                            </div>
                          </div>
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap">
                          {employee.job_post ? (
                            <div className="flex items-center gap-2 text-sm text-gray-900">
                              <FaBriefcase className="w-3 h-3 text-gray-400" />
                              <span>{employee.job_post.job_title}</span>
                            </div>
                          ) : (
                            <span className="text-sm text-gray-400">—</span>
                          )}
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap">
                          {employee.job_post?.location ? (
                            <div className="flex items-center gap-2 text-sm text-gray-900">
                              <FaMapMarkerAlt className="w-3 h-3 text-gray-400" />
                              <span>{employee.job_post.location}</span>
                            </div>
                          ) : (
                            <span className="text-sm text-gray-400">—</span>
                          )}
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap">
                          {getStatusBadge(employee.status || "active")}
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                          {formatDate(employee.created_at)}
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-right">
                          <div className="flex items-center justify-end gap-2">
                            <button
                              onClick={() => handleViewEmployee(employee)}
                              className="inline-flex cursor-pointer items-center gap-1.5 px-3 py-1.5 text-xs font-medium text-gray-700 bg-gray-100 rounded-lg hover:bg-gray-200 transition-colors"
                              title="View Details"
                            >
                              <FaEye className="w-3 h-3" />
                              <span className="hidden sm:inline">View</span>
                            </button>
                            <button
                              onClick={() => handleMessageEmployee(employee)}
                              disabled={isLoading}
                              className="inline-flex cursor-pointer items-center gap-1.5 px-3 py-1.5 text-xs font-medium text-blue-700 bg-blue-100 rounded-lg hover:bg-blue-200 transition-colors disabled:opacity-50"
                              title="Message"
                            >
                              Message
                            </button>
                            <button
                              onClick={() =>
                                setActionModal({ isOpen: true, employee })
                              }
                              disabled={isLoading}
                              className="inline-flex cursor-pointer items-center gap-1.5 px-3 py-1.5 text-xs font-medium text-red-700 bg-red-100 rounded-lg hover:bg-red-200 transition-colors disabled:opacity-50"
                              title="Remove"
                            >
                              Remove
                            </button>
                          </div>
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>

            {/* Pagination Controls */}
            {totalPages > 1 && (
              <div className="bg-white px-4 sm:px-6 py-4 border-t border-gray-200 flex flex-col sm:flex-row items-center justify-between gap-4">
                <div className="flex items-center gap-2 text-sm text-gray-700">
                  <span className="text-center sm:text-left">
                    Showing {startIndex + 1} to{" "}
                    {Math.min(endIndex, employees.length)} of {employees.length}{" "}
                    employees
                  </span>
                </div>
                <div className="flex items-center gap-2">
                  <button
                    onClick={() => handlePageChange(currentPage - 1)}
                    disabled={currentPage === 1}
                    className="inline-flex items-center gap-1.5 px-3 py-1.5 text-sm font-medium text-gray-700 bg-white border border-gray-300 rounded-lg hover:bg-gray-50 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                  >
                    <FaChevronLeft className="w-3 h-3" />
                    <span className="hidden sm:inline">Previous</span>
                  </button>

                  <div className="flex items-center gap-1">
                    {Array.from({ length: totalPages }, (_, i) => i + 1).map(
                      (page) => {
                        // Show first page, last page, current page, and pages around current
                        if (
                          page === 1 ||
                          page === totalPages ||
                          (page >= currentPage - 1 && page <= currentPage + 1)
                        ) {
                          return (
                            <button
                              key={page}
                              onClick={() => handlePageChange(page)}
                              className={`px-3 py-1.5 text-sm font-medium rounded-lg transition-colors ${
                                currentPage === page
                                  ? "bg-[#CB0000] text-white"
                                  : "text-gray-700 bg-white border border-gray-300 hover:bg-gray-50"
                              }`}
                            >
                              {page}
                            </button>
                          );
                        } else if (
                          page === currentPage - 2 ||
                          page === currentPage + 2
                        ) {
                          return (
                            <span key={page} className="px-2 text-gray-500">
                              ...
                            </span>
                          );
                        }
                        return null;
                      }
                    )}
                  </div>

                  <button
                    onClick={() => handlePageChange(currentPage + 1)}
                    disabled={currentPage === totalPages}
                    className="inline-flex items-center gap-1.5 px-3 py-1.5 text-sm font-medium text-gray-700 bg-white border border-gray-300 rounded-lg hover:bg-gray-50 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                  >
                    <span className="hidden sm:inline">Next</span>
                    <FaChevronRight className="w-3 h-3" />
                  </button>
                </div>
              </div>
            )}
          </div>
        )}
      </div>

      {/* Add Employee Modal */}
      <AddEmployeeModal
        isOpen={isAddModalOpen}
        onClose={() => setIsAddModalOpen(false)}
        onEmployeeAdded={handleEmployeeAdded}
      />

      {/* Employee Details Modal */}
      <EmployeeDetailModal
        isOpen={!!viewingEmployee}
        onClose={() => setViewingEmployee(null)}
        employee={viewingEmployee}
        onEmployeeRemoved={handleEmployeeAdded}
      />

      {/* Remove Employee Confirmation Modal */}
      <JobActionModal
        isOpen={actionModal.isOpen}
        onClose={() => setActionModal({ isOpen: false, employee: null })}
        onConfirm={handleRemoveEmployee}
        action="delete"
        jobTitle={
          actionModal.employee?.kindtao?.user?.first_name &&
          actionModal.employee?.kindtao?.user?.last_name
            ? `${actionModal.employee.kindtao.user.first_name} ${actionModal.employee.kindtao.user.last_name}`
            : actionModal.employee?.kindtao?.user?.email || "Employee"
        }
        isLoading={isLoading}
      />

      {/* Mobile FAB */}
      <button
        onClick={() => setIsAddModalOpen(true)}
        className="fixed cursor-pointer bottom-20 right-6 z-90 flex h-14 w-14 items-center justify-center rounded-full bg-[#CB0000] text-white shadow-lg transition hover:bg-[#a10000] sm:hidden"
        aria-label="Add employee"
      >
        <FaPlus className="h-5 w-5" />
      </button>
    </div>
  );
}
