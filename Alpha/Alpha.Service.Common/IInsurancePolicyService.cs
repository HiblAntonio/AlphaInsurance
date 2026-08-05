using Alpha.Common;
using Alpha.Model;
using System;
using System.Collections.Generic;
using System.Linq;
using System.Text;
using System.Threading.Tasks;

namespace Alpha.Service.Common
{
    public interface IInsurancePolicyService
    {
        Task<List<InsurancePolicyModelView>> GetInsurancePolicyListAsync(InsuranceFiltering filter, Paging paging, bool isGettingAllPolicies);
        Task<InsurancePolicyView> GetInsurancePolicyDetailsByIdAsync(Guid policyId);
        Task<int> GetTotalPolicyCountAsync(InsuranceFiltering filter);
        Task<bool> RenewInsurancePolicyAsync(RenewPolicyRequest insurancePolicy, Guid createdBy);
        Task<bool> AddInsurancePolicyAsync(CreatePolicyRequest insurancePolicy, Guid createdBy);
        Task<bool> UpdatePolicyAsync(UpdatePolicyRequest insurancePolicy);
        Task<bool> DeleteInsurancePolicy(Guid policyId, Guid deletedBy, string deleteReason, string deleteComment);
        Task<List<DeletedPolicyView>> GetDeletedPoliciesAsync();
        Task<DeletedPolicyView> GetDeletedPolicyByIdAsync(Guid policyId);
        Task<bool> RestorePolicyAsync(Guid policyId);
        Task<(int, double)> GetYearlyPolicyCountComparisonAsync(int year);
        Task<(int, double)> GetTodaysEnteredPoliciesStatisticsAsync();
        Task<(decimal, decimal)> GetPremiumSumsAsync(int year);
        Task<List<PartnerPolicyCount>> GetTopPartnersByPolicyCountAsync(int year);
        Task<bool> InsurancePolicyExists(string policyNumber);
        Task<List<ChartDataItem>> GetPoliciesChartDataAsync(string period);
        Task<ExpiringPolicyStats> GetUnrenewedPoliciesAsync(string period);
        Task<List<ExpiringPolicyStats>> GetExpiringPoliciesAsync();

        // ------------------- INSURANCE POLICY METHODS FROM WEBFORMS ------------------

        Task<Guid> GetInsurancePolicyIdByPolicyNumberAsync(string policyNumber);
        Task<decimal> GetTotalPolicyPriceSumAsync(InsuranceFiltering filter);
        Task<List<TodayEnteredPolicies>> GetTodaysInsurancePoliciesAsync(Paging paging, DailyStatisticsFiltering filter);
        Task<(List<string> Agents, List<string> Locations)> GetTodaysFilterOptionsAsync();
        Task<TodayEnteredPolicies> GetLatestEnteredPolicyAsync();
        Task<int> GetTotalFilteredPoliciesCountAsync(DailyStatisticsFiltering filter);
        Task<float> GetTodaysPolicySum();
        Task<decimal> GetThisYearsPolicySum();
        Task<int> GetTodaysNumberOfPoliciesAsync();
        Task<int> GetYearsInsurancePoliciesAsync();
        Task<List<LocationPolicyChartItem>> GetPolicyCountsByLocationAsync(string period, int year);
        Task<bool> IsPolicyAlreadyExtendedAsync(string policyNumber);
        Task<double> GetAverageNumberOfPoliciesPerDayAsync();
        Task<Dictionary<string, int>> GetTodaysPoliciesForLocationsAsync(List<string> locationNames);
        Task<bool> UpdateInsurancePolicyAsync(InsurancePolicyModelView insurancePolicy);

        // ------------------- SALES STATISTICS METHODS ------------------

        Task<SalesChartResponse> GetFilteredPoliciesChartDataAsync(string period, StatisticsFiltering filter);
        Task<PolicyCreationStats> GetPolicyCreationStatsAsync(StatisticsFiltering filter);
        Task<List<LocationPolicyStats>> GetPolicyLocationStatsAsync(StatisticsFiltering filter);
        Task<List<InsuranceCompanyYearlyStats>> GetInsuranceCompanyYearlyStatsAsync(StatisticsFiltering filter);
        Task<List<PartnerStats>> GetPartnerStatsAsync(StatisticsFiltering filter);
        Task<PremiumComparisonData> GetPremiumComparisonDataAsync(List<int> years, StatisticsFiltering filter);
        Task<(List<string> Companies, List<string> PolicyTypes, List<string> Locations, List<string> Partners)> GetDashboardFilterOptionsAsync();
        Task<object> GetBSkadencaDataAsync(int year, int comparisonYear, StatisticsFiltering filter);
        Task<AgentStatsSummary> GetAgentSummaryAsync(Guid agentId);
    }
}



