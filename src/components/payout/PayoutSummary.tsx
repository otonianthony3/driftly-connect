import React, { useState } from "react";

/** Define the props your component expects. */
interface PayoutSummaryProps {
  /** Total amount received so far. */
  total?: number;
  /** Average payout amount. */
  average?: number;
  /** Pending payout amount. */
  pendingAmount?: number;
  /** Next scheduled payout date (ISO string or "N/A"). */
  nextPayoutDate?: string;
  /** Number of completed payouts. */
  completedPayouts?: number;
  /** Total number of members in the thrift. */
  totalMembers?: number;
  /** Frequency of contributions, e.g. "Weekly" or "Monthly". */
  contributionFrequency?: string;
  /** Display name of the thrift. */
  thriftName?: string;
  /** Current user role, e.g. "admin" or "client". */
  userRole?: "admin" | "client" | string;
}

/**
 * PayoutSummary component shows high-level stats about a thrift,
 * including total and average amounts, next payout date, etc.
 */
const PayoutSummary: React.FC<PayoutSummaryProps> = ({
  total = 0,
  average = 0,
  pendingAmount = 0,
  nextPayoutDate = "N/A",
  completedPayouts = 0,
  totalMembers = 0,
  contributionFrequency = "Weekly",
  thriftName = "Default Thrift",
  userRole = "admin", // or "client"
}) => {
  const [activeTab, setActiveTab] = useState<"summary" | "details">("summary");

  // Format currency values with Naira symbol
  const formatCurrency = (value: number | string): string => {
    const numericValue =
      typeof value === "string" ? parseFloat(value) : value;
    return `₦${numericValue.toLocaleString("en-US", {
      minimumFractionDigits: 2,
      maximumFractionDigits: 2,
    })}`;
  };

  // Format date to readable format
  const formatDate = (dateString: string): string => {
    if (dateString === "N/A") return dateString;
    const date = new Date(dateString);
    return date.toLocaleDateString("en-NG", {
      day: "numeric",
      month: "short",
      year: "numeric",
    });
  };

  return (
    <div className="w-full max-w-4xl mx-auto">
      {/* Thrift Name and Role Badge */}
      <div className="flex items-center justify-between mb-4">
        <h2 className="text-2xl font-bold text-gray-800">{thriftName}</h2>
        <span
          className={`px-3 py-1 rounded-full text-sm font-medium ${
            userRole === "admin"
              ? "bg-purple-100 text-purple-800"
              : "bg-blue-100 text-blue-800"
          }`}
        >
          {userRole === "admin" ? "Admin" : "Member"}
        </span>
      </div>

      {/* Tabs */}
      <div className="flex border-b mb-6">
        <button
          className={`px-4 py-2 font-medium ${
            activeTab === "summary"
              ? "text-blue-600 border-b-2 border-blue-600"
              : "text-gray-500"
          }`}
          onClick={() => setActiveTab("summary")}
        >
          Summary
        </button>
        <button
          className={`px-4 py-2 font-medium ${
            activeTab === "details"
              ? "text-blue-600 border-b-2 border-blue-600"
              : "text-gray-500"
          }`}
          onClick={() => setActiveTab("details")}
        >
          Details
        </button>
      </div>

      {/* Main Summary Section */}
      {activeTab === "summary" && (
        <>
          {/* Primary Stats */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-6">
            <div className="p-6 bg-gradient-to-br from-blue-50 to-blue-100 rounded-xl shadow-sm border border-blue-200">
              <p className="text-gray-600 text-sm font-medium mb-1">
                Total Received
              </p>
              <p className="text-3xl font-bold text-blue-800">
                {formatCurrency(total)}
              </p>
              <p className="text-sm text-gray-500 mt-2">
                Across {completedPayouts} payouts
              </p>
            </div>

            <div className="p-6 bg-gradient-to-br from-green-50 to-green-100 rounded-xl shadow-sm border border-green-200">
              <p className="text-gray-600 text-sm font-medium mb-1">
                Average Payout
              </p>
              <p className="text-3xl font-bold text-green-800">
                {formatCurrency(average)}
              </p>
              <p className="text-sm text-gray-500 mt-2">
                {contributionFrequency} contributions
              </p>
            </div>
          </div>

          {/* Secondary Stats */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-6">
            <div className="p-4 bg-white rounded-lg shadow-sm border border-gray-200">
              <p className="text-gray-600 text-sm font-medium">
                Pending Amount
              </p>
              <p className="text-xl font-bold text-orange-600">
                {formatCurrency(pendingAmount)}
              </p>
            </div>

            <div className="p-4 bg-white rounded-lg shadow-sm border border-gray-200">
              <p className="text-gray-600 text-sm font-medium">Next Payout</p>
              <p className="text-xl font-bold text-indigo-600">
                {formatDate(nextPayoutDate)}
              </p>
            </div>

            <div className="p-4 bg-white rounded-lg shadow-sm border border-gray-200">
              <p className="text-gray-600 text-sm font-medium">
                Active Members
              </p>
              <p className="text-xl font-bold text-teal-600">{totalMembers}</p>
            </div>
          </div>

          {/* Visual Status */}
          <div className="bg-white p-4 rounded-lg shadow-sm border border-gray-200 mb-6">
            <p className="text-gray-700 font-medium mb-2">Thrift Progress</p>
            <div className="w-full bg-gray-200 rounded-full h-4">
              <div
                className="bg-blue-600 h-4 rounded-full"
                style={{
                  width: `${Math.min(
                    (completedPayouts / (totalMembers || 1)) * 100,
                    100
                  )}%`,
                }}
              ></div>
            </div>
            <div className="flex justify-between mt-1">
              <span className="text-xs text-gray-500">0%</span>
              <span className="text-xs text-gray-500">100%</span>
            </div>
          </div>
        </>
      )}

      {/* Details Section - Without Admin Controls */}
      {activeTab === "details" && (
        <div className="bg-white p-4 rounded-lg shadow-sm border border-gray-200">
          <h3 className="font-medium text-gray-700 mb-3">Thrift Details</h3>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-4">
            <div>
              <p className="text-sm text-gray-500">Thrift Type</p>
              <p className="font-medium">{contributionFrequency} Contribution</p>
            </div>
            <div>
              <p className="text-sm text-gray-500">Total Members</p>
              <p className="font-medium">{totalMembers}</p>
            </div>
            <div>
              <p className="text-sm text-gray-500">Completed Payouts</p>
              <p className="font-medium">{completedPayouts}</p>
            </div>
            <div>
              <p className="text-sm text-gray-500">Remaining Payouts</p>
              <p className="font-medium">
                {Math.max(totalMembers - completedPayouts, 0)}
              </p>
            </div>
          </div>

          <div className="p-3 bg-blue-50 rounded-lg border border-blue-200 mb-4">
            <div className="flex items-start">
              <div className="text-blue-500 mr-2">
                <svg
                  xmlns="http://www.w3.org/2000/svg"
                  className="h-5 w-5"
                  viewBox="0 0 20 20"
                  fill="currentColor"
                >
                  <path
                    fillRule="evenodd"
                    d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7-4a1 1 0 11-2 0 1 1 0 012 0zM9 9a1 1 0 000 2v3a1 1 0 001 1h1a1 1 0 100-2v-3a1 1 0 00-1-1H9z"
                    clipRule="evenodd"
                  />
                </svg>
              </div>
              <div>
                <p className="text-sm text-blue-800">
                  Next payout of {formatCurrency(average)} is scheduled for{" "}
                  {formatDate(nextPayoutDate)}
                </p>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Quick Actions - Removed Admin-specific buttons */}
      <div className="flex justify-end mt-4">
        <button className="px-3 py-1 bg-gray-100 text-gray-600 rounded-md text-sm hover:bg-gray-200 mr-2">
          View Details
        </button>
      </div>
    </div>
  );
};

export default PayoutSummary;