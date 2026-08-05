using System;
using System.Collections.Generic;
using System.Linq;
using System.Text;
using System.Threading.Tasks;

namespace Alpha.Model
{
    public class TodayEnteredPolicies
    {
        public string PolicyNumber { get; set; }
        public string ClientName { get; set; }
        public string InsuranceCompany {  get; set; }
        public DateTime StartingDate { get; set; }
        public decimal Price { get; set; }
        public string Location { get; set; }
        public bool IsRenewed { get; set; }
        public string PreviousPolicy { get; set; }
        public string Partner { get; set; }
        public string? AgentName { get; set; }
        public string? PolicyType { get; set; }
        public DateTime DateCreated { get; set; }
        public TodayEnteredPolicies(string policyNumber, string clientName, string insuranceCompany, DateTime startingDate, decimal price, string location, bool isRenewed, string previousPolicy, string partner) {
            PolicyNumber = policyNumber;
            ClientName = clientName;
            InsuranceCompany = insuranceCompany;
            StartingDate = startingDate;
            Price = price;
            Location = location;
            IsRenewed = isRenewed;
            PreviousPolicy = previousPolicy;
            Partner = partner;
        }
    }
}



