using Alpha.Repository;
using Alpha.Service.Common;
using System;
using System.Collections.Generic;
using System.Linq;
using System.Text;
using System.Threading.Tasks;

namespace Alpha.Services
{
    public class UserService : IUserService
    {
        private readonly UserRepository _userRepository;

        public UserService(UserRepository userRepository)
        {
            _userRepository = userRepository;
        }

        public async Task<Guid> AddUserAsync(string name)
        {
            return await _userRepository.AddUserAsync(name);
        }

        public async Task<Dictionary<string, string>> GetAllUsers(string name)
        {
            return await _userRepository.GetAllUsers(name);
        }

        public async Task<bool> UpdateClientAsync(string name, string policyNumber)
        {
            return await _userRepository.UpdateUserAsync(name, policyNumber);
        }
    }
}



