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
    public class PartnerService : IPartnerService
    {
        private readonly IPartnerRepository partnerRepository;

        public PartnerService(IPartnerRepository _partnerRepository) { 
            this.partnerRepository = _partnerRepository;
        }

        public async Task<List<string>> GetAllPartnersAsync() =>
            await partnerRepository.GetAllPartnersAsync();

        public async Task<List<LookupItem>> GetAllPartnersWithStatusAsync() =>
            await partnerRepository.GetAllPartnersWithStatusAsync();

        public async Task<List<string>> GetAllActivePartnersAsync() =>
            await partnerRepository.GetAllActivePartnersAsync();

        public async Task<bool> SetPartnerActiveAsync(string name, bool isActive) =>
            await partnerRepository.SetPartnerActiveAsync(name, isActive);

        // -------------------  PARTNER METHODS FROM WEBFORMS ------------------

        public async Task<bool> AddPartner(string partner)
        {
            return await partnerRepository.AddPartner(partner);
        }

        public async Task<List<LocationStatistics>> GetAllInsuranceCompaniesInfoFilteredAsync(StatisticsFiltering statisticsFiltering)
        {
            return await partnerRepository.GetAllInsuranceCompaniesInfoFilteredAsync(statisticsFiltering);
        }

        public async Task<bool> UpdatePartners(string partner, string newPartner)
        {
            return await partnerRepository.UpdatePartner(partner, newPartner);
        }
    }
}



