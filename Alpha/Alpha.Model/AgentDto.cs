using System;
using System.Collections.Generic;
using System.Linq;
using System.Text;
using System.Threading.Tasks;

namespace Alpha.Model
{
    public class AgentDto
    {
        public Guid Id { get; set; }
        public string Name { get; set; }
        public bool IsAdmin { get; set; }
        public string MailAddress { get; set; }
        public AgentDto() { }
        public AgentDto(Guid id, string name, bool isAdmin, string mailAddress)
        {
            Id = id;
            Name = name;
            IsAdmin = isAdmin;
            MailAddress = mailAddress;
        }
    }
}


