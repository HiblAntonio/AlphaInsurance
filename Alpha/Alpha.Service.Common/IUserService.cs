using System;
using System.Collections.Generic;
using System.Linq;
using System.Text;
using System.Threading.Tasks;

namespace Alpha.Service.Common
{
    public interface IUserService
    {
        Task<Guid> AddUserAsync(string name);
        Task<Dictionary<string, string>> GetAllUsers(string name);
        Task<bool> UpdateClientAsync(string name, string policyNumber);
    }
}



