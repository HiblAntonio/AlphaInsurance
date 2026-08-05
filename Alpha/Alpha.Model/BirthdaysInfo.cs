using System;
using System.Collections.Generic;
using System.Linq;
using System.Text;
using System.Threading.Tasks;

namespace Alpha.Model
{
    public class BirthdaysInfo
    {
        public string Name { get; set; }
        public string MailAddress { get; set; }
        public string PhoneNumber { get; set; }
        public DateTime DateOfBirth { get; set; }

        public BirthdaysInfo(string name, string mailAddress, string phoneNumber, DateTime dateOfBirth) {
            Name = name;
            MailAddress = mailAddress;
            PhoneNumber = phoneNumber;
            DateOfBirth = dateOfBirth;
        }
    }
}



