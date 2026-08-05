using Alpha.Model;
using Alpha.Service.Common;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;

namespace Alpha.WebAPI.Controllers
{
    [ApiController]
    [Route("api/[controller]")]
    public class InsuranceTypeController : ControllerBase
    {
        protected IPolicyTypeService _insuranceTypeService;

        public InsuranceTypeController(IPolicyTypeService insuranceTypeService)
        {
            _insuranceTypeService = insuranceTypeService;
        }

        [Authorize]
        [HttpGet]
        public async Task<IActionResult> GetAll()
        {
            try { return Ok(await _insuranceTypeService.GetAllPolicyTypesWithStatusAsync()); }
            catch { return StatusCode(500, "Greška pri dohvaćanju vrsta osiguranja."); }
        }

        [Authorize]
        [HttpGet("active")]
        public async Task<IActionResult> GetAllActive()
        {
            try { return Ok(await _insuranceTypeService.GetAllActivePolicyTypesAsync()); }
            catch { return StatusCode(500, "Greška pri dohvaćanju aktivnih vrsta osiguranja."); }
        }

        [Authorize(Roles = "Admin,Super Admin")]
        [HttpPost]
        public async Task<IActionResult> Add([FromBody] LookupNameRequest request)
        {
            if (string.IsNullOrWhiteSpace(request?.Name)) return BadRequest("Naziv je obavezan.");
            try
            {
                var ok = await _insuranceTypeService.AddPolicyType(request.Name.Trim());
                return ok ? Ok() : StatusCode(500, "Greška pri dodavanju.");
            }
            catch { return StatusCode(500, "Greška pri dodavanju vrste osiguranja."); }
        }

        [Authorize(Roles = "Admin,Super Admin")]
        [HttpPut]
        public async Task<IActionResult> Update([FromBody] LookupUpdateRequest request)
        {
            if (string.IsNullOrWhiteSpace(request?.OldName) || string.IsNullOrWhiteSpace(request?.NewName))
                return BadRequest("Stari i novi naziv su obavezni.");
            try
            {
                var ok = await _insuranceTypeService.UpdatePolicyType(request.OldName.Trim(), request.NewName.Trim());
                return ok ? Ok() : StatusCode(500, "Greška pri ažuriranju.");
            }
            catch { return StatusCode(500, "Greška pri ažuriranju vrste osiguranja."); }
        }

        [Authorize(Roles = "Admin,Super Admin")]
        [HttpPatch("active")]
        public async Task<IActionResult> SetActive([FromBody] LookupActiveRequest request)
        {
            if (string.IsNullOrWhiteSpace(request?.Name)) return BadRequest("Naziv je obavezan.");
            try
            {
                var ok = await _insuranceTypeService.SetPolicyTypeActiveAsync(request.Name.Trim(), request.IsActive);
                return ok ? Ok() : NotFound();
            }
            catch { return StatusCode(500, "Greška pri promjeni statusa."); }
        }
    }
}
