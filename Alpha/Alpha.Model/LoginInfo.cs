using System;
using System.Collections.Generic;
using System.Linq;
using System.Text;
using System.Threading.Tasks;

namespace Alpha.Model
{
    public class LoginInfo
    {
        public string Id { get; set; }
        public string Username { get; set; }
        public string Role { get; set; }
        public LoginInfo(string id, string username, string role) {
            Id = id;
            Username = username;
            Role = role;
        }
        public LoginInfo() { }
    }
}



