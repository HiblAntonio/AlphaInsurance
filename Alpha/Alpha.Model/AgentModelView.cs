using System;
using System.Collections.Generic;
using System.Linq;
using System.Text;
using System.Threading.Tasks;

namespace Alpha.Model
{
    public class AgentModelView
    {
        public Guid Id { get; set; }
        public string Name { get; set; }
        public string RoleName { get; set; }
        public string IDNumber { get; set; }
        public string MailAddress { get; set; }
        public string Location { get; set; }
        public bool IsActive { get; set; }
        public AgentModelView (Guid id, string name, string roleName, string idNumber, string mailAddress, string location, bool isActive = true)
        {
            Id = id;
            Name = name;
            RoleName = roleName;
            IDNumber = idNumber;
            MailAddress = mailAddress;
            Location = location;
            IsActive = isActive;
        }
        public AgentModelView () {}
    }
}



