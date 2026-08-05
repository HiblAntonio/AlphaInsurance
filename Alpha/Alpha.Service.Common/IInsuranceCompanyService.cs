using Alpha.Model;
using System;
using System.Collections.Generic;
using System.Linq;
using System.Text;
using System.Threading.Tasks;

namespace Alpha.Service.Common
{
    public interface IInsuranceCompanyService
    {

        Task<List<string>> GetAllInsuranceCompaniesAsync();
        Task<List<LookupItem>> GetAllInsuranceCompaniesWithStatusAsync();
        Task<List<string>> GetAllActiveInsuranceCompaniesAsync();
        Task<bool> SetInsuranceCompanyActiveAsync(string name, bool isActive);

        // ------------------- INSURANCE CAMPANIES METHODS FROM WEBFORMS ------------------

        Task<bool> AddInsuranceCompany(string insuranceCompany);
        Task<List<LocationStatistics>> GetAllInsuranceCompaniesInfoFilteredAsync(StatisticsFiltering statisticsFiltering);
        Task<bool> UpdateInsuranceCompany(string insuranceCompany, string newInsuranceCompany);
    }
}



