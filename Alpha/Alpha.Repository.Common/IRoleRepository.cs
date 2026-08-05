using Alpha.Model;
using System;
using System.Collections.Generic;
using System.Linq;
using System.Text;
using System.Threading.Tasks;

namespace Alpha.Repository.Common
{
    public interface IRoleRepository
    {
        Task<Guid> GetRoleIdAsync(string role);
        Task<List<string>> GetAllRolesAsync();
    }
}



