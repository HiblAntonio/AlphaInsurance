using Alpha.Model;
using Alpha.Common;
using System;
using System.Collections.Generic;
using System.Linq;
using System.Text;
using System.Threading.Tasks;

namespace Alpha.Repository.Common
{
    public interface IAgentRepository
    {
        Task<LoginInfo> CheckLoginInfoAsync(LoginRequest userDetails);
        Task<List<string>> GetAllAgentsAsync();
        Task<List<AgentModelView>> GetAllAgentsAsync(AgentFiltering filter, Paging paging);
        Task<int> GetTotalAgentsCountAsync(AgentFiltering filter);
        Task<AgentDetailsView> GetAgentDetailsByIdAsync(Guid agentId);
        Task<bool> AddAgentAsync(AddAgentRequest request);

        // ------------------- AGENT METHODS FROM WEBFORMS ------------------

        Task<AgentDto> GetAgentByIdentificationNumberAsync(string identificationNumber); 
        Task<bool> CheckIfIDExistsAsync(string id);
        Task<bool> IsEmployeeDeletedAsync(Guid id);
        Task<bool> CheckIfUserIsAdminAsync(string id);
        Task<bool> CheckCurrentUsersPasswordAsync(string id, string password);
        Task<bool> UpdatePasswordAsync(string id, string password);

        Task<LoginInfo> GetLoginInfoByAgentIdAsync(Guid agentId);
        Task StoreRefreshTokenAsync(Guid agentId, string token, DateTime expiresAt);
        Task<RefreshToken> GetRefreshTokenAsync(string token);
        Task RevokeRefreshTokenAsync(string token);
        Task<bool> SetAgentActiveAsync(Guid agentId, bool isActive);
        Task<bool> UpdateAgentAsync(Guid agentId, UpdateAgentRequest request);
    }
}



