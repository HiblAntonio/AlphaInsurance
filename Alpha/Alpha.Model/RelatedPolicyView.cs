using System;
using System.Collections.Generic;
using System.Linq;
using System.Text;
using System.Threading.Tasks;

namespace Alpha.Model
{
    public class RelatedPolicyView
{
    public string PolicyNumber { get; set; }
    public string ClientName { get; set; }
    public string CompanyName { get; set; }
    public string PolicyType { get; set; }
    public decimal Price { get; set; }
    public string LocationName { get; set; }
    public string PreviousPolicyNumber { get; set; }
    public DateTime StartingDate { get; set; }
    public DateTime DateCreated { get; set; }

    public RelatedPolicyView(string policyNumber, string clientName, string companyName, string policyType, 
        decimal price, string locationName, DateTime startingDate, DateTime dateCreated, string previousPolicyNumber)
    {
        PolicyNumber = policyNumber;
        ClientName = clientName;
        CompanyName = companyName;
        PolicyType = policyType;
        Price = price;
        LocationName = locationName;
        StartingDate = startingDate;
        DateCreated = dateCreated;
        PreviousPolicyNumber = previousPolicyNumber;
    }
}
}



