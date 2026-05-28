import { useState, useEffect } from 'react';
import { useAuth } from '../contexts/AuthContext';
import api from '../lib/api';
import { Layout } from '../components/Layout';

interface Employee {
  id: string;
  name: string;
  email: string;
  bankAccountNumber?: string;
  bankName?: string;
}

interface Payrun {
  month: number;
  year: number;
  payslipCount: number;
}

interface CostData {
  month: string;
  value: number;
}

export const Payroll = () => {
  const { user } = useAuth();
  const [activeTab, setActiveTab] = useState<'dashboard' | 'payrun'>('dashboard');
  const [loading, setLoading] = useState(true);
  
  // Dashboard data
  const [employeesWithoutBank, setEmployeesWithoutBank] = useState<Employee[]>([]);
  const [payruns, setPayruns] = useState<Payrun[]>([]);
  const [employerCostView, setEmployerCostView] = useState<'monthly' | 'annually'>('monthly');
  const [employeeCountView, setEmployeeCountView] = useState<'monthly' | 'annually'>('monthly');
  const [employerCosts, setEmployerCosts] = useState<CostData[]>([]);
  const [employeeCounts, setEmployeeCounts] = useState<CostData[]>([]);
  
  // Payrun data
  const [payrolls, setPayrolls] = useState<any[]>([]);

  const canAccessPayroll = user?.role === 'admin' || user?.role === 'payroll_officer';

  useEffect(() => {
    if (canAccessPayroll) {
      if (activeTab === 'dashboard') {
        fetchDashboardData();
      } else {
        fetchPayrolls();
      }
    } else {
      fetchPayrolls();
    }
  }, [activeTab, canAccessPayroll]);

  const fetchDashboardData = async () => {
    setLoading(true);
    try {
      // Fetch employees without bank details
      try {
        const usersResponse = await api.get('/users', { params: { page: 1, limit: 1000 } });
        const allUsers = usersResponse.data.data.users || [];
        // Filter employees who are missing any bank detail
        const withoutBank = allUsers.filter((emp: any) => 
          !emp.bankAccountNumber || !emp.bankName || !emp.ifscCode || !emp.accountHolderName
        );
        setEmployeesWithoutBank(withoutBank);
        console.log('Employees without bank details:', withoutBank.length, withoutBank);
      } catch (error: any) {
        console.error('Failed to fetch users for warnings:', error);
        // If error, set empty array so it shows "No warnings" instead of breaking
        setEmployeesWithoutBank([]);
      }

      // Fetch payruns (grouped by month/year)
      const payrollsResponse = await api.get('/payroll/all', { params: { page: 1, limit: 1000 } });
      const allPayrolls = payrollsResponse.data.data.payrolls || [];
      
      // Group by month/year
      const payrunMap = new Map<string, Payrun>();
      allPayrolls.forEach((payroll: any) => {
        const key = `${payroll.year}-${payroll.month}`;
        if (!payrunMap.has(key)) {
          payrunMap.set(key, { month: payroll.month, year: payroll.year, payslipCount: 0 });
        }
        const payrun = payrunMap.get(key)!;
        payrun.payslipCount++;
      });
      setPayruns(Array.from(payrunMap.values()).sort((a, b) => {
        if (a.year !== b.year) return b.year - a.year;
        return b.month - a.month;
      }).slice(0, 2));

      // Calculate employer and employee costs
      calculateCosts(allPayrolls);
    } catch (error) {
      console.error('Failed to fetch dashboard data', error);
    } finally {
      setLoading(false);
    }
  };

  const calculateCosts = (payrolls: any[]) => {
    if (!payrolls || payrolls.length === 0) {
      setEmployerCosts([]);
      setEmployeeCounts([]);
      return;
    }

    // Group by month
    const monthlyEmployerCosts = new Map<string, number>();
    const monthlyEmployeeCounts = new Map<string, Set<string>>(); // Use Set to count unique employees

    payrolls.forEach((payroll: any) => {
      const monthKey = `${getMonthName(payroll.month)} ${payroll.year}`;
      
      // Employer cost = gross salary (basic + HRA + allowances)
      const grossSalary = payroll.basicSalary + payroll.hra + payroll.allowances;
      monthlyEmployerCosts.set(monthKey, (monthlyEmployerCosts.get(monthKey) || 0) + grossSalary);
      
      // Employee count = unique employees per month
      if (!monthlyEmployeeCounts.has(monthKey)) {
        monthlyEmployeeCounts.set(monthKey, new Set());
      }
      monthlyEmployeeCounts.get(monthKey)!.add(payroll.userId);
    });

    // Convert to arrays and sort - get last 3 months
    const allMonths = Array.from(monthlyEmployerCosts.keys())
      .sort((a, b) => {
        const [monthA, yearA] = a.split(' ');
        const [monthB, yearB] = b.split(' ');
        if (yearA !== yearB) return parseInt(yearB) - parseInt(yearA);
        return getMonthIndex(monthB) - getMonthIndex(monthA);
      })
      .slice(0, 3)
      .reverse();

    const employerData: CostData[] = allMonths.map(month => ({
      month,
      value: monthlyEmployerCosts.get(month) || 0
    }));

    const employeeCountData: CostData[] = allMonths.map(month => ({
      month,
      value: monthlyEmployeeCounts.get(month)?.size || 0
    }));

    setEmployerCosts(employerData);
    setEmployeeCounts(employeeCountData);
  };

  const getMonthName = (month: number): string => {
    const months = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];
    return months[month - 1] || '';
  };

  const getMonthIndex = (month: string): number => {
    const months = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];
    return months.indexOf(month);
  };

  const getMaxValue = (data: CostData[]): number => {
    if (data.length === 0) return 1;
    return Math.max(...data.map(d => d.value), 1);
  };

  const getDisplayData = (data: CostData[], view: 'monthly' | 'annually'): CostData[] => {
    if (view === 'annually') {
      // Group by year and sum
      const yearlyData = new Map<number, number>();
      data.forEach(item => {
        const year = parseInt(item.month.split(' ')[1]);
        yearlyData.set(year, (yearlyData.get(year) || 0) + item.value);
      });
      
      return Array.from(yearlyData.entries())
        .map(([year, value]) => ({ month: year.toString(), value }))
        .sort((a, b) => parseInt(b.month) - parseInt(a.month))
        .slice(0, 3)
        .reverse();
    }
    return data;
  };

  const fetchPayrolls = async () => {
    setLoading(true);
    try {
      if (canAccessPayroll) {
        // For admin/payroll officer, fetch all payrolls
        const response = await api.get('/payroll/all', { params: { page: 1, limit: 1000 } });
        setPayrolls(response.data.data.payrolls || []);
      } else {
        // For employees, fetch their own payrolls
        const response = await api.get('/payroll/user');
        setPayrolls(response.data.data.payrolls || []);
      }
    } catch (error) {
      console.error('Failed to fetch payrolls', error);
    } finally {
      setLoading(false);
    }
  };

  if (!canAccessPayroll) {
    // Employee view - show their own payrolls
    return (
      <Layout>
        <div className="px-4 py-6">
          <h1 className="text-3xl font-bold text-gray-900 mb-6">My Payroll</h1>

          {loading ? (
            <div className="flex justify-center py-8">
              <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
            </div>
          ) : (
            <div className="bg-white rounded-lg shadow overflow-hidden">
              <table className="min-w-full divide-y divide-gray-200">
                <thead className="bg-gray-50">
                  <tr>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">
                      Month/Year
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">
                      Basic Salary
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">
                      HRA
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">
                      Allowances
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">
                      Deductions
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">
                      Net Pay
                    </th>
                  </tr>
                </thead>
                <tbody className="bg-white divide-y divide-gray-200">
                  {payrolls.map((payroll) => (
                    <tr key={payroll.id}>
                      <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">
                        {payroll.month}/{payroll.year}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                        ₹{payroll.basicSalary.toLocaleString()}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                        ₹{payroll.hra.toLocaleString()}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                        ₹{payroll.allowances.toLocaleString()}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-red-600">
                        ₹{payroll.deductions.toLocaleString()}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm font-semibold text-green-600">
                        ₹{payroll.netPay.toLocaleString()}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
              {payrolls.length === 0 && (
                <div className="text-center py-8 text-gray-500">No payroll records found</div>
              )}
            </div>
          )}
        </div>
      </Layout>
    );
  }

  return (
    <Layout>
      <div className="flex flex-col h-full min-h-0">
        <div className="flex-1 overflow-y-auto overflow-x-hidden">
          <div className="px-4 py-6">
            {/* Tabs */}
            <div className="mb-6 border-b border-gray-200">
              <nav className="flex space-x-8">
                <button
                  onClick={() => setActiveTab('dashboard')}
                  className={`py-4 px-1 border-b-2 font-medium text-sm ${
                    activeTab === 'dashboard'
                      ? 'border-blue-500 text-blue-600'
                      : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
                  }`}
                >
                  Dashboard
                </button>
                <button
                  onClick={() => setActiveTab('payrun')}
                  className={`py-4 px-1 border-b-2 font-medium text-sm ${
                    activeTab === 'payrun'
                      ? 'border-blue-500 text-blue-600'
                      : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
                  }`}
                >
                  Payrun
                </button>
              </nav>
            </div>

            {loading ? (
              <div className="flex justify-center py-8">
                <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
              </div>
            ) : activeTab === 'dashboard' ? (
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                {/* Warnings Panel */}
                <div className="bg-white rounded-lg shadow-md p-6">
                  <h3 className="text-lg font-semibold text-gray-900 mb-4">Warnings</h3>
                  <div className="space-y-3">
                    {employeesWithoutBank.length > 0 ? (
                      <>
                        <div className="text-blue-600">
                          {employeesWithoutBank.length} Employee{employeesWithoutBank.length > 1 ? 's' : ''} without Bank A/c
                        </div>
                        {employeesWithoutBank.length > 0 && (
                          <div className="text-blue-600">
                            {employeesWithoutBank.length} Employee{employeesWithoutBank.length > 1 ? 's' : ''} without Manager
                          </div>
                        )}
                      </>
                    ) : (
                      <div className="text-gray-500">No warnings</div>
                    )}
                  </div>
                </div>

                {/* Payrun Panel */}
                <div className="bg-white rounded-lg shadow-md p-6">
                  <h3 className="text-lg font-semibold text-gray-900 mb-4">Payrun</h3>
                  <div className="space-y-3">
                    {payruns.length > 0 ? (
                      payruns.map((payrun, index) => (
                        <div key={index} className="text-gray-700">
                          Payrun for {getMonthName(payrun.month)} {payrun.year} ({payrun.payslipCount} Payslip{payrun.payslipCount > 1 ? 's' : ''})
                        </div>
                      ))
                    ) : (
                      <div className="text-gray-500">No payruns found</div>
                    )}
                  </div>
                </div>

                {/* Employer Cost Panel */}
                <div className="bg-white rounded-lg shadow-md p-6">
                  <div className="flex justify-between items-center mb-4">
                    <h3 className="text-lg font-semibold text-gray-900">Employer Cost</h3>
                    <div className="flex items-center space-x-2">
                      <button
                        onClick={() => setEmployerCostView('monthly')}
                        className={`px-3 py-1 text-xs rounded ${
                          employerCostView === 'monthly'
                            ? 'bg-blue-500 text-white'
                            : 'bg-gray-200 text-gray-700 hover:bg-gray-300'
                        }`}
                      >
                        Monthly
                      </button>
                      <button
                        onClick={() => setEmployerCostView('annually')}
                        className={`px-3 py-1 text-xs rounded ${
                          employerCostView === 'annually'
                            ? 'bg-blue-500 text-white'
                            : 'bg-gray-200 text-gray-700 hover:bg-gray-300'
                        }`}
                      >
                        Annually
                      </button>
                    </div>
                  </div>
                  {(() => {
                    const displayData = getDisplayData(employerCosts, employerCostView);
                    return displayData.length > 0 ? (
                      <div className="space-y-4">
                        {displayData.map((data, index) => {
                          const maxValue = getMaxValue(displayData);
                          const percentage = maxValue > 0 ? (data.value / maxValue) * 100 : 0;
                          return (
                            <div key={index}>
                              <div className="flex justify-between text-sm mb-1">
                                <span className="text-gray-700">
                                  {employerCostView === 'annually' ? `${data.month}` : data.month}
                                </span>
                                <span className="text-gray-900 font-medium">₹{data.value.toLocaleString()}</span>
                              </div>
                              <div className="w-full bg-gray-200 rounded-full h-6">
                                <div
                                  className="bg-blue-500 h-6 rounded-full flex items-center justify-end pr-2"
                                  style={{ width: `${percentage}%` }}
                                >
                                  {percentage > 20 && (
                                    <span className="text-xs text-white font-medium">
                                      {percentage.toFixed(0)}%
                                    </span>
                                  )}
                                </div>
                              </div>
                            </div>
                          );
                        })}
                      </div>
                    ) : (
                      <div className="text-gray-500">No data available</div>
                    );
                  })()}
                </div>

                {/* Employee Cost Panel */}
                <div className="bg-white rounded-lg shadow-md p-6">
                  <div className="flex justify-between items-center mb-4">
                    <h3 className="text-lg font-semibold text-gray-900">Employee Count</h3>
                    <div className="flex items-center space-x-2">
                      <button
                        onClick={() => setEmployeeCountView('monthly')}
                        className={`px-3 py-1 text-xs rounded ${
                          employeeCountView === 'monthly'
                            ? 'bg-blue-500 text-white'
                            : 'bg-gray-200 text-gray-700 hover:bg-gray-300'
                        }`}
                      >
                        Monthly
                      </button>
                      <button
                        onClick={() => setEmployeeCountView('annually')}
                        className={`px-3 py-1 text-xs rounded ${
                          employeeCountView === 'annually'
                            ? 'bg-blue-500 text-white'
                            : 'bg-gray-200 text-gray-700 hover:bg-gray-300'
                        }`}
                      >
                        Annually
                      </button>
                    </div>
                  </div>
                  {(() => {
                    const displayData = getDisplayData(employeeCounts, employeeCountView);
                    return displayData.length > 0 ? (
                      <div className="space-y-4">
                        {displayData.map((data, index) => {
                          const maxValue = getMaxValue(displayData);
                          const percentage = maxValue > 0 ? (data.value / maxValue) * 100 : 0;
                          return (
                            <div key={index}>
                              <div className="flex justify-between text-sm mb-1">
                                <span className="text-gray-700">
                                  {employeeCountView === 'annually' ? `${data.month}` : data.month}
                                </span>
                                <span className="text-gray-900 font-medium">{data.value} Employee{data.value !== 1 ? 's' : ''}</span>
                              </div>
                              <div className="w-full bg-gray-200 rounded-full h-6">
                                <div
                                  className="bg-blue-500 h-6 rounded-full flex items-center justify-end pr-2"
                                  style={{ width: `${percentage}%` }}
                                >
                                  {percentage > 20 && (
                                    <span className="text-xs text-white font-medium">
                                      {percentage.toFixed(0)}%
                                    </span>
                                  )}
                                </div>
                              </div>
                            </div>
                          );
                        })}
                      </div>
                    ) : (
                      <div className="text-gray-500">No data available</div>
                    );
                  })()}
                </div>
              </div>
            ) : (
              <div className="bg-white rounded-lg shadow overflow-hidden">
                <table className="min-w-full divide-y divide-gray-200">
                  <thead className="bg-gray-50">
                    <tr>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">
                        Employee
                      </th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">
                        Month/Year
                      </th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">
                        Basic Salary
                      </th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">
                        HRA
                      </th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">
                        Allowances
                      </th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">
                        Deductions
                      </th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">
                        Net Pay
                      </th>
                    </tr>
                  </thead>
                  <tbody className="bg-white divide-y divide-gray-200">
                    {payrolls.map((payroll) => (
                      <tr key={payroll.id}>
                        <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">
                          {payroll.user?.name || 'N/A'}
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                          {payroll.month}/{payroll.year}
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                          ₹{payroll.basicSalary.toLocaleString()}
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                          ₹{payroll.hra.toLocaleString()}
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                          ₹{payroll.allowances.toLocaleString()}
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm text-red-600">
                          ₹{payroll.deductions.toLocaleString()}
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm font-semibold text-green-600">
                          ₹{payroll.netPay.toLocaleString()}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
                {payrolls.length === 0 && (
                  <div className="text-center py-8 text-gray-500">No payroll records found</div>
                )}
              </div>
            )}
          </div>
        </div>
      </div>
    </Layout>
  );
};
