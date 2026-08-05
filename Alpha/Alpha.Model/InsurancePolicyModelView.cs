using System;
using System.Collections.Generic;
using System.Linq;
using System.Security.Cryptography.X509Certificates;
using System.Text;
using System.Threading.Tasks;

namespace Alpha.Model
{
    public class InsurancePolicyModelView
    {
        public Guid Id { get; set; }
        public string PolicyNumber { get; set; }
        public DateTime StartingDate { get; set; }
        public string ClientName { get; set; }
        public string InsuranceCompany { get; set; }
        public string InsuranceType { get; set; }
        public decimal Price { get; set; }
        public string Location { get; set; }
        public string Partner { get; set; }
        public string Status { get; set; }
        public bool IsRenewed { get; set; }
        public string PhoneNumber { get; set; }

        // Used for fetching insurance policies when showing a list of insurance policies in the frontend.
        public InsurancePolicyModelView(Guid id, string policyNumber, DateTime startingDate, string clientName, string insuranceCompany, string insuranceType, decimal price, string location, string partner, bool isRenewed, string status, string phoneNumber = null)
        {
            Id = id;
            PolicyNumber = policyNumber;
            StartingDate = startingDate;
            ClientName = clientName;
            InsuranceCompany = insuranceCompany;
            InsuranceType = insuranceType;
            Price = price;
            Location = location;
            Partner = partner;
            IsRenewed = isRenewed;
            Status = status;
            PhoneNumber = phoneNumber;
        }

        public InsurancePolicyModelView()
        {
        }
    }
}



