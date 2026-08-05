using System.Net;
using System.Security.Claims;
using Alpha.Common;
using Alpha.Model;
using Alpha.Service.Common;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;

namespace Alpha.WebAPI.Controllers
{
    [ApiController]
    [Route("api/[controller]")]
    public class StatisticsController : ControllerBase
    {
        protected IInsurancePolicyService _insurancePolicyService;
        protected IInsuranceCompanyService _insuranceCompanyService;
        protected IPartnerService _partnerService;
        protected ILocationService _locationService;

        public StatisticsController(
            IInsurancePolicyService insurancePolicyService,
            IInsuranceCompanyService insuranceCompanyService,
            IPartnerService partnerService,
            ILocationService locationService)
        {
            _insurancePolicyService = insurancePolicyService;
            _insuranceCompanyService = insuranceCompanyService;
            _partnerService = partnerService;
            _locationService = locationService;
        }

        /// <summary>
        /// Fetches statistical data for the dashboard, including total policies, active policies, expired policies, and policies by insurance type for a given year.
        /// </summary>
        /// <param name="year"></param>
        /// <returns></returns>
        
        /*
        [HttpGet("tab-counts")]
        public async Task<IActionResult> GetTabCounts([FromQuery] int year = 2026)
        {
            try{
                var stats = await _insurancePolicyService.GetDashboardStatisticsAsync(year);
                return Ok(stats);
            }
            catch (Exception ex)
            {
                return StatusCode(500, "An error occurred while processing your request for dashboard statistics." + ex.Message);
            }
        }
        */

        /// <summary>
        /// Compares the number of insurance policies created in this year with the previous year and calculates the percentage change.
        /// Does not consider policies that have a starting date in the future, ensuring that only active policies up to the current date are included in the comparison.
        /// </summary>
        /// <param name="year"></param>
        /// <returns></returns> 
        [Authorize]
        [HttpGet("yearly-comparison")]
        public async Task<IActionResult> GetYearlyPolicyComparisonAsync([FromQuery] int year)
        {
            try
            {
                (int currentYear, double percentageChange) = await _insurancePolicyService.GetYearlyPolicyCountComparisonAsync(year);
                return Ok(new { currentYear, percentageChange });
            }
            catch (Exception ex)
            {
                return StatusCode(500, "Greška pri dohvaćanju statistike.");
            }
        }

        /// <summary>
        /// Fetches the number of insurance policies entered today and compares it to the average number of policies entered per day, calculating the percentage difference.
        /// </summary>
        /// <returns></returns>
        [Authorize]
        [HttpGet("todays-stats")]
        public async Task<IActionResult> GetTodaysEnteredPoliciesStatisticsAsync()
        {
            try
            {
                (int todaysPolicies, double dayComparison) = await _insurancePolicyService.GetTodaysEnteredPoliciesStatisticsAsync();
                return Ok(new { todaysPolicies, dayComparison });
            }
            catch (Exception ex)
            {
                return StatusCode(500, "An error occurred while processing your request for today's entered policies statistics." + ex.Message);
            }
        }

        /// <summary>
        /// Fetches the total sum of premiums for insurance policies entered today.
        /// </summary>
        /// <returns></returns>
        [Authorize]
        [HttpGet("premium-sum")]
        public async Task<IActionResult> GetTodaysPremiumSumAsync([FromQuery] int year)
        {
            try
            {
                (decimal todaysSum, decimal yearlySum) = await _insurancePolicyService.GetPremiumSumsAsync(year);
                return Ok(new { todaysSum, yearlySum });
            }
            catch (Exception ex)
            {
                return StatusCode(500, "An error occurred while processing your request for premium sum." + ex.Message);
            }
        }

        /// <summary>
        /// Fetches a paginated list of insurance policies entered today, with optional filtering by insurance type and partner. 
        /// The response includes the total count of policies matching the filter criteria to support pagination on the client side.
        /// </summary>
        /// <param name="filter"></param>
        /// <param name="pageNumber"></param>
        /// <param name="pageSize"></param>
        /// <returns></returns>
        //[Authorize]
        [HttpGet("todays-filter-options")]
        public async Task<IActionResult> GetTodaysFilterOptionsAsync()
        {
            try
            {
                var (agents, locations) = await _insurancePolicyService.GetTodaysFilterOptionsAsync();
                return Ok(new { agents, locations });
            }
            catch (Exception ex)
            {
                return StatusCode(500, "An error occurred while fetching today's filter options." + ex.Message);
            }
        }

        [Authorize]
        [HttpGet("latest-policy")]
        public async Task<IActionResult> GetLatestEnteredPolicyAsync()
        {
            try
            {
                var policy = await _insurancePolicyService.GetLatestEnteredPolicyAsync();
                if (policy == null)
                    return NoContent();
                return Ok(policy);
            }
            catch (Exception ex)
            {
                return StatusCode(500, "An error occurred while fetching the latest policy." + ex.Message);
            }
        }

        [Authorize]
        [HttpGet("agent-summary")]
        public async Task<IActionResult> GetAgentSummaryAsync()
        {
            try
            {
                var agentId = Guid.Parse(User.FindFirstValue(ClaimTypes.NameIdentifier)!);
                var summary = await _insurancePolicyService.GetAgentSummaryAsync(agentId);
                return Ok(summary);
            }
            catch (Exception ex)
            {
                return StatusCode(500, "An error occurred while fetching agent summary." + ex.Message);
            }
        }

        [HttpGet("todays-policies")]
        public async Task<IActionResult> GetTodaysPoliciesAsync([FromQuery] DailyStatisticsFiltering filter, [FromQuery] int pageNumber = 1, [FromQuery] int pageSize = 10)
        {
            try
            {
                var paging = new Paging
                {
                    PageNumber = pageNumber,
                    PageSize = pageSize
                };

                var policies = await _insurancePolicyService.GetTodaysInsurancePoliciesAsync(paging, filter);
                var totalCount = await _insurancePolicyService.GetTotalFilteredPoliciesCountAsync(filter);

                var result = new Alpha.Common.PagedResponse<TodayEnteredPolicies>
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
                return StatusCode(500, "An error occurred while processing your request for today's policies." + ex.Message);
            }
        }

        /// <summary>
        /// Fetches the top 6 insurance partners based on the number of policies.
        /// </summary>
        /// <param name="year"></param>
        /// <returns></returns>
        [Authorize(Roles = "Admin")]
        [HttpGet("top-partners")]
        public async Task<IActionResult> GetTopPartnersAsync([FromQuery] int year)
        {
            try
            {
                List<PartnerPolicyCount> topPartners = await _insurancePolicyService.GetTopPartnersByPolicyCountAsync(year);
                return Ok(topPartners);
            }
            catch (Exception ex)
            {
                return StatusCode(500, "An error occurred while processing your request for top partners." + ex.Message);
            }
        }

        /// <summary>
        /// Fetches data for generating charts that display the number of insurance policies created over a specified period (e.g., daily, monthly) for a given year.
        /// </summary>
        /// <param name="period"></param>
        /// <param name="year"></param>
        /// <returns></returns>
        [Authorize(Roles = "Admin")]
        [HttpGet("policies-chart-data")]
        public async Task<IActionResult> GetPoliciesChartDataAsync([FromQuery] string period)
        {
            try
            {                
                List<ChartDataItem> chartData = await _insurancePolicyService.GetPoliciesChartDataAsync(period);
                return Ok(chartData);
            }
            catch (Exception ex)            
            {
                return StatusCode(500, "An error occurred while processing your request for policies chart data." + ex.Message);
            }
        }   

        /// <summary>
        /// Fetches statistics about unrenewed insurance policies based on the specified period and year.
        /// </summary>
        /// <param name="period"></param>
        /// <param name="year"></param>
        /// <returns></returns>
        [Authorize(Roles = "Admin")]
        [HttpGet("unrenewed-policies")]
        public async Task<IActionResult> GetUnrenewedPoliciesAsync([FromQuery] string period)
        {
            try
            {                
                ExpiringPolicyStats stats = await _insurancePolicyService.GetUnrenewedPoliciesAsync(period);
                return Ok(stats);
            }
            catch (Exception ex)            
            {
                return StatusCode(500, "An error occurred while processing your request for unrenewed policies statistics." + ex.Message);
            }
        }

        /// <summary>
        /// Fetches statistics about insurance policies that are set to expire within the next 14 days based on the specified period and year.
        /// </summary>
        /// <param name="period"></param>
        /// <param name="year"></param>
        /// <returns></returns>
        [Authorize(Roles = "Admin")]
        [HttpGet("expiring-policies")]
        public async Task<IActionResult> GetExpiringPoliciesAsync()
        {
            try
            {                
                List<ExpiringPolicyStats> stats = await _insurancePolicyService.GetExpiringPoliciesAsync();
                return Ok(stats);
            }
            catch (Exception ex)            
            {
                return StatusCode(500, "An error occurred while processing your request for expiring policies statistics." + ex.Message);
            }
        }

        // ------------------------------

        /// <summary>
        /// Graf za broj polica po tjednima - podržava periode 1T, 1M, 3M, ytd, 1G, max uz filtriranje.
        /// Ako su postavljeni dateFrom/dateTo u filteru, koriste se umjesto perioda.
        /// </summary>
        //[Authorize]
        [HttpGet("sales/chart")]
        public async Task<IActionResult> GetSalesChartAsync([FromQuery] string period = "ytd", [FromQuery] StatisticsFiltering filter = null)
        {
            try
            {
                filter ??= new StatisticsFiltering();
                if (string.IsNullOrWhiteSpace(filter.Year))
                    filter.Year = DateTime.Today.Year.ToString();

                var chartData = await _insurancePolicyService.GetFilteredPoliciesChartDataAsync(period, filter);
                return Ok(chartData);
            }
            catch (Exception ex)
            {
                return StatusCode(500, "Greška pri dohvaćanju podataka za grafikon." + ex.Message);
            }
        }

        /// <summary>
        /// Usporedba sume premija po godinama (kumulativno po mjesecima).
        /// Parametar years je lista godina odvojena zarezom, npr. "2025,2026".
        /// </summary>
        //[Authorize]
        [HttpGet("sales/premium-comparison")]
        public async Task<IActionResult> GetPremiumComparisonAsync([FromQuery] string years, [FromQuery] StatisticsFiltering filter = null)
        {
            try
            {
                filter ??= new StatisticsFiltering();

                var yearList = new List<int>();
                if (!string.IsNullOrWhiteSpace(years))
                {
                    foreach (var y in years.Split(','))
                    {
                        if (int.TryParse(y.Trim(), out int parsed))
                            yearList.Add(parsed);
                    }
                }

                int currentYear = DateTime.Today.Year;

                if (yearList.Count == 0)
                    yearList.Add(currentYear);
                else if (!yearList.Contains(currentYear))
                    yearList.Add(currentYear);

                var data = await _insurancePolicyService.GetPremiumComparisonDataAsync(yearList, filter);
                return Ok(data);
            }
            catch (Exception ex)
            {
                return StatusCode(500, "Greška pri dohvaćanju usporedbe premija." + ex.Message);
            }
        }

        /// <summary>
        /// Statistika kreiranih polica - omjer novih i produženih polica.
        /// </summary>
        //[Authorize]
        [HttpGet("sales/creation-stats")]
        public async Task<IActionResult> GetPolicyCreationStatsAsync([FromQuery] StatisticsFiltering filter = null)
        {
            try
            {
                filter ??= new StatisticsFiltering();
                if (string.IsNullOrWhiteSpace(filter.Year))
                    filter.Year = DateTime.Today.Year.ToString();

                var stats = await _insurancePolicyService.GetPolicyCreationStatsAsync(filter);
                return Ok(stats);
            }
            catch (Exception ex)
            {
                return StatusCode(500, "Greška pri dohvaćanju statistike kreiranja polica." + ex.Message);
            }
        }

        /// <summary>
        /// Police po mjestima - postotak polica po prodajnom mjestu.
        /// </summary>
        //[Authorize]
        [HttpGet("sales/location-stats")]
        public async Task<IActionResult> GetLocationStatsAsync([FromQuery] StatisticsFiltering filter = null)
        {
            try
            {
                filter ??= new StatisticsFiltering();
                if (string.IsNullOrWhiteSpace(filter.Year))
                    filter.Year = DateTime.Today.Year.ToString();

                var stats = await _insurancePolicyService.GetPolicyLocationStatsAsync(filter);
                return Ok(stats);
            }
            catch (Exception ex)
            {
                return StatusCode(500, "Greška pri dohvaćanju statistike po mjestima." + ex.Message);
            }
        }

        /// <summary>
        /// Statistika osiguravajućih kuća - ukupno po filteru + godišnji pregled po svakoj kući (2023 do danas).
        /// </summary>
        //[Authorize]
        [HttpGet("sales/insurance-company-stats")]
        public async Task<IActionResult> GetInsuranceCompanyStatsAsync([FromQuery] StatisticsFiltering filter = null)
        {
            try
            {
                filter ??= new StatisticsFiltering();
                if (string.IsNullOrWhiteSpace(filter.Year))
                    filter.Year = DateTime.Today.Year.ToString();

                var stats = await _insurancePolicyService.GetInsuranceCompanyYearlyStatsAsync(filter);
                return Ok(stats);
            }
            catch (Exception ex)
            {
                return StatusCode(500, "Greška pri dohvaćanju statistike osiguravajućih kuća." + ex.Message);
            }
        }

        /// <summary>
        /// Statistika partnera - broj polica i postotak po partneru.
        /// </summary>
        //[Authorize]
        [HttpGet("sales/partner-stats")]
        public async Task<IActionResult> GetPartnerStatsAsync([FromQuery] StatisticsFiltering filter = null)
        {
            try
            {
                filter ??= new StatisticsFiltering();
                if (string.IsNullOrWhiteSpace(filter.Year))
                    filter.Year = DateTime.Today.Year.ToString();

                var stats = await _insurancePolicyService.GetPartnerStatsAsync(filter);
                return Ok(stats);
            }
            catch (Exception ex)
            {
                return StatusCode(500, "Greška pri dohvaćanju statistike partnera." + ex.Message);
            }
        }

        [Authorize]
        [HttpGet("bskadenca")]
        public async Task<IActionResult> GetBSkadencaAsync(
            [FromQuery] int year = 0,
            [FromQuery] int comparisonYear = 0,
            [FromQuery] StatisticsFiltering? filter = null)
        {
            try
            {
                int currentYear = DateTime.Today.Year;
                if (year == 0) year = currentYear;
                if (comparisonYear == 0) comparisonYear = year - 1;
                filter ??= new StatisticsFiltering();

                var data = await _insurancePolicyService.GetBSkadencaDataAsync(year, comparisonYear, filter);
                return Ok(data);
            }
            catch (Exception ex)
            {
                return StatusCode(500, "Greška pri dohvaćanju B-skadence." + ex.Message);
            }
        }
    }
}
