using Alpha.Repository.Common;
using Alpha.Service.Common;
using System;
using System.Collections.Generic;
using System.Linq;
using System.Text;
using System.Threading.Tasks;

namespace Alpha.Service
{
    public class RoleService : IRoleService
    {
        private readonly IRoleRepository roleRepository;

        public RoleService(IRoleRepository _roleRepository)
        {
            roleRepository = _roleRepository;
        }

        public async Task<List<string>> GetAllRolesAsync()
        {
            return await roleRepository.GetAllRolesAsync();
        }

        public async Task<Guid> GetRoleByIdAsync(string role)
        {
            return await roleRepository.GetRoleIdAsync(role);
        }
    }
}



