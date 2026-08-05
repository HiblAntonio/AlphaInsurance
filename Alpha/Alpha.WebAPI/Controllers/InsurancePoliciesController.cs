using System.Security.Claims;
using Alpha.Common;
using Alpha.Model;
using Alpha.Service.Common;
using Microsoft.AspNetCore.Mvc;
using Microsoft.AspNetCore.Authorization;

namespace Alpha.WebAPI.Controllers
{
    [ApiController]
    [Route("api/[controller]")]
    public class InsurancePoliciesController : ControllerBase
    {
        protected IInsurancePolicyService _insurancePolicyService;
        protected ILocationService _locationService;
        protected IClientService _clientService;

        public InsurancePoliciesController(IInsurancePolicyService insurancePolicyService, IClientService clientService)
        {
            _insurancePolicyService = insurancePolicyService;
            _clientService = clientService;
        }

        /// <summary>
        /// Fetches a list of insurance policies based on various filters (search, status, insurance company, insurance type, location, partner, price range, date range) and supports pagination.
        /// </summary>
        //[HttpGet("GetPolicies")]
        [Authorize]
        [HttpGet]
        public async Task<IActionResult> GetPolicies([FromQuery] InsuranceFiltering filter, [FromQuery] int pageNumber = 1, [FromQuery] int pageSize = 10)
        {
            try
            {
                var paging = new Paging
                {
                    PageNumber = pageNumber,
                    PageSize = pageSize
                };

                var policies = await _insurancePolicyService.GetInsurancePolicyListAsync(filter, paging, false);
                var totalCount = await _insurancePolicyService.GetTotalPolicyCountAsync(filter);

                var result = new Alpha.Common.PagedResponse<InsurancePolicyModelView>
                {
                    Items = policies,
                    PageNumber = pageNumber,
                    PageSize = pageSize,
                    TotalCount = totalCount,
                    TotalPages = (int)Math.Ceiling((double)totalCount / pageSize)
                };

                return Ok(result);
            }
            catch (Exception ex)
            {
                return StatusCode(500, "An error occurred while processing your request for insurance policies." + ex.Message);
            }
        }

        /// <summary>
        /// Fetches detailed information about a specific insurance policy based on its unique identifier (ID). 
        /// This is used to display the details of an insurance policy when a user clicks on it in the frontend.
        /// </summary>
        /// <param name="policyId"></param>
        /// <returns></returns>
        //[Authorize]
        [HttpGet("policyDetails/{policyId}")]
        public async Task<IActionResult> GetPolicyDetailsById(Guid policyId)
        {
            try
            {
                InsurancePolicyView policy = await _insurancePolicyService.GetInsurancePolicyDetailsByIdAsync(policyId);

                if (policy == null)
                {
                    return NotFound("Policy not found.");
                }

                return Ok(policy);
            }
            catch (Exception ex)
            {
                return StatusCode(500, "An error occurred while processing your request for insurance policy details." + ex.Message);
            }
        }

        [Authorize]
        [HttpGet("filter-options")]
        public async Task<IActionResult> GetFilterOptions()
        {
            try
            {
                var (companies, policyTypes, locations, partners) = await _insurancePolicyService.GetDashboardFilterOptionsAsync();
                return Ok(new { companies, policyTypes, locations, partners });
            }
            catch (Exception ex)
            {
                return StatusCode(500, "Greška pri dohvaćanju opcija filtera." + ex.Message);
            }
        }

        /// <summary>
        /// Fetches counts for different tabs (All, Active, Inactive, Two Weeks Remaining, One Week Remaining) based on the provided year.
        /// This is used to display the number of insurance policies in each tab on the frontend.
        /// </summary>
        /// <param name="year"></param>
        /// <returns></returns>
        [Authorize]
        [HttpGet("tab-counts")]
        public async Task<IActionResult> GetTabCounts([FromQuery] InsuranceFiltering baseFilter, [FromQuery] int year = 2026)
        {
            try{
                async Task<int> GetCountForStatus(string status)
                {
                    var filter = new InsuranceFiltering(
                        year: year,
                        isAsc: false,
                        search: baseFilter?.Search ?? string.Empty,
                        priceFrom: baseFilter?.PriceFrom ?? 0,
                        priceTo: baseFilter?.PriceTo ?? decimal.MaxValue,
                        dateFrom: baseFilter?.DateFrom,
                        dateTo: baseFilter?.DateTo,
                        status: status,
                        insuranceCompany: baseFilter?.InsuranceCompany,
                        insuranceType: baseFilter?.InsuranceType,
                        location: baseFilter?.Location,
                        partner: baseFilter?.Partner
                    );

                    return await _insurancePolicyService.GetTotalPolicyCountAsync(filter);
                }

                var allCount = await GetCountForStatus(string.Empty);
                var activeCount = await GetCountForStatus("ActiveStatus");
                var inactiveCount = await GetCountForStatus("InactiveStatus");
                var twoWeekCount = await GetCountForStatus("TwoWeekStatus");
                var oneWeekCount = await GetCountForStatus("OneWeekStatus");

                return Ok(new
                {
                    svi = allCount,
                    aktivni = activeCount,
                    neaktivni = inactiveCount,
                    dvaTjedna = twoWeekCount,
                    tjedan = oneWeekCount
                });
            }
            catch (Exception ex)
            {
                return StatusCode(500, "An error occurred while processing your request for tab counts.");
            }
        }

        /// <summary>
        /// Creates a new insurance policy. If the client associated with the policy is new, it first creates the client and then creates the insurance policy linked to that client.
        /// </summary>
        /// <param name="request"></param>
        /// <returns></returns>
        [Authorize]
        [HttpPost("CreatePolicy")]
        public async Task<IActionResult> CreatePolicy([FromBody] CreatePolicyRequest request)
        {
            try
            {
                var agentId = Guid.Parse(User.FindFirstValue(ClaimTypes.NameIdentifier)!);
                await _insurancePolicyService.AddInsurancePolicyAsync(request, agentId);

                return Ok();
            }
            catch (InvalidOperationException ex)
            {
                return Conflict(ex.Message);
            }
            catch (Exception ex)
            {
                return StatusCode(500, "Greška pri kreiranju police." + ex.Message);
            }
        }

        /// <summary>
        /// Renews an existing insurance policy by creating a new policy .
        /// In this case, PreviousPolicyNumber is the current policy number, but that policy is being renewed, not the new one, so it becomes the previous policy number for the new record
        /// </summary>
        /// <param name="policyRequest"></param>
        /// <returns></returns>
        [Authorize]
        [HttpPost("ExtendPolicy")]
        public async Task<IActionResult> ExtendInsurancePolicy([FromBody] RenewPolicyRequest policyRequest)
        {
            try
            {
                var agentId = Guid.Parse(User.FindFirstValue(ClaimTypes.NameIdentifier)!);
                await _insurancePolicyService.RenewInsurancePolicyAsync(policyRequest, agentId);
                return Ok();
            }
            catch (InvalidOperationException ex)
            {
                return Conflict(ex.Message);
            }
            catch (Exception ex)
            {
                return StatusCode(500, "Greška pri produžavanju police." + ex.Message);
            }
        }
        
        /// <summary>
        /// Updates the details of an existing insurance policy, such as its policy number, price, remark, starting date, location, insurance company, partner, and policy type.
        /// </summary>
        /// <param name="policyRequest"></param>
        /// <returns></returns>
        [Authorize]
        [HttpPatch("UpdatePolicy/{policyId}")]
        public async Task<IActionResult> UpdatePolicyRemark([FromQuery] UpdatePolicyRequest policyRequest)
        {
            try
            {
                await _insurancePolicyService.UpdatePolicyAsync(policyRequest);
                return Ok();
            }
            catch (Exception ex)
            {
                return StatusCode(500, "Greška pri ažuriranju police." + ex.Message);
            }
        }

        /// <summary>
        /// Deletes an insurance policy based on its ID. 
        /// If the deleted policy has a previous policy number (i.e., it is a renewal of another policy), this method also updates the previous policy's "IsRenewed" status to false, indicating that it is no longer renewed.
        /// </summary>
        /// <param name="policyId"></param>
        /// <returns></returns>
        [Authorize]
        [HttpDelete("DeletePolicy/{policyId}")]
        public async Task<IActionResult> DeletePolicy(Guid policyId, [FromQuery] string deleteReason = "", [FromQuery] string deleteComment = "")
        {
            try
            {
                var deletedBy = Guid.Parse(User.FindFirstValue(ClaimTypes.NameIdentifier)!);
                await _insurancePolicyService.DeleteInsurancePolicy(policyId, deletedBy, deleteReason, deleteComment);
                return Ok();
            }
            catch (Exception ex)
            {
                return StatusCode(500, "An error occurred while processing your request to delete the insurance policy." + ex.Message);
            }
        }

        [Authorize]
        [HttpGet("deleted")]
        public async Task<IActionResult> GetDeletedPolicies()
        {
            try
            {
                var policies = await _insurancePolicyService.GetDeletedPoliciesAsync();
                return Ok(policies);
            }
            catch (Exception ex)
            {
                return StatusCode(500, "Greška pri dohvaćanju obrisanih polica." + ex.Message);
            }
        }

        [Authorize]
        [HttpGet("deleted/{policyId}")]
        public async Task<IActionResult> GetDeletedPolicyById(Guid policyId)
        {
            try
            {
                var policy = await _insurancePolicyService.GetDeletedPolicyByIdAsync(policyId);
                if (policy == null) return NotFound();
                return Ok(policy);
            }
            catch (Exception ex)
            {
                return StatusCode(500, "Greška pri dohvaćanju obrisane police." + ex.Message);
            }
        }

        [Authorize]
        [HttpPost("restore/{policyId}")]
        public async Task<IActionResult> RestorePolicy(Guid policyId)
        {
            try
            {
                await _insurancePolicyService.RestorePolicyAsync(policyId);
                return Ok();
            }
            catch (Exception ex)
            {
                return StatusCode(500, "Greška pri vraćanju police." + ex.Message);
            }
        }



        // Dohvaćanje posljednje dodane police osiguranja od strane djelatnika
        // kada je najbolje da program loada police osiguranja
    }
}
