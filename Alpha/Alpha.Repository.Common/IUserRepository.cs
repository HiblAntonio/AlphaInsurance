using System;
using System.Collections.Generic;
using System.Linq;
using System.Text;
using System.Threading.Tasks;

namespace Alpha.Repository.Common
{
    public interface IUserRepository
    {
        Task<Guid> AddUserAsync(string name);
        Task<Dictionary<string, string>> GetAllUsers(string name);
        Task<bool> UpdateUserAsync(string name, string policyNumber);
    }
}



