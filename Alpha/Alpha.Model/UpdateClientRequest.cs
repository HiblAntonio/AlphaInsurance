using System;
using System.Collections.Generic;
using System.Linq;
using System.Net.Mail;
using System.Security.Cryptography;
using System.Text;
using System.Threading.Tasks;

namespace Alpha.Model
{
    public class UpdateClientRequest
    {
        public Guid ClientId { get; set; }
        public string Oib { get; set; }
        public string Name { get; set; }
        public string? EmailAddress { get; set; }
        public string PhoneNumber { get; set; }
        public DateTime? Dob { get; set; }
        //public string LegalStatus { get; set; }
    }
}