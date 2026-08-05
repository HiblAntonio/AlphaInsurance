using System;
using System.Collections.Generic;
using System.Linq;
using System.Net.Mail;
using System.Security.Cryptography;
using System.Text;
using System.Threading.Tasks;

namespace Alpha.Model
{
    public class ClientView
    {
        public Guid Id { get; set; }
        public string OIB {get; set; }
        public string Name {get; set; } 
        //public string LegalStatus { get; set; }

        public ClientView(Guid id, string oib, string name/*, string legalStatus*/) {
            Id = id;
            OIB = oib;
            Name = name;
            //LegalStatus = legalStatus;
        }
    }
}



