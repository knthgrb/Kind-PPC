"use client";

import { useState, useEffect } from "react";
import { useAuthStore } from "@/stores/useAuthStore";
import { getEmployees } from "@/actions/employees/get-employees";
import { Employee } from "@/types/employee";
import MyEmployeesClient from "./_components/MyEmployeesClient";
import AddEmployeeModal from "@/components/modals/AddEmployeeModal";
import { LuFilter, LuSearch, LuPlus } from "react-icons/lu";
import { FaUsers, FaCalendar } from "react-icons/fa";
import PrimaryButton from "@/components/buttons/PrimaryButton";

export default function MyEmployees() {
  const { user } = useAuthStore();
  const [employees, setEmployees] = useState<Employee[]>([]);
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState<"all" | "active" | "inactive">("all");
  const [searchTerm, setSearchTerm] = useState("");
  const [isAddEmployeeModalOpen, setIsAddEmployeeModalOpen] = useState(false);

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
      ? `${employee.kindtao.user.first_name || ""} ${employee.kindtao.user.last_name || ""}`.trim()
      : "";
    const matchesSearch =
      employeeName.toLowerCase().includes(searchTerm.toLowerCase()) ||
      (employee.job_post?.job_title || "").toLowerCase().includes(searchTerm.toLowerCase());
    return matchesFilter && matchesSearch;
  });

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
              count: employees.filter((e) => e.status === "Active").length,
            },
            {
              key: "inactive",
              label: "Inactive",
              count: employees.filter((e) => e.status === "Inactive").length,
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
        <button
          type="button"
          className="inline-flex cursor-pointer bg-white items-center justify-center gap-2 rounded-lg border border-gray-400 px-3 py-2 text-sm text-gray-500 hover:bg-gray-50 w-full md:w-auto"
        >
          <LuFilter className="text-base" />
          <span>Filter</span>
        </button>

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
        <MyEmployeesClient employees={filteredEmployees} />
      )}

      {/* Add Employee Modal */}
      <AddEmployeeModal
        isOpen={isAddEmployeeModalOpen}
        onClose={() => setIsAddEmployeeModalOpen(false)}
        onEmployeeAdded={() => {
          loadEmployees();
        }}
      />
    </div>
  );
}
