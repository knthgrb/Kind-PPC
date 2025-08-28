import React from "react";
import EmployeeCard from "./_components/EmployeeCard";
import { employees } from "@/lib/admin/adminData";
export default function Employees() {
  return (
    <div className="px-6 pt-10 pb-16">
      <div className="mx-auto max-w-7xl border border-[#D9E0E8] rounded-lg px-8 py-6 bg-white">
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
          {employees.map((emp, idx) => (
            <EmployeeCard
              key={idx}
              name={emp.name}
              email={emp.email}
              joiningDate={emp.joiningDate}
              idDocument={emp.idDocument}
              avatarSrc={emp.image}
              onApprove={() => console.log("Approved", emp.name)}
              onReject={() => console.log("Rejected", emp.name)}
            />
          ))}
        </div>
      </div>
    </div>
  );
}
