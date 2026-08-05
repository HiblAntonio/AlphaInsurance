using System;
using System.Collections.Generic;
using System.Linq;
using System.Net.Mail;
using System.Security.Cryptography;
using System.Text;
using System.Threading.Tasks;

namespace Alpha.Model
{
    public class Client
    {
        public string OIB { get; set; }
        public string MailAddress { get; set; }
        public string PhoneNumber { get; set; }
        public DateTime DateOfBirth { get; set; }
        //public List<InsurancePolicy> InsurancePolicies { get; set; } = new List<InsurancePolicy>();

    }
}



