using System.Net;
using Alpha.Common;
using Alpha.Model;
using Alpha.Service.Common;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using Microsoft.VisualBasic;

namespace Alpha.WebAPI.Controllers
{
    [Route("api/Clients")]
    [ApiController]
    public class ClientsController : ControllerBase
    {
        protected IClientService _clientService;

        public ClientsController(IClientService clientService)
        {
            _clientService = clientService;
        }

        /// <summary>
        /// Fetches a list of clients based on their OIB.
        /// This is used to retrieve client information when a user searches for a client by their OIB in the frontend, allowing the system to display relevant client details associated with that OIB.
        /// </summary>
        /// <param name="oib"></param>
        /// <returns></returns>
        [Authorize]
        [HttpGet("getListOfClientsByOib/{oib}")]
        public async Task<IActionResult> GetClientByOib(string oib)
        {
            try
            {
                var clients = await _clientService.GetAllClientsByOibAsync(oib);

                if (clients.Count == 0)
                    return NotFound("No clients found with that OIB.");

                return Ok(clients);
            }
            catch (Exception ex)
            {
                return StatusCode(500, "Error while trying to fetch client list by OIB. " + ex);
            }
        }

        /// <summary>
        /// Updates the OIB (personal identification number) of a client.
        /// This is used when a user who doesn't have an OIB at the time of creating a policy later provides their OIB, allowing the system to update the client's record with the new OIB information.
        /// </summary>
        /// <param name="clientId"></param>
        /// <param name="oib"></param>
        /// <returns></returns>
        [Authorize]
        [HttpPatch("updateClientOib/{clientId}/oib")]
        public async Task<IActionResult> UpdateClientOib(Guid clientId, [FromBody] string oib)
        {
            try
            {
                await _clientService.IsOibUpdated(clientId, oib);
                return Ok();
            }
            catch (Exception ex)
            {
                return StatusCode(500, "Greška pri ažuriranju OIB-a." + ex.Message);
            }
        }

        /// <summary>
        /// Changes the client associated with an insurance policy to a different client. 
        /// This is used when a user wants to change the client information for an existing insurance policy, allowing them to link the policy to a different client record in the system.
        /// </summary>
        /// <param name="clientRequest"></param>
        /// <returns></returns>
        [Authorize]
        [HttpPatch("ChangeClient")]
        public async Task<IActionResult> ChangeToDifferentClient(ChangeClientRequest clientRequest)
        {
            try
            {
                await _clientService.ChangeToDifferentClientAsync(clientRequest);
                return Ok();
            }
            catch (Exception ex)
            {
                return StatusCode(500, "Greška pri promjeni klijenta." + ex.Message);
            }
        }

        /// <summary>
        /// Updates the details of an existing client, such as their OIB, name, email address, phone number, and date of birth.
        /// This update is being called when a user is editing insurance policy details and wants to update the associated client's information.
        /// </summary>
        /// <param name="clientRequest"></param>
        /// <returns></returns>
        [Authorize]
        [HttpPatch("UpdateClient")]
        public async Task<IActionResult> UpdateClient([FromQuery] UpdateClientRequest clientRequest)
        {
            try
            {
                await _clientService.UpdateClientAsync(clientRequest);
                return Ok();
            }
            catch (Exception ex)
            {
                return StatusCode(500, "Greška pri ažuriranju klijenta." + ex.Message);
            }
        }

        /// <summary>
        /// Gets the number of inactive clients that had at least one active policy, but don't have one active right now
        /// </summary>
        /// <returns></returns>
        [HttpGet("InactiveClients")]
        public async Task<IActionResult> NumberOfInactiveClients()
        {
            try
            {
                return Ok(await _clientService.GetInactiveClientsAsync());
            }
            catch(Exception ex)
            {
                return StatusCode(500, "Greška pri dohvaćanju klijenata s isteklim policama osiguranja." + ex.Message);
            }
        }

        /// <summary>
        /// Gets the number of clients that don't have an existing active policy, but the last policy had expired 2 weeks ago
        /// </summary>
        /// <returns></returns>
        [HttpGet("RecentlyLostClients")]
        public async Task<IActionResult> NumberOfRecentlyLostClients()
        {
            try
            {
                return Ok(await _clientService.GetRecentlyLostClientsCountAsync());
            } 
            catch(Exception ex)
            {
                return StatusCode(500, "Greška pri dohvaćanju nedavno izgubljenih klijenata." + ex.Message);
            } 
        }

        /// <summary>
        /// Fetches a list of clients based on various filters
        /// </summary>
        /// <param name="filter"></param>
        /// <param name="pageNumber"></param>
        /// <param name="pageSize"></param>
        /// <returns></returns>
        [HttpGet("GetAllClients")]
        public async Task<IActionResult> GetClients([FromQuery] ClientFiltering filter, [FromQuery] int pageNumber = 1, [FromQuery] int pageSize = 10)
        {
            try
            {
                var paging = new Paging
                {
                    PageNumber = pageNumber,
                    PageSize = pageSize
                };

                var clients = await _clientService.GetAllFilteredClientsAsync(filter, paging);
                var totalCount = await _clientService.GetTotalClientCountAsync(filter);

                var result = new Alpha.Common.PagedResponse<ClientModelView>
                {
                    Items = clients,
                    PageNumber = pageNumber,
                    PageSize = pageSize,
                    TotalCount = totalCount,
                    TotalPages = (int)Math.Ceiling((double)totalCount / pageSize)
                };

                return Ok(result);
            }
            catch(Exception ex)
            {
                return StatusCode(500, "Greška pri pokušaju učitavanja svih ugovaratelja." + ex.Message);
            }
        } 

        [HttpGet("TabCounts")]
        public async Task<IActionResult> GetTabCounts()
        {
            return Ok();
        }

        [HttpGet("ClientDetails/{clientId}")]
        public async Task<IActionResult> GetClientDetails(Guid clientId)
        {
            try
            {
                return Ok(await _clientService.GetClientDetailsByIdAsync(clientId));
            }
            catch(Exception ex)
            {
                return StatusCode(500, "Greška pri učitavanju detalja o ugovaratelju." + ex.Message);
            }
        }
    }
}