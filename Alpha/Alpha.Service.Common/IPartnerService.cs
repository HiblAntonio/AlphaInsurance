using Alpha.Model;
using System;
using System.Collections.Generic;
using System.Linq;
using System.Text;
using System.Threading.Tasks;

namespace Alpha.Service.Common
{
    public interface IPartnerService
    {
        Task<List<string>> GetAllPartnersAsync();
        Task<List<LookupItem>> GetAllPartnersWithStatusAsync();
        Task<List<string>> GetAllActivePartnersAsync();
        Task<bool> SetPartnerActiveAsync(string name, bool isActive);

        // ------------------- LOCATION METHODS FROM WEBFORMS ------------------
        Task<bool> AddPartner(string partner);
        Task<List<LocationStatistics>> GetAllInsuranceCompaniesInfoFilteredAsync(StatisticsFiltering statisticsFiltering);
        Task<bool> UpdatePartners(string partner, string newPartner);
    }
}



