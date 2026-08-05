using Alpha.Common;
using Alpha.Model;
using System;
using System.Collections.Generic;
using System.Linq;
using System.Text;
using System.Threading.Tasks;

namespace Alpha.Service.Common
{
    public interface IAgentService
    {
        Task<LoginInfo> CheckLoginInfoAsync(LoginRequest userDetails);
        Task<List<string>> GetAllAgentsAsync();
        Task<List<AgentModelView>> GetAllAgentsAsync(AgentFiltering filter, Paging paging);
        Task<int> GetTotalAgentsCountAsync(AgentFiltering filter);
        Task<AgentDetailsView> GetAgentDetailsByIdAsync(Guid agentId);
        Task<bool> AddAgentAsync(AddAgentRequest request);

        // ------------------- AGENT METHODS FROM WEBFORMS ------------------

        Task<AgentDto> GetAgentByIdAsync(string id);
        Task<bool> CheckIfIdNumberExistsAsync(string id);
        Task<bool> IsEmployeeDeletedAsync(Guid id);
        Task<bool> CheckIfUserIsAdminAsync(string id);
        Task<bool> CheckCurrentUsersPasswordAsync(string id, string password);
        Task<bool> UpdateUsersPasswordAsync(string id, string password);
        Task<bool> SetAgentActiveAsync(Guid agentId, bool isActive);
        Task<bool> UpdateAgentAsync(Guid agentId, UpdateAgentRequest request);

        Task<LoginInfo> GetLoginInfoByAgentIdAsync(Guid agentId);
        Task StoreRefreshTokenAsync(Guid agentId, string token, DateTime expiresAt);
        Task<RefreshToken> GetRefreshTokenAsync(string token);
        Task RevokeRefreshTokenAsync(string token);
    }
}



