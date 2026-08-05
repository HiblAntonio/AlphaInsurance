using System;
using System.Collections.Generic;
using System.Linq;
using System.Text;
using System.Threading.Tasks;

namespace Alpha.Model
{
    public class Agent
    {
        public Guid Id { get; set; }
        public Guid RoleId { get; set; }
        public Guid UserId { get; set; }
        public string IdentificationNumber { get; set; }
        public string MailAddress { get; set; }
        public string Password { get; set; }
        public Guid LocationId { get; set; }

        public Agent()
        {

        }
    }
}


