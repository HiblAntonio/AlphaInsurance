using Alpha.Common;
using Alpha.Model;
using Alpha.Service.Common;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using System.Security.Claims;

namespace Alpha.WebAPI.Controllers
{
    [ApiController]
    [Route("api/[controller]")]
    public class AuthController : ControllerBase
    {
        private readonly IAgentService _agentService;
        private readonly JwtService _jwtService;
        private readonly IConfiguration _configuration;

        public AuthController(IAgentService agentService, JwtService jwtService, IConfiguration configuration)
        {
            _agentService = agentService;
            _jwtService = jwtService;
            _configuration = configuration;
        }

        [Authorize]
        [HttpPost("change-password")]
        public async Task<IActionResult> ChangePassword([FromBody] ChangePasswordRequest request)
        {
            try
            {
                if (string.IsNullOrWhiteSpace(request.CurrentPassword) ||
                    string.IsNullOrWhiteSpace(request.NewPassword) ||
                    request.NewPassword != request.ConfirmPassword)
                    return BadRequest("Podaci nisu ispravni.");

                var agentId = User.FindFirstValue(ClaimTypes.NameIdentifier);
                if (agentId == null) return Unauthorized();

                var valid = await _agentService.CheckCurrentUsersPasswordAsync(agentId, request.CurrentPassword);
                if (!valid) return BadRequest("Trenutna lozinka nije ispravna.");

                await _agentService.UpdateUsersPasswordAsync(agentId, request.NewPassword);
                return Ok();
            }
            catch (Exception ex)
            {
                return StatusCode(500, "Greška pri promjeni lozinke." + ex.Message);
            }
        }

        [AllowAnonymous]
        [HttpPost("logout")]
        public async Task<IActionResult> Logout([FromBody] RefreshRequest request)
        {
            if (!string.IsNullOrWhiteSpace(request?.RefreshToken))
                await _agentService.RevokeRefreshTokenAsync(request.RefreshToken);
            return Ok();
        }

        [AllowAnonymous]
        [HttpPost("refresh")]
        public async Task<IActionResult> Refresh([FromBody] RefreshRequest request)
        {
            try
            {
                var stored = await _agentService.GetRefreshTokenAsync(request.RefreshToken);
                if (stored == null || stored.IsRevoked || stored.ExpiresAt < DateTime.UtcNow)
                    return Unauthorized("Token za osvježavanje nije valjan ili je istekao.");

                await _agentService.RevokeRefreshTokenAsync(request.RefreshToken);

                var agent = await _agentService.GetLoginInfoByAgentIdAsync(stored.AgentId);
                if (agent == null)
                    return Unauthorized("Agent nije pronađen.");

                var newToken = _jwtService.GenerateToken(agent.Id, agent.Username, agent.Role);
                var newRefreshToken = _jwtService.GenerateRefreshToken();
                var expiryDays = Convert.ToInt32(_configuration["Jwt:RefreshTokenExpirationDays"]);
                await _agentService.StoreRefreshTokenAsync(stored.AgentId, newRefreshToken, DateTime.UtcNow.AddDays(expiryDays));

                return Ok(new { token = newToken, refreshToken = newRefreshToken });
            }
            catch (Exception ex)
            {
                return StatusCode(500, "Greška pri osvježavanju tokena." + ex.Message);
            }
        }

        [AllowAnonymous]
        [HttpPost("login")]
        public async Task<IActionResult> Login([FromBody] LoginRequest request)
        {
            try
            {
                var agent = await _agentService.CheckLoginInfoAsync(request);
                if (agent == null)
                    return Unauthorized("Pogrešno korisničko ime ili lozinka.");

                var token = _jwtService.GenerateToken(agent.Id, agent.Username, agent.Role);

                var refreshToken = _jwtService.GenerateRefreshToken();
                var expiryDays = Convert.ToInt32(_configuration["Jwt:RefreshTokenExpirationDays"]);
                await _agentService.StoreRefreshTokenAsync(Guid.Parse(agent.Id), refreshToken, DateTime.UtcNow.AddDays(expiryDays));

                return Ok(new { token, refreshToken });
            }
            catch (Exception ex)
            {
                return StatusCode(500, "Greška pri prijavi." + ex.Message);
            }
        }
    }
}
