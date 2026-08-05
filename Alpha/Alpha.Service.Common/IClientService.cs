using Alpha.Model;
using Alpha.Common;
using System;
using System.Collections.Generic;
using System.Linq;
using System.Text;
using System.Threading.Tasks;

namespace Alpha.Service.Common
{
    public interface IClientService
    {
        Task<List<ClientView>> GetAllClientsByOibAsync(string oib);
        Task<Guid> AddClientAsync(ClientRequest client);
        Task<bool> IsOibUpdated(Guid clientId, string oib);
        Task<bool> ChangeToDifferentClientAsync(ChangeClientRequest clientRequest);
        Task<bool> UpdateClientAsync(UpdateClientRequest clientRequest);
        Task<int> GetInactiveClientsAsync();
        Task<int> GetRecentlyLostClientsCountAsync();
        Task<List<ClientModelView>> GetAllFilteredClientsAsync(ClientFiltering filter, Paging paging);
        Task<int> GetTotalClientCountAsync(ClientFiltering filter);
        Task<ClientDetailsView> GetClientDetailsByIdAsync(Guid clientId);

        // ------------------- CLIENT METHODS FROM WEBFORMS ------------------

        Task<bool> ClientExistsAsync(string oib);
        Task<bool> ClientExistsByNameAsync(string name);
        Task<Guid> GetClientIdByName(string name);
        Task<Guid> GetClientIdByOib(string oib);
        Task<string> GetClientOibByName(string name);
        Task<List<BirthdaysInfo>> BirthdaysInfos();
    }
}



