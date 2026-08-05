using Alpha.Model;
using Alpha.Service.Common;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;

namespace Alpha.WebAPI.Controllers
{
    [ApiController]
    [Route("api/[controller]")]
    public class LocationController : ControllerBase
    {
        protected ILocationService _locationService;

        public LocationController(ILocationService locationService)
        {
            _locationService = locationService;
        }

        [Authorize]
        [HttpGet]
        public async Task<IActionResult> GetAll()
        {
            try { return Ok(await _locationService.GetAllLocationsWithStatusAsync()); }
            catch { return StatusCode(500, "Greška pri dohvaćanju prodajnih mjesta."); }
        }

        [Authorize]
        [HttpGet("active")]
        public async Task<IActionResult> GetAllActive()
        {
            try { return Ok(await _locationService.GetAllActiveLocationsAsync()); }
            catch { return StatusCode(500, "Greška pri dohvaćanju aktivnih prodajnih mjesta."); }
        }

        [Authorize(Roles = "Admin,Super Admin")]
        [HttpPost]
        public async Task<IActionResult> Add([FromBody] LookupNameRequest request)
        {
            if (string.IsNullOrWhiteSpace(request?.Name)) return BadRequest("Naziv je obavezan.");
            try
            {
                var ok = await _locationService.AddLocation(request.Name.Trim());
                return ok ? Ok() : StatusCode(500, "Greška pri dodavanju.");
            }
            catch { return StatusCode(500, "Greška pri dodavanju prodajnog mjesta."); }
        }

        [Authorize(Roles = "Admin,Super Admin")]
        [HttpPut]
        public async Task<IActionResult> Update([FromBody] LookupUpdateRequest request)
        {
            if (string.IsNullOrWhiteSpace(request?.OldName) || string.IsNullOrWhiteSpace(request?.NewName))
                return BadRequest("Stari i novi naziv su obavezni.");
            try
            {
                var ok = await _locationService.UpdateLocations(request.OldName.Trim(), request.NewName.Trim());
                return ok ? Ok() : StatusCode(500, "Greška pri ažuriranju.");
            }
            catch { return StatusCode(500, "Greška pri ažuriranju prodajnog mjesta."); }
        }

        [Authorize(Roles = "Admin,Super Admin")]
        [HttpPatch("active")]
        public async Task<IActionResult> SetActive([FromBody] LookupActiveRequest request)
        {
            if (string.IsNullOrWhiteSpace(request?.Name)) return BadRequest("Naziv je obavezan.");
            try
            {
                var ok = await _locationService.SetLocationActiveAsync(request.Name.Trim(), request.IsActive);
                return ok ? Ok() : NotFound();
            }
            catch { return StatusCode(500, "Greška pri promjeni statusa."); }
        }
    }
}
