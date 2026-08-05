using Alpha.Model;
using Alpha.Common;
using Alpha.Repository.Common;
using Alpha.Service.Common;
using System;
using System.Collections.Generic;
using System.Configuration;
using System.Linq;
using System.Text;
using System.Threading.Tasks;

namespace Alpha.Service
{
    public class ClientService : IClientService
    {
        private readonly IClientRepository clientRepository;

        public ClientService(IClientRepository _clientRepository)
        {
            clientRepository = _clientRepository;
        }

        public async Task<List<ClientView>> GetAllClientsByOibAsync(string oib)
        {
            return await clientRepository.GetAllClientsByOibAsync(oib);
        }

        public async Task<Guid> AddClientAsync(ClientRequest client)
        {
            return await clientRepository.AddClientAsync(client);
        }

        public async Task<bool> IsOibUpdated(Guid clientId, string oib)
        {
            return await clientRepository.UpdateOib(clientId, oib);
        }

        public async Task<bool> ChangeToDifferentClientAsync(ChangeClientRequest client)
        {
            if (client.Client.IsNew)
                client.Client.ClientId = await clientRepository.AddClientAsync(client.Client);

            return await clientRepository.ChangeToDifferentClientAsync(client);
        }

        public async Task<bool> UpdateClientAsync(UpdateClientRequest client)
        {
            return await clientRepository.UpdateClientAsync(client);
        }

        public async Task<int> GetInactiveClientsAsync()
        {
            return await clientRepository.GetInactiveClientsAsync();
        }

        public async Task<int> GetRecentlyLostClientsCountAsync()
        {
            return await clientRepository.GetRecentlyLostClientsCountAsync();
        }

        public async Task<List<ClientModelView>> GetAllFilteredClientsAsync(ClientFiltering filter, Paging paging)
        {
            return await clientRepository.GetAllFilteredClientsAsync(filter, paging);
        }

        public async Task<int> GetTotalClientCountAsync(ClientFiltering filter)
        {
            return await clientRepository.GetTotalClientCountAsync(filter);
        }

        public async Task<ClientDetailsView> GetClientDetailsByIdAsync(Guid clientId)
        {
            return await clientRepository.GetClientDetailsByIdAsync(clientId);
        }


        // ------------------- CLIENT METHODS FROM WEBFORMS ------------------

        public async Task<bool> ClientExistsAsync(string oib)
        {
            return await clientRepository.ClientExistsAsync(oib);
        }

        public async Task<bool> ClientExistsByNameAsync(string name)
        {
            return await clientRepository.ClientExistsByNameAsync(name);
        }

        public async Task<Guid> GetClientIdByName(string name)
        {
            return await clientRepository.GetClientIdByName(name);
        }

        public async Task<string> GetClientOibByName(string name)
        {
            return await clientRepository.GetClientOibByName(name);
        }

        public async Task<List<BirthdaysInfo>> BirthdaysInfos()
        {
            return await clientRepository.GetBirthdaysInfosAsync();
        }

        public async Task<Guid> GetClientIdByOib(string oib)
        {
            return await clientRepository.GetClientIdByOibAsync(oib);
        }
    }
}



