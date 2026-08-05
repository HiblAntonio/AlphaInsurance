using Alpha.Repository.Common;
using Alpha.Model;
using Alpha.Service.Common;
using System;
using System.Collections.Generic;
using System.Linq;
using System.Text;
using System.Threading.Tasks;

namespace Alpha.Service
{
    public class InsuranceCompanyService : IInsuranceCompanyService
    {
        private readonly IInsuranceCompanyRepository insuranceCompanyRepository;

        public InsuranceCompanyService(IInsuranceCompanyRepository _insuranceCompanyRepository)
        {
            this.insuranceCompanyRepository = _insuranceCompanyRepository;
        }

        public async Task<List<string>> GetAllInsuranceCompaniesAsync() =>
            await insuranceCompanyRepository.GetAllInsuranceCompaniesAsync();

        public async Task<List<LookupItem>> GetAllInsuranceCompaniesWithStatusAsync() =>
            await insuranceCompanyRepository.GetAllInsuranceCompaniesWithStatusAsync();

        public async Task<List<string>> GetAllActiveInsuranceCompaniesAsync() =>
            await insuranceCompanyRepository.GetAllActiveInsuranceCompaniesAsync();

        public async Task<bool> SetInsuranceCompanyActiveAsync(string name, bool isActive) =>
            await insuranceCompanyRepository.SetInsuranceCompanyActiveAsync(name, isActive);

        // ------------------- INSURANCE COMPANY METHODS FROM WEBFORMS ------------------

        public async Task<bool> AddInsuranceCompany(string insuranceCompany)
        {
            return await insuranceCompanyRepository.AddInsuranceCompany(insuranceCompany);
        }

        public async Task<List<LocationStatistics>> GetAllInsuranceCompaniesInfoFilteredAsync(StatisticsFiltering statisticsFiltering)
        {
            return await insuranceCompanyRepository.GetAllInsuranceCompaniesInfoFilteredAsync(statisticsFiltering);
        }

        public async Task<bool> UpdateInsuranceCompany(string insuranceCompany, string newInsuranceCompany)
        {
            return await insuranceCompanyRepository.UpdateInsuranceCompany(insuranceCompany, newInsuranceCompany);
        }
    }
}



