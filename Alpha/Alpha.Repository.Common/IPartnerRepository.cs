
using Alpha.Model;
using System;
using System.Collections.Generic;
using System.Linq;
using System.Text;
using System.Threading.Tasks;

namespace Alpha.Repository.Common
{
    public interface IPartnerRepository
    {
        Task<List<string>> GetAllPartnersAsync();
        Task<List<LookupItem>> GetAllPartnersWithStatusAsync();
        Task<List<string>> GetAllActivePartnersAsync();
        Task<bool> SetPartnerActiveAsync(string name, bool isActive);

        // ----------------  PARTNER METHODS FROM WEBFORMS ------------------

        Task<Guid> GetPartnerIdByName(string partner);
        Task<List<LocationStatistics>> GetAllInsuranceCompaniesInfoFilteredAsync(StatisticsFiltering statisticsFiltering);
        Task<bool> AddPartner(string partner);
        Task<bool> UpdatePartner(string partner, string newPartner);
    }
}



