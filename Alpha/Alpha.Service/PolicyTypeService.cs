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
    public class PolicyTypeService : IPolicyTypeService
    {
        private readonly IPolicyTypeRepository policyTypeRepository;

        public PolicyTypeService(IPolicyTypeRepository _policyTypeRepository) { 
            this.policyTypeRepository = _policyTypeRepository;
        }

        public async Task<List<string>> GetAllPolicyTypesAsync() =>
            await policyTypeRepository.GetAllPolicyTypesAsync();

        public async Task<List<LookupItem>> GetAllPolicyTypesWithStatusAsync() =>
            await policyTypeRepository.GetAllPolicyTypesWithStatusAsync();

        public async Task<List<string>> GetAllActivePolicyTypesAsync() =>
            await policyTypeRepository.GetAllActivePolicyTypesAsync();

        public async Task<bool> SetPolicyTypeActiveAsync(string name, bool isActive) =>
            await policyTypeRepository.SetPolicyTypeActiveAsync(name, isActive);

        // -------------------  POLICY TYPE METHODS FROM WEBFORMS ------------------

        public async Task<bool> AddPolicyType(string policyType)
        {
            return await policyTypeRepository.AddPolicyType(policyType);
        }

        public async Task<bool> UpdatePolicyType(string policyType, string newPolicyType)
        {
            return await policyTypeRepository.UpdatePolicyType(policyType, newPolicyType);
        }
    }
}



