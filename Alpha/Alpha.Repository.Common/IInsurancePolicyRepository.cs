
using Alpha.Model;
using Alpha.Common;
using System;
using System.Collections.Generic;
using System.Linq;
using System.Text;
using System.Threading.Tasks;

namespace Alpha.Repository.Common
{
    public interface IInsurancePolicyRepository
    {
        Task<List<InsurancePolicyModelView>> GetAllPoliciesAsync(InsuranceFiltering filter, Paging paging, bool isGettingAllPolicies);
        Task<bool> UpdateInsurancePolicyAsync(InsurancePolicyModelView insurancePolicy);
        Task<int> GetTotalPolicyCountAsync(InsuranceFiltering filter);
        Task<InsurancePolicyView> GetInsurancePolicyDetailsByIdAsync(Guid policyId);
        Task<bool> AddInsurancePolicyAsync(Guid clientId, PolicyRequest insurancePolicy, Guid createdBy);
        Task<bool> RenewInsurancePolicyAsync(RenewPolicyRequest insurancePolicy, Guid createdBy);
        Task<bool> UpdatePolicyAsync(UpdatePolicyRequest insurancePolicy);
        Task<bool> DeleteInsurancePolicyAsync(Guid policyId, Guid deletedBy, string deleteReason, string deleteComment);
        Task<List<DeletedPolicyView>> GetDeletedPoliciesAsync();
        Task<DeletedPolicyView> GetDeletedPolicyByIdAsync(Guid policyId);
        Task<bool> RestorePolicyAsync(Guid policyId);
        Task<(int currentYear, double percentageChange)> GetYearlyPolicyCountComparisonAsync(int year);
        Task<(int todaysPolicies, double dayComparison)> GetTodaysEnteredPoliciesStatisticsAsync();
        Task<(decimal TodaysSum, decimal YearlySum)> GetPremiumSumsAsync(int year);
        Task<List<PartnerPolicyCount>> GetTopPartnersByPolicyCountAsync(int year);
        Task<bool> InsurancePolicyExistsAsync(string policyNumber);
        Task<List<ChartDataItem>> GetPoliciesChartDataAsync(string period);
        Task<ExpiringPolicyStats> GetUnrenewedPoliciesAsync(string period);
        Task<List<ExpiringPolicyStats>> GetExpiringPoliciesAsync();

        // ------------------- INSURANCE POLICY METHODS FROM WEBFORMS ------------------

        Task<Guid> GetInsurancePolicyIdByPolicyNumberAsync(string policyNumber);
        Task<int> GetTodaysNumberOfPoliciesAsync();
        Task<float> GetTodaysPolicySum();
        Task<decimal> GetThisYearsPolicySum();
        Task<List<LocationPolicyChartItem>> GetPolicyCountsByLocationAsync(string period, int year);
        Task<decimal> GetTotalPolicyPriceSumAsync(InsuranceFiltering filter);
        Task<bool> IsPolicyAlreadyExtendedAsync(string policyNumber);
        Task<Dictionary<string, int>> GetTodaysPoliciesForLocationsAsync(List<string> locationNames);
        Task<double> GetAverageNumberOfPoliciesPerDayAsync();
        Task<int> GetTotalFilteredPoliciesCountAsync(DailyStatisticsFiltering filter);
        Task<List<TodayEnteredPolicies>> GetTodaysInsurancePoliciesAsync(Paging paging, DailyStatisticsFiltering filter);
        Task<(List<string> Agents, List<string> Locations)> GetTodaysFilterOptionsAsync();
        Task<TodayEnteredPolicies> GetLatestEnteredPolicyAsync();
        Task<AgentStatsSummary> GetAgentSummaryAsync(Guid agentId);
        Task<int> GetYearsInsurancePoliciesAsync();

        // ------------------- SALES STATISTICS METHODS ------------------

        Task<SalesChartResponse> GetFilteredPoliciesChartDataAsync(string period, StatisticsFiltering filter);
        Task<PolicyCreationStats> GetPolicyCreationStatsAsync(StatisticsFiltering filter);
        Task<List<LocationPolicyStats>> GetPolicyLocationStatsAsync(StatisticsFiltering filter);
        Task<List<InsuranceCompanyYearlyStats>> GetInsuranceCompanyYearlyStatsAsync(StatisticsFiltering filter);
        Task<List<PartnerStats>> GetPartnerStatsAsync(StatisticsFiltering filter);
        Task<PremiumComparisonData> GetPremiumComparisonDataAsync(List<int> years, StatisticsFiltering filter);
        Task<(List<string> Companies, List<string> PolicyTypes, List<string> Locations, List<string> Partners)> GetDashboardFilterOptionsAsync();
        Task<object> GetBSkadencaDataAsync(int year, int comparisonYear, StatisticsFiltering filter);
    }
}



