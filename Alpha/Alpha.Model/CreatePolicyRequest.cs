using System;
using System.Collections.Generic;
using System.Linq;
using System.Net.Mail;
using System.Security.Cryptography;
using System.Text;
using System.Threading.Tasks;

namespace Alpha.Model
{
    public class CreatePolicyRequest
    {
        public ClientRequest Client { get; set; }
        public PolicyRequest Policy { get; set; }
    }

    public class ClientRequest
    {
        public bool IsNew { get; set; }
        public Guid ClientId { get; set; } // ako nije novi
        public string? Oib { get; set; }
        public string? Name { get; set; }
        public string? EmailAddress { get; set; }
        public string? PhoneNumber { get; set; }
        public DateTime? Dob { get; set; }
        //public string LegalStatus { get; set; }
    }

    public class PolicyRequest
    {
        public string PolicyNumber { get; set; }
        public decimal Price { get; set; }
        public string? Remark { get; set; }
        public DateTime StartingDate { get; set; }
        public string InsuranceCompany { get; set; }
        public string InsuranceType { get; set; }
        public string Location { get; set; }
        public string Partner { get; set; }
        public string? PreviousPolicyNumber { get; set; } // samo za produženje police
    }
}