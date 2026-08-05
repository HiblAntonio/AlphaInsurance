using Alpha.Model;
using Alpha.Service.Common;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;

namespace Alpha.WebAPI.Controllers
{
    [ApiController]
    [Route("api/[controller]")]
    public class PartnerController : ControllerBase
    {
        protected IPartnerService _partnerService;

        public PartnerController(IPartnerService partnerService)
        {
            _partnerService = partnerService;
        }

        [Authorize]
        [HttpGet]
        public async Task<IActionResult> GetAll()
        {
            try { return Ok(await _partnerService.GetAllPartnersWithStatusAsync()); }
            catch { return StatusCode(500, "Greška pri dohvaćanju partnera."); }
        }

        [Authorize]
        [HttpGet("active")]
        public async Task<IActionResult> GetAllActive()
        {
            try { return Ok(await _partnerService.GetAllActivePartnersAsync()); }
            catch { return StatusCode(500, "Greška pri dohvaćanju aktivnih partnera."); }
        }

        [Authorize(Roles = "Admin,Super Admin")]
        [HttpPost]
        public async Task<IActionResult> Add([FromBody] LookupNameRequest request)
        {
            if (string.IsNullOrWhiteSpace(request?.Name)) return BadRequest("Naziv je obavezan.");
            try
            {
                var ok = await _partnerService.AddPartner(request.Name.Trim());
                return ok ? Ok() : StatusCode(500, "Greška pri dodavanju.");
            }
            catch { return StatusCode(500, "Greška pri dodavanju partnera."); }
        }

        [Authorize(Roles = "Admin,Super Admin")]
        [HttpPut]
        public async Task<IActionResult> Update([FromBody] LookupUpdateRequest request)
        {
            if (string.IsNullOrWhiteSpace(request?.OldName) || string.IsNullOrWhiteSpace(request?.NewName))
                return BadRequest("Stari i novi naziv su obavezni.");
            try
            {
                var ok = await _partnerService.UpdatePartners(request.OldName.Trim(), request.NewName.Trim());
                return ok ? Ok() : StatusCode(500, "Greška pri ažuriranju.");
            }
            catch { return StatusCode(500, "Greška pri ažuriranju partnera."); }
        }

        [Authorize(Roles = "Admin,Super Admin")]
        [HttpPatch("active")]
        public async Task<IActionResult> SetActive([FromBody] LookupActiveRequest request)
        {
            if (string.IsNullOrWhiteSpace(request?.Name)) return BadRequest("Naziv je obavezan.");
            try
            {
                var ok = await _partnerService.SetPartnerActiveAsync(request.Name.Trim(), request.IsActive);
                return ok ? Ok() : NotFound();
            }
            catch { return StatusCode(500, "Greška pri promjeni statusa."); }
        }
    }
}
