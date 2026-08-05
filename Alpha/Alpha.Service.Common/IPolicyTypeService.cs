using Alpha.Model;
using System;
using System.Collections.Generic;
using System.Linq;
using System.Text;
using System.Threading.Tasks;

namespace Alpha.Service.Common
{
    public interface IPolicyTypeService
    {
        Task<List<string>> GetAllPolicyTypesAsync();
        Task<List<LookupItem>> GetAllPolicyTypesWithStatusAsync();
        Task<List<string>> GetAllActivePolicyTypesAsync();
        Task<bool> SetPolicyTypeActiveAsync(string name, bool isActive);

        // ------------------- POLICY TYPE METHODS FROM WEBFORMS ------------------
        Task<bool> AddPolicyType(string policyType);
        Task<bool> UpdatePolicyType(string policyType, string newPolicyType);
    }
}



