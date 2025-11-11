"use client";

import { useState, useEffect } from "react";
import { createPortal } from "react-dom";
import { useAuthStore } from "@/stores/useAuthStore";
import { getEmployees } from "@/actions/employees/get-employees";
import { removeEmployee } from "@/actions/employees/remove-employee";
import { Employee } from "@/types/employee";
import MyEmployeesClient from "./_components/MyEmployeesClient";
import AddEmployeeModal from "@/components/modals/AddEmployeeModal";
import EmployeeDetailModal from "@/components/modals/EmployeeDetailModal";
import { LuFilter, LuSearch, LuPlus } from "react-icons/lu";
import { FaUsers, FaCalendar, FaTimes, FaTrash } from "react-icons/fa";
import PrimaryButton from "@/components/buttons/PrimaryButton";
import { useToastActions } from "@/stores/useToastStore";

export default function MyEmployees() {
  const { user } = useAuthStore();
  const [employees, setEmployees] = useState<Employee[]>([]);
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState<"all" | "active" | "inactive">("all");
  const [searchTerm, setSearchTerm] = useState("");
  const [isAddEmployeeModalOpen, setIsAddEmployeeModalOpen] = useState(false);
  const [selectedEmployee, setSelectedEmployee] = useState<Employee | null>(
    null
  );
  const [isEmployeeDetailModalOpen, setIsEmployeeDetailModalOpen] =
    useState(false);
  const [employeeToRemove, setEmployeeToRemove] = useState<Employee | null>(
    null
  );
  const [showRemoveConfirm, setShowRemoveConfirm] = useState(false);
  const [removeText, setRemoveText] = useState("");
  const [removeError, setRemoveError] = useState("");
  const [isRemoving, setIsRemoving] = useState(false);
  const { showSuccess, showError } = useToastActions();

  useEffect(() => {
    if (user?.id) {
      loadEmployees();
    }
  }, [user]);

  const loadEmployees = async () => {
    try {
      setLoading(true);
      const result = await getEmployees();
      if (result.success) {
        setEmployees(result.employees);
      } else {
        console.error("Error loading employees:", result.error);
      }
    } catch (error) {
      console.error("Error loading employees:", error);
    } finally {
      setLoading(false);
    }
  };

  const filteredEmployees = employees.filter((employee) => {
    const matchesFilter =
      filter === "all" || employee.status.toLowerCase() === filter;
    const employeeName = employee.kindtao?.user
      ? `${employee.kindtao.user.first_name || ""} ${
          employee.kindtao.user.last_name || ""
        }`.trim()
      : "";
    const matchesSearch =
      employeeName.toLowerCase().includes(searchTerm.toLowerCase()) ||
      (employee.job_post?.job_title || "")
        .toLowerCase()
        .includes(searchTerm.toLowerCase());
    return matchesFilter && matchesSearch;
  });

  const handleRemoveEmployee = async () => {
    if (!employeeToRemove?.id) return;

    if (!removeText.trim()) {
      setRemoveError("Please type REMOVE to confirm");
      return;
    }
    if (removeText !== "REMOVE") {
      setRemoveError("Please type REMOVE exactly as shown");
      return;
    }

    setIsRemoving(true);
    try {
      const result = await removeEmployee(employeeToRemove.id);
      if (result.success) {
        const employeeName = employeeToRemove.kindtao?.user
          ? `${employeeToRemove.kindtao.user.first_name || ""} ${
              employeeToRemove.kindtao.user.last_name || ""
            }`.trim() || "Employee"
          : "Employee";
        showSuccess(`${employeeName} has been removed from your team`);
        setShowRemoveConfirm(false);
        setRemoveText("");
        setRemoveError("");
        setEmployeeToRemove(null);
        loadEmployees();
      } else {
        showError(result.error || "Failed to remove employee");
      }
    } catch (error) {
      console.error("Error removing employee:", error);
      showError("An unexpected error occurred");
    } finally {
      setIsRemoving(false);
    }
  };

  return (
    <div className="p-8">
      {/* Header */}
      <div className="mb-8">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-3xl font-bold text-gray-900 mb-2">Employees</h1>
            <p className="text-gray-600">
              Manage your team and track employee performance
            </p>
          </div>
          <PrimaryButton
            onClick={() => setIsAddEmployeeModalOpen(true)}
            className="inline-flex items-center gap-2"
          >
            <LuPlus className="w-4 h-4" />
            <span className="text-sm font-medium">Add Employee</span>
          </PrimaryButton>
        </div>
      </div>

      {/* Filter Tabs */}
      <div className="mb-6">
        <div className="flex space-x-1 bg-gray-100 p-1 rounded-lg w-fit">
          {[
            { key: "all", label: "All Employees", count: employees.length },
            {
              key: "active",
              label: "Active",
              count: employees.filter((e) => e.status === "active").length,
            },
            {
              key: "inactive",
              label: "Inactive",
              count: employees.filter((e) => e.status === "inactive").length,
            },
          ].map((tab) => (
            <button
              key={tab.key}
              onClick={() => setFilter(tab.key as any)}
              className={`cursor-pointer px-4 py-2 rounded-xl text-sm font-medium transition-colors ${
                filter === tab.key
                  ? "bg-white text-[#CC0000] shadow-sm"
                  : "text-gray-600 hover:text-gray-900"
              }`}
            >
              {tab.label} ({tab.count})
            </button>
          ))}
        </div>
      </div>

      {/* Search and Filter Controls */}
      <div className="mb-6 flex flex-col md:flex-row items-stretch md:items-center gap-3 md:gap-4">
        <label className="relative w-full md:w-52">
          <LuSearch className="pointer-events-none absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
          <input
            type="text"
            placeholder="Search employees..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="w-full bg-white rounded-lg border border-gray-300 py-2 pl-9 pr-3 text-sm text-gray-700 placeholder-gray-400 focus:outline-none"
          />
        </label>
      </div>

      {/* Employees Content */}
      {loading ? (
        <div className="text-center py-12">
          <div className="w-24 h-24 bg-gray-100 rounded-full flex items-center justify-center mx-auto mb-4">
            <FaUsers className="w-8 h-8 text-gray-400" />
          </div>
          <h3 className="text-lg font-semibold text-gray-900 mb-2">
            Loading employees...
          </h3>
        </div>
      ) : filteredEmployees.length === 0 ? (
        <div className="text-center py-12">
          <div className="w-24 h-24 bg-gray-100 rounded-full flex items-center justify-center mx-auto mb-4">
            <FaUsers className="w-8 h-8 text-gray-400" />
          </div>
          <h3 className="text-lg font-semibold text-gray-900 mb-2">
            {filter === "all" ? "No employees yet" : `No ${filter} employees`}
          </h3>
          <p className="text-gray-600 mb-6">
            {filter === "all"
              ? "You don't have any employees in your team yet."
              : `You don't have any ${filter} employees at the moment.`}
          </p>
        </div>
      ) : (
        <MyEmployeesClient
          employees={filteredEmployees}
          onViewEmployee={(employee) => {
            setSelectedEmployee(employee);
            setIsEmployeeDetailModalOpen(true);
          }}
          onRemoveEmployee={(employee) => {
            setEmployeeToRemove(employee);
            setShowRemoveConfirm(true);
          }}
        />
      )}

      {/* Add Employee Modal */}
      <AddEmployeeModal
        isOpen={isAddEmployeeModalOpen}
        onClose={() => setIsAddEmployeeModalOpen(false)}
        onEmployeeAdded={() => {
          loadEmployees();
        }}
      />

      {/* Employee Detail Modal */}
      <EmployeeDetailModal
        isOpen={isEmployeeDetailModalOpen}
        onClose={() => {
          setIsEmployeeDetailModalOpen(false);
          setSelectedEmployee(null);
        }}
        employee={selectedEmployee}
        onEmployeeRemoved={() => {
          loadEmployees();
        }}
      />

      {/* Remove Employee Confirmation Modal */}
      {showRemoveConfirm && employeeToRemove && (
        <>
          {createPortal(
            <>
              <div
                className="fixed inset-0 bg-black/50 z-60"
                onClick={() => {
                  setShowRemoveConfirm(false);
                  setRemoveText("");
                  setRemoveError("");
                  setEmployeeToRemove(null);
                }}
              />
              <div className="fixed inset-0 z-60 flex items-center justify-center p-4">
                <div className="bg-white rounded-2xl border border-gray-200 shadow-xl w-full max-w-md">
                  {/* Header */}
                  <div className="flex items-center justify-between p-6 border-b border-gray-200">
                    <div className="flex items-center space-x-3">
                      <FaTrash className="w-5 h-5 text-red-600" />
                      <h2 className="text-xl font-bold text-gray-900">
                        Remove Employee
                      </h2>
                    </div>
                    <button
                      onClick={() => {
                        setShowRemoveConfirm(false);
                        setRemoveText("");
                        setRemoveError("");
                        setEmployeeToRemove(null);
                      }}
                      className="p-2 cursor-pointer hover:bg-gray-100 rounded-full transition-colors"
                    >
                      <FaTimes className="w-5 h-5 text-gray-500" />
                    </button>
                  </div>

                  {/* Content */}
                  <div className="p-6">
                    {/* Employee Name */}
                    <div className="mb-4">
                      <p className="text-sm text-gray-600 mb-1">Employee:</p>
                      <p className="font-medium text-gray-900">
                        {employeeToRemove.kindtao?.user
                          ? `${
                              employeeToRemove.kindtao.user.first_name || ""
                            } ${
                              employeeToRemove.kindtao.user.last_name || ""
                            }`.trim() || "Unknown"
                          : "Unknown"}
                      </p>
                    </div>

                    {/* Description */}
                    <div className="p-4 rounded-lg border bg-red-50 border-red-200 mb-6">
                      <p className="text-sm text-red-600">
                        This will remove the employee from your team. The
                        employee will be marked as inactive and will no longer
                        appear in your active employees list. You can re-add
                        them later if needed.
                      </p>
                    </div>

                    {/* Confirmation field */}
                    <div className="mb-6">
                      <label className="block text-sm font-medium text-gray-700 mb-2">
                        Type REMOVE to confirm
                      </label>
                      <input
                        type="text"
                        value={removeText}
                        onChange={(e) => {
                          setRemoveText(e.target.value);
                          setRemoveError("");
                        }}
                        placeholder="Type REMOVE"
                        className={`w-full h-12 rounded-xl border px-4 outline-none focus:ring-2 focus:ring-red-500 focus:border-transparent ${
                          removeError ? "border-red-300" : "border-gray-300"
                        }`}
                      />
                      {removeError && (
                        <p className="text-red-600 text-sm mt-1">
                          {removeError}
                        </p>
                      )}
                    </div>
                  </div>

                  {/* Footer */}
                  <div className="flex justify-end space-x-3 p-6 border-t border-gray-200">
                    <button
                      onClick={() => {
                        setShowRemoveConfirm(false);
                        setRemoveText("");
                        setRemoveError("");
                        setEmployeeToRemove(null);
                      }}
                      disabled={isRemoving}
                      className="px-4 py-2 text-sm cursor-pointer font-medium text-gray-700 bg-white border border-gray-300 rounded-lg hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
                    >
                      Cancel
                    </button>
                    <button
                      onClick={handleRemoveEmployee}
                      disabled={isRemoving}
                      className="px-4 py-2 cursor-pointer text-sm font-medium text-white bg-red-600 rounded-lg hover:bg-red-700 focus:ring-red-500 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
                    >
                      {isRemoving ? "Removing..." : "Remove Employee"}
                    </button>
                  </div>
                </div>
              </div>
            </>,
            document.body
          )}
        </>
      )}
    </div>
  );
}
