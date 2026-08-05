using Alpha.Common;
using Alpha.Model;
using Alpha.Repository.Common;
using Alpha.Service.Common;
using System;
using System.Collections.Generic;
using System.Linq;
using System.Text;
using System.Threading.Tasks;

namespace Alpha.Service
{
    public class InsurancePolicyService : IInsurancePolicyService
    {
        private readonly IInsurancePolicyRepository insurancePolicyRepository;
        private readonly IClientRepository clientRepository;

        public InsurancePolicyService(IInsurancePolicyRepository _insurancePolicyRepository, IClientRepository _clientRepository)
        {
            insurancePolicyRepository = _insurancePolicyRepository;
            clientRepository = _clientRepository;
        }

        public async Task<List<InsurancePolicyModelView>> GetInsurancePolicyListAsync(InsuranceFiltering filter, Paging paging, bool isGettingAllPolicies)
        {
            return await insurancePolicyRepository.GetAllPoliciesAsync(filter, paging, isGettingAllPolicies);
        }

        public async Task<InsurancePolicyView> GetInsurancePolicyDetailsByIdAsync(Guid policyId)
        {
            return await insurancePolicyRepository.GetInsurancePolicyDetailsByIdAsync(policyId);
        }

        public async Task<int> GetTotalPolicyCountAsync(InsuranceFiltering filter)
        {
            return await insurancePolicyRepository.GetTotalPolicyCountAsync(filter);
        }

        public async Task<bool> AddInsurancePolicyAsync(CreatePolicyRequest insurancePolicy, Guid createdBy)
        {
            if (await insurancePolicyRepository.InsurancePolicyExistsAsync(insurancePolicy.Policy.PolicyNumber))
                throw new InvalidOperationException($"Polica s brojem '{insurancePolicy.Policy.PolicyNumber}' već postoji.");

            Guid clientId;

            if (insurancePolicy.Client.IsNew)
                clientId = await clientRepository.AddClientAsync(insurancePolicy.Client);
            else
                clientId = insurancePolicy.Client.ClientId;

            return await insurancePolicyRepository.AddInsurancePolicyAsync(clientId, insurancePolicy.Policy, createdBy);
        }

        // In this case, PreviousPolicyNumber is the current policy number, but that policy is being renewed, not the new one, so it becomes the previous policy number for the new record
        public async Task<bool> RenewInsurancePolicyAsync(RenewPolicyRequest insurancePolicy, Guid createdBy)
        {
            if (await insurancePolicyRepository.InsurancePolicyExistsAsync(insurancePolicy.Policy.PolicyNumber))
                throw new InvalidOperationException($"Polica s brojem '{insurancePolicy.Policy.PolicyNumber}' već postoji.");

            return await insurancePolicyRepository.RenewInsurancePolicyAsync(insurancePolicy, createdBy);
        }

        public async Task<bool> UpdatePolicyAsync(UpdatePolicyRequest insurancePolicy)
        {
            return await insurancePolicyRepository.UpdatePolicyAsync(insurancePolicy);
        }

        public async Task<bool> DeleteInsurancePolicy(Guid policyId, Guid deletedBy, string deleteReason, string deleteComment)
        {
            return await insurancePolicyRepository.DeleteInsurancePolicyAsync(policyId, deletedBy, deleteReason, deleteComment);
        }

        public async Task<List<DeletedPolicyView>> GetDeletedPoliciesAsync()
        {
            return await insurancePolicyRepository.GetDeletedPoliciesAsync();
        }

        public async Task<DeletedPolicyView> GetDeletedPolicyByIdAsync(Guid policyId)
        {
            return await insurancePolicyRepository.GetDeletedPolicyByIdAsync(policyId);
        }

        public async Task<bool> RestorePolicyAsync(Guid policyId)
        {
            return await insurancePolicyRepository.RestorePolicyAsync(policyId);
        }

        public async Task<(int, double)> GetYearlyPolicyCountComparisonAsync(int year)
        {
            return await insurancePolicyRepository.GetYearlyPolicyCountComparisonAsync(year);
        }

        public async Task<(int, double)> GetTodaysEnteredPoliciesStatisticsAsync()
        {
            return await insurancePolicyRepository.GetTodaysEnteredPoliciesStatisticsAsync();
        }

        public async Task<(decimal, decimal)> GetPremiumSumsAsync(int year)
        {
            return await insurancePolicyRepository.GetPremiumSumsAsync(year);
        }

        public async Task<List<PartnerPolicyCount>> GetTopPartnersByPolicyCountAsync(int year)
        {
            return await insurancePolicyRepository.GetTopPartnersByPolicyCountAsync(year);
        }

        public async Task<bool> InsurancePolicyExists(string policyNumber)
        {
            return await insurancePolicyRepository.InsurancePolicyExistsAsync(policyNumber);
        }

        public async Task<List<ChartDataItem>> GetPoliciesChartDataAsync(string period)
        {
            return await insurancePolicyRepository.GetPoliciesChartDataAsync(period);
        }

        public async Task<ExpiringPolicyStats> GetUnrenewedPoliciesAsync(string period)
        {
            return await insurancePolicyRepository.GetUnrenewedPoliciesAsync(period);
        }

        public async Task<List<ExpiringPolicyStats>> GetExpiringPoliciesAsync()
        {
            return await insurancePolicyRepository.GetExpiringPoliciesAsync();
        } 

        // ------------------- INSURANCE COMPANY METHODS FROM WEBFORMS ------------------

        public async Task<double> GetAverageNumberOfPoliciesPerDayAsync()
        {
            return await insurancePolicyRepository.GetAverageNumberOfPoliciesPerDayAsync();
        }

        public async Task<Guid> GetInsurancePolicyIdByPolicyNumberAsync(string policyNumber)
        {
            return await insurancePolicyRepository.GetInsurancePolicyIdByPolicyNumberAsync(policyNumber);
        }

        public async Task<decimal> GetThisYearsPolicySum()
        {
            return await insurancePolicyRepository.GetThisYearsPolicySum();
        }

        public async Task<List<LocationPolicyChartItem>> GetPolicyCountsByLocationAsync(string period, int year)
        {
            return await insurancePolicyRepository.GetPolicyCountsByLocationAsync(period, year);
        }

        public async Task<List<TodayEnteredPolicies>> GetTodaysInsurancePoliciesAsync(Paging paging, DailyStatisticsFiltering filter)
        {
            return await insurancePolicyRepository.GetTodaysInsurancePoliciesAsync(paging, filter);
        }

        public async Task<TodayEnteredPolicies> GetLatestEnteredPolicyAsync()
        {
            return await insurancePolicyRepository.GetLatestEnteredPolicyAsync();
        }

        public async Task<(List<string> Agents, List<string> Locations)> GetTodaysFilterOptionsAsync()
        {
            return await insurancePolicyRepository.GetTodaysFilterOptionsAsync();
        }

        public async Task<int> GetTodaysNumberOfPoliciesAsync()
        {
            return await insurancePolicyRepository.GetTodaysNumberOfPoliciesAsync();
        }

        public async Task<Dictionary<string, int>> GetTodaysPoliciesForLocationsAsync(List<string> locationNames)
        {
            return await insurancePolicyRepository.GetTodaysPoliciesForLocationsAsync(locationNames);
        }

        public async Task<float> GetTodaysPolicySum()
        {
            return await insurancePolicyRepository.GetTodaysPolicySum();
        }

        public async Task<int> GetTotalFilteredPoliciesCountAsync(DailyStatisticsFiltering filter)
        {
            return await insurancePolicyRepository.GetTotalFilteredPoliciesCountAsync(filter);
        }

        public async Task<decimal> GetTotalPolicyPriceSumAsync(InsuranceFiltering filter)
        {
            return await insurancePolicyRepository.GetTotalPolicyPriceSumAsync(filter);
        }

        public async Task<int> GetYearsInsurancePoliciesAsync()
        {
            return await insurancePolicyRepository.GetYearsInsurancePoliciesAsync();
        }

        public async Task<bool> IsPolicyAlreadyExtendedAsync(string policyNumber)
        {
            return await insurancePolicyRepository.IsPolicyAlreadyExtendedAsync(policyNumber);
        }

        public async Task<bool> UpdateInsurancePolicyAsync(InsurancePolicyModelView insurancePolicy)
        {
            return await insurancePolicyRepository.UpdateInsurancePolicyAsync(insurancePolicy);
        }

        // ------------------- SALES STATISTICS METHODS ------------------

        public async Task<SalesChartResponse> GetFilteredPoliciesChartDataAsync(string period, StatisticsFiltering filter)
        {
            return await insurancePolicyRepository.GetFilteredPoliciesChartDataAsync(period, filter);
        }

        public async Task<PolicyCreationStats> GetPolicyCreationStatsAsync(StatisticsFiltering filter)
        {
            return await insurancePolicyRepository.GetPolicyCreationStatsAsync(filter);
        }

        public async Task<List<LocationPolicyStats>> GetPolicyLocationStatsAsync(StatisticsFiltering filter)
        {
            return await insurancePolicyRepository.GetPolicyLocationStatsAsync(filter);
        }

        public async Task<List<InsuranceCompanyYearlyStats>> GetInsuranceCompanyYearlyStatsAsync(StatisticsFiltering filter)
        {
            return await insurancePolicyRepository.GetInsuranceCompanyYearlyStatsAsync(filter);
        }

        public async Task<List<PartnerStats>> GetPartnerStatsAsync(StatisticsFiltering filter)
        {
            return await insurancePolicyRepository.GetPartnerStatsAsync(filter);
        }

        public async Task<PremiumComparisonData> GetPremiumComparisonDataAsync(List<int> years, StatisticsFiltering filter)
        {
            return await insurancePolicyRepository.GetPremiumComparisonDataAsync(years, filter);
        }

        public async Task<(List<string> Companies, List<string> PolicyTypes, List<string> Locations, List<string> Partners)> GetDashboardFilterOptionsAsync()
        {
            return await insurancePolicyRepository.GetDashboardFilterOptionsAsync();
        }

        public async Task<object> GetBSkadencaDataAsync(int year, int comparisonYear, StatisticsFiltering filter)
        {
            return await insurancePolicyRepository.GetBSkadencaDataAsync(year, comparisonYear, filter);
        }

        public async Task<AgentStatsSummary> GetAgentSummaryAsync(Guid agentId)
        {
            return await insurancePolicyRepository.GetAgentSummaryAsync(agentId);
        }
    }
}



