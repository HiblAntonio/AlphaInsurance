using System;
using System.Collections.Generic;
using System.Linq;
using System.Text;
using System.Threading.Tasks;

namespace Alpha.Model
{
    /// <summary>
    /// Used for displaying insurance policy details in the frontend when a user clicks on a specific insurance policy.
    /// </summary>
    public class InsurancePolicyView
    {
        public string PolicyNumber { get; set; }
        public string Oib { get; set; }
        public DateTime StartingDate { get; set; }
        public DateTime DateCreated { get; set; }
        //public string Status { get; set; }
        public decimal Price { get; set; }
        public string Remark { get; set; }
        public Guid ClientId { get; set; }
        public string UserName { get; set; }
        public DateTime? DateOfBirth { get; set; }
        public string PhoneNumber { get; set; }
        public string MailAddress { get; set; }
        public string Location { get; set; }
        public string InsuranceCompany { get; set; }
        public string PolicyType { get; set; }
        public string Partner { get; set; }
        public bool ISRenewed { get; set; }
        public string PreviousPolicyNumber { get; set; }
        public string? CreatedByName { get; set; }
        public List<RelatedPolicyView> RelatedPolicies { get; set; } = new List<RelatedPolicyView>();

        public InsurancePolicyView(string policyNumber, string oib, DateTime startingDate, DateTime dateCreated, decimal price, string remark, Guid clientId, string userName, DateTime? dateOfBirth, string phoneNumber, string mailAddress, string location, string insuranceCompany, string policyType, string partner, bool isRenewed, string previousPolicyNumber)
        {
            PolicyNumber = policyNumber;
            Oib = oib;
            StartingDate = startingDate;
            DateCreated = dateCreated;
            Price = price;
            Remark = remark;
            ClientId = clientId;
            UserName = userName;
            DateOfBirth = dateOfBirth;
            PhoneNumber = phoneNumber;
            MailAddress = mailAddress;
            Location = location;
            InsuranceCompany = insuranceCompany;
            PolicyType = policyType;
            Partner = partner;
            ISRenewed = isRenewed;
            PreviousPolicyNumber = previousPolicyNumber;
        }
    }
}



