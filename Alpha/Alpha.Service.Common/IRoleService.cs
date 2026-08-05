using System;
using System.Collections.Generic;
using System.Linq;
using System.Text;
using System.Threading.Tasks;

namespace Alpha.Service.Common
{
    public interface IRoleService
    {
        Task<Guid> GetRoleByIdAsync(string role);
        Task<List<string>> GetAllRolesAsync();
    }
}



