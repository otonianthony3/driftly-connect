import React, { useMemo, useState } from "react";
import { 
  LineChart, 
  Line, 
  BarChart,
  Bar,
  XAxis, 
  YAxis, 
  CartesianGrid, 
  Tooltip, 
  Legend, 
  ResponsiveContainer,
  Brush,
  ReferenceLine
} from "recharts";
import { format, parseISO, startOfMonth, endOfMonth, eachMonthOfInterval } from "date-fns";
import { formatCurrency } from "src/utils/formatters";
import { PAYOUT_STATUS_TYPES } from "../../constants/payouts";
import EmptyState from "../common/EmptyState";
import LoadingSpinner from "../common/LoadingSpinner";

// Status to color mapping
const STATUS_COLORS = {
  [PAYOUT_STATUS_TYPES.COMPLETED]: "#10B981", // Green
  [PAYOUT_STATUS_TYPES.PENDING]: "#F59E0B", // Yellow
  [PAYOUT_STATUS_TYPES.FAILED]: "#EF4444", // Red
  [PAYOUT_STATUS_TYPES.PROCESSING]: "#3B82F6", // Blue
  [PAYOUT_STATUS_TYPES.CANCELLED]: "#6B7280", // Gray
};

/**
 * PayoutChart component for visualizing payout data
 * 
 * @param {Object} props - Component props
 * @param {Array} props.payouts - Array of payout objects
 * @param {Object} props.dateRange - Object containing startDate and endDate
 * @param {boolean} props.isLoading - Loading state
 * @returns {JSX.Element} PayoutChart component
 */
const PayoutChart = ({ payouts = [], dateRange = {}, isLoading = false }) => {
  const [chartType, setChartType] = useState("line");
  const [groupBy, setGroupBy] = useState("month");

  /**
   * Prepare data for charts based on grouping
   */
  const chartData = useMemo(() => {
    if (!payouts.length) return [];

    // Get date range for the chart
    const allDates = payouts.map(p => new Date(p.date));
    const minDate = dateRange.startDate 
      ? new Date(dateRange.startDate) 
      : new Date(Math.min(...allDates));
    const maxDate = dateRange.endDate 
      ? new Date(dateRange.endDate) 
      : new Date(Math.max(...allDates));
    
    // Create date intervals based on grouping
    const intervals = eachMonthOfInterval({
      start: startOfMonth(minDate),
      end: endOfMonth(maxDate)
    });

    // Group payouts by month/status
    const groupedData = intervals.map(interval => {
      const monthStart = startOfMonth(interval);
      const monthEnd = endOfMonth(interval);
      const monthKey = format(interval, "yyyy-MM");
      
      const monthPayouts = payouts.filter(p => {
        const payoutDate = new Date(p.date);
        return payoutDate >= monthStart && payoutDate <= monthEnd;
      });
      
      // Calculate totals by status
      const statusTotals = Object.values(PAYOUT_STATUS_TYPES)
        .filter(status => status !== PAYOUT_STATUS_TYPES.ALL)
        .reduce((acc, status) => {
          acc[status] = monthPayouts
            .filter(p => p.status === status)
            .reduce((sum, p) => sum + p.amount, 0);
          return acc;
        }, {});
      
      // Calculate total amount for the month
      const totalAmount = monthPayouts.reduce((sum, p) => sum + p.amount, 0);
      
      return {
        month: format(interval, "MMM yyyy"),
        monthKey,
        count: monthPayouts.length,
        amount: totalAmount,
        ...statusTotals
      };
    });

    return groupedData;
  }, [payouts, dateRange, groupBy]);

  /**
   * Prepare data for trend analysis
   */
  const trendData = useMemo(() => {
    if (!chartData.length) return { average: 0, percentChange: 0 };
    
    const amounts = chartData.map(d => d.amount);
    const average = amounts.reduce((sum, val) => sum + val, 0) / amounts.length;
    
    // Calculate percent change between first and last month
    const firstMonth = chartData[0].amount;
    const lastMonth = chartData[chartData.length - 1].amount;
    const percentChange = firstMonth === 0 
      ? 0 
      : ((lastMonth - firstMonth) / firstMonth) * 100;
    
    return { average, percentChange };
  }, [chartData]);

  /**
   * Format Y-axis ticks to show currency
   */
  const formatYAxis = (value) => {
    return formatCurrency(value, { compact: true });
  };

  /**
   * Custom tooltip for the chart
   */
  const CustomTooltip = ({ active, payload, label }) => {
    if (!active || !payload || !payload.length) return null;
    
    return (
      <div className="bg-white p-4 border border-gray-200 shadow-md rounded">
        <p className="font-medium text-gray-900 mb-2">{label}</p>
        {payload.map((entry, index) => (
          <div key={index} className="flex items-center justify-between gap-4">
            <div className="flex items-center gap-2">
              <div 
                className="w-3 h-3 rounded-full" 
                style={{ backgroundColor: entry.color }}
              />
              <p className="text-sm text-gray-600">
                {entry.name === "amount" ? "Total" : entry.name}:
              </p>
            </div>
            <p className="text-sm font-medium text-gray-900">
              {formatCurrency(entry.value)}
            </p>
          </div>
        ))}
      </div>
    );
  };

  /**
   * Render the chart based on the selected type
   */
  const renderChart = () => {
    if (isLoading) {
      return (
        <div className="flex flex-col items-center justify-center py-24">
          <LoadingSpinner size="lg" />
          <p className="mt-4 text-gray-500 text-sm">Loading chart data...</p>
        </div>
      );
    }

    if (!chartData.length) {
      return (
        <EmptyState 
          title="No data to display"
          description="There are no payouts matching your current filters."
          data-testid="chart-empty-state"
        />
      );
    }

    return (
      <div className="h-96">
        <ResponsiveContainer width="100%" height="100%">
          {chartType === "line" ? (
            <LineChart
              data={chartData}
              margin={{ top: 20, right: 30, left: 20, bottom: 70 }}
            >
              <CartesianGrid strokeDasharray="3 3" />
              <XAxis 
                dataKey="month" 
                tick={{ fontSize: 12 }}
                angle={-45}
                textAnchor="end"
                height={70}
              />
              <YAxis 
                yAxisId="left"
                tickFormatter={formatYAxis}
                tick={{ fontSize: 12 }}
              />
              <YAxis 
                yAxisId="right"
                orientation="right"
                tick={{ fontSize: 12 }}
              />
              <Tooltip content={<CustomTooltip />} />
              <Legend />
              <ReferenceLine
                y={trendData.average}
                stroke="#6B7280"
                strokeDasharray="3 3"
                label={{ value: "Average", position: "insideBottomRight" }}
              />
              <Line
                yAxisId="left"
                type="monotone"
                dataKey="amount"
                name="Total Amount"
                stroke="#3B82F6"
                strokeWidth={2}
                dot={{ r: 4 }}
                activeDot={{ r: 6 }}
              />
              <Line
                yAxisId="right"
                type="monotone"
                dataKey="count"
                name="Number of Payouts"
                stroke="#8B5CF6"
                strokeWidth={2}
              />
              <Brush dataKey="month" height={30} stroke="#8884d8" />
            </LineChart>
          ) : (
            <BarChart
              data={chartData}
              margin={{ top: 20, right: 30, left: 20, bottom: 70 }}
            >
              <CartesianGrid strokeDasharray="3 3" />
              <XAxis 
                dataKey="month" 
                tick={{ fontSize: 12 }}
                angle={-45}
                textAnchor="end"
                height={70}
              />
              <YAxis 
                tickFormatter={formatYAxis}
                tick={{ fontSize: 12 }}
              />
              <Tooltip content={<CustomTooltip />} />
              <Legend />
              {Object.entries(STATUS_COLORS).map(([status, color]) => (
                <Bar 
                  key={status} 
                  dataKey={status} 
                  stackId="a" 
                  fill={color}
                  name={status}
                />
              ))}
              <Brush dataKey="month" height={30} stroke="#8884d8" />
            </BarChart>
          )}
        </ResponsiveContainer>
      </div>
    );
  };

  return (
    <div className="flex flex-col gap-6" data-testid="payout-chart">
      <div className="flex flex-wrap items-center justify-between gap-4">
        <div className="flex items-center gap-4">
          <div className="flex border rounded-md overflow-hidden">
            <button 
              onClick={() => setChartType('line')} 
              className={`px-3 py-1.5 text-sm font-medium transition-colors ${
                chartType === 'line' 
                  ? 'bg-blue-50 text-blue-700 border-r border-blue-200' 
                  : 'bg-white text-gray-600 border-r border-gray-200 hover:bg-gray-50'
              }`}
              data-testid="line-chart-button"
            >
              Line Chart
            </button>
            <button 
              onClick={() => setChartType('bar')} 
              className={`px-3 py-1.5 text-sm font-medium transition-colors ${
                chartType === 'bar' 
                  ? 'bg-blue-50 text-blue-700' 
                  : 'bg-white text-gray-600 hover:bg-gray-50'
              }`}
              data-testid="bar-chart-button"
            >
              Bar Chart
            </button>
          </div>
        </div>
        
        <div className="flex items-center gap-4">
          <span className="text-sm text-gray-500">Group by:</span>
          <select
            value={groupBy}
            onChange={(e) => setGroupBy(e.target.value)}
            className="border border-gray-300 rounded-md px-3 py-1.5 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
            data-testid="group-by-select"
          >
            <option value="month">Month</option>
            <option value="week">Week</option>
          </select>
        </div>
      </div>
      
      {/* Chart Summary */}
      {chartData.length > 0 && (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 mb-4">
          <div className="bg-white p-4 rounded-lg border border-gray-200 shadow-sm">
            <h3 className="text-sm font-medium text-gray-500 mb-1">
              Total Payouts
            </h3>
            <p className="text-2xl font-semibold text-gray-900">
              {payouts.length}
            </p>
          </div>
          
          <div className="bg-white p-4 rounded-lg border border-gray-200 shadow-sm">
            <h3 className="text-sm font-medium text-gray-500 mb-1">
              Total Amount
            </h3>
            <p className="text-2xl font-semibold text-gray-900">
              {formatCurrency(payouts.reduce((sum, p) => sum + p.amount, 0))}
            </p>
          </div>
          
          <div className="bg-white p-4 rounded-lg border border-gray-200 shadow-sm">
            <h3 className="text-sm font-medium text-gray-500 mb-1">
              Average Monthly
            </h3>
            <p className="text-2xl font-semibold text-gray-900">
              {formatCurrency(trendData.average)}
            </p>
          </div>
          
          <div className="bg-white p-4 rounded-lg border border-gray-200 shadow-sm">
            <h3 className="text-sm font-medium text-gray-500 mb-1">
              Trend
            </h3>
            <div className="flex items-center gap-2">
              <p className={`text-2xl font-semibold ${
                trendData.percentChange > 0 
                  ? 'text-green-600' 
                  : trendData.percentChange < 0 
                    ? 'text-red-600' 
                    : 'text-gray-900'
              }`}>
                {trendData.percentChange.toFixed(1)}%
              </p>
              {trendData.percentChange !== 0 && (
                <svg
                  xmlns="http://www.w3.org/2000/svg"
                  viewBox="0 0 24 24"
                  fill="none"
                  stroke="currentColor"
                  strokeWidth="2"
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  className={`w-5 h-5 ${
                    trendData.percentChange > 0 
                      ? 'text-green-600' 
                      : 'text-red-600'
                  }`}
                >
                  {trendData.percentChange > 0 ? (
                    <polyline points="18 15 12 9 6 15"></polyline>
                  ) : (
                    <polyline points="6 9 12 15 18 9"></polyline>
                  )}
                </svg>
              )}
            </div>
          </div>
        </div>
      )}
      
      {/* Chart */}
      {renderChart()}
    </div>
  );
};

export default PayoutChart;