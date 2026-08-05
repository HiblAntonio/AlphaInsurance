using Alpha.Common;
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
    public class AgentService : IAgentService
    {
        private readonly IAgentRepository agentRepository;

        public AgentService(IAgentRepository _agentRepository)
        {
            agentRepository = _agentRepository;
        }

        public async Task<LoginInfo> CheckLoginInfoAsync(LoginRequest userDetails)
        {
            return await agentRepository.CheckLoginInfoAsync(userDetails);
        }

        public async Task<List<string>> GetAllAgentsAsync()
        {
            return await agentRepository.GetAllAgentsAsync();
        }

        public async Task<List<AgentModelView>> GetAllAgentsAsync(AgentFiltering filter, Paging paging)
        {
            return await agentRepository.GetAllAgentsAsync(filter, paging);
        }

        public async Task<int> GetTotalAgentsCountAsync(AgentFiltering filter)
        {
            return await agentRepository.GetTotalAgentsCountAsync(filter);
        }

        public async Task<AgentDetailsView> GetAgentDetailsByIdAsync(Guid agentId)
        {
            return await agentRepository.GetAgentDetailsByIdAsync(agentId);
        }

        public async Task<bool> AddAgentAsync(AddAgentRequest request)
        {
            return await agentRepository.AddAgentAsync(request);
        }

        // ------------------- AGENT METHODS FROM WEBFORMS ------------------

        public async Task<bool> CheckCurrentUsersPasswordAsync(string id, string password)
        {
            return await agentRepository.CheckCurrentUsersPasswordAsync(id, password);
        }

        public async Task<bool> CheckIfIdNumberExistsAsync(string id)
        {
            return await agentRepository.CheckIfIDExistsAsync(id);
        }

        public async Task<bool> CheckIfUserIsAdminAsync(string id)
        {
            return await agentRepository.CheckIfUserIsAdminAsync(id);
        }

        public async Task<AgentDto> GetAgentByIdAsync(string id)
        {
            return await agentRepository.GetAgentByIdentificationNumberAsync(id);
        }

        public async Task<bool> IsEmployeeDeletedAsync(Guid id)
        {
            return await agentRepository.IsEmployeeDeletedAsync(id);
        }

        public async Task<bool> UpdateUsersPasswordAsync(string id, string password)
        {
            return await agentRepository.UpdatePasswordAsync(id, password);
        }

        public async Task<LoginInfo> GetLoginInfoByAgentIdAsync(Guid agentId)
            => await agentRepository.GetLoginInfoByAgentIdAsync(agentId);

        public async Task StoreRefreshTokenAsync(Guid agentId, string token, DateTime expiresAt)
            => await agentRepository.StoreRefreshTokenAsync(agentId, token, expiresAt);

        public async Task<RefreshToken> GetRefreshTokenAsync(string token)
            => await agentRepository.GetRefreshTokenAsync(token);

        public async Task RevokeRefreshTokenAsync(string token)
            => await agentRepository.RevokeRefreshTokenAsync(token);

        public async Task<bool> SetAgentActiveAsync(Guid agentId, bool isActive)
            => await agentRepository.SetAgentActiveAsync(agentId, isActive);

        public async Task<bool> UpdateAgentAsync(Guid agentId, UpdateAgentRequest request)
            => await agentRepository.UpdateAgentAsync(agentId, request);
    }
}



