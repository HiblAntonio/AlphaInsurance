using System.Net;
using Alpha.Common;
using Alpha.Model;
using Alpha.Service.Common;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;

namespace Alpha.WebAPI.Controllers
{
    [ApiController]
    [Route("api/[controller]")]
    public class AgentController : ControllerBase
    {
        private readonly IAgentService _agentService;

       public AgentController(IAgentService agentService)
        {
            _agentService = agentService;
        }

        //[Authorize]
        [HttpGet]
        public async Task<IActionResult> GetAllAgents()
        {
            try
            {
                return Ok(await _agentService.GetAllAgentsAsync());
            }
            catch (Exception ex)
            {
                return StatusCode(500, "An error occurred while processing your request for list of agents");
            }
        }

        [HttpGet("AgentList")]
        public async Task<IActionResult> GetAgentsList([FromQuery] AgentFiltering filter, [FromQuery] int pageNumber = 1, [FromQuery] int pageSize = 10)
        {
            try
            {
                var paging = new Paging
                {
                    PageNumber = pageNumber,
                    PageSize = pageSize
                };

                var policies = await _agentService.GetAllAgentsAsync(filter, paging);
                var totalCount = await _agentService.GetTotalAgentsCountAsync(filter);

                var result = new Alpha.Common.PagedResponse<AgentModelView>
                {
                    Items = policies,
                    PageNumber = pageNumber,
                    PageSize = pageSize,
                    TotalCount = totalCount,
                    TotalPages = (int)Math.Ceiling((double)totalCount / pageSize)
                };

                return Ok(result);   
            }
            catch(Exception ex)
            {
                return StatusCode(500, "Dogodila se greška prilikom pokušaja dohvata podataka o listi agenata." + ex.Message);
            }
        }

        
        [HttpGet("AgentDetails/{agentId}")]
        public async Task<IActionResult> GetAgentDetails(Guid agentId)
        {
            try
            {
                return Ok(await _agentService.GetAgentDetailsByIdAsync(agentId));
            }
            catch(Exception ex)
            {
                return StatusCode(500, "Dogodila se greška prilikom učitavanja detalja odabranog djelatnika." + ex.Message);
            }
        }
        
        [Authorize]
        [HttpPatch("{agentId}/active")]
        public async Task<IActionResult> SetAgentActive(Guid agentId, [FromBody] SetAgentActiveRequest request)
        {
            try
            {
                var success = await _agentService.SetAgentActiveAsync(agentId, request.IsActive);
                if (!success) return NotFound("Djelatnik nije pronađen.");
                return Ok();
            }
            catch (Exception ex)
            {
                return StatusCode(500, "Greška pri promjeni statusa djelatnika. " + ex.Message);
            }
        }

        [Authorize(Roles = "Admin,Super Admin")]
        [HttpPut("{agentId}")]
        public async Task<IActionResult> UpdateAgent(Guid agentId, [FromBody] UpdateAgentRequest request)
        {
            if (request == null) return BadRequest("Podaci su obavezni.");
            try
            {
                var success = await _agentService.UpdateAgentAsync(agentId, request);
                return success ? Ok() : NotFound("Djelatnik nije pronađen.");
            }
            catch (Exception ex)
            {
                return StatusCode(500, "Greška pri ažuriranju djelatnika. " + ex.Message);
            }
        }

        [HttpPost("AddAgent")]
        public async Task<IActionResult> AddAgent([FromBody] AddAgentRequest request)
        {
            try
            {
                bool success = await _agentService.AddAgentAsync(request);
                if (!success)
                    return BadRequest("Dodavanje agenta nije uspjelo.");

                return Ok();
            }
            catch (Exception ex)
            {
                return StatusCode(500, "Dogodila se greška prilikom dodavanja novog agenta. " + ex.Message);
            }
        }
    }
}