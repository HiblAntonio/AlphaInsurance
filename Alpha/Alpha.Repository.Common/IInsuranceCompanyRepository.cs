
using Alpha.Model;
using System;
using System.Collections.Generic;
using System.Linq;
using System.Text;
using System.Threading.Tasks;

namespace Alpha.Repository.Common
{
    public interface IInsuranceCompanyRepository
    {
        Task<List<string>> GetAllInsuranceCompaniesAsync();
        Task<List<LookupItem>> GetAllInsuranceCompaniesWithStatusAsync();
        Task<List<string>> GetAllActiveInsuranceCompaniesAsync();
        Task<bool> SetInsuranceCompanyActiveAsync(string name, bool isActive);

        // ----------------  INSURANCE COMPANY METHODS FROM WEBFORMS ------------------

        Task<Guid> GetCompanyIdByName(string insuranceCompany);
        Task<List<LocationStatistics>> GetAllInsuranceCompaniesInfoFilteredAsync(StatisticsFiltering statisticsFiltering);
        Task<bool> AddInsuranceCompany(string insuranceCompany);
        Task<bool> UpdateInsuranceCompany(string insuranceCompany, string newInsuranceCompany);
    }
}



