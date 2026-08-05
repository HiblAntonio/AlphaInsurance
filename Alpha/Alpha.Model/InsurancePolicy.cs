using System;
using System.Collections.Generic;
using System.Linq;
using System.Text;
using System.Threading.Tasks;

namespace Alpha.Model
{
    public class InsurancePolicy
    {

        public Guid ID { get; set; }
        public string PolicyNumber { get; set; }
        public DateTime StartingDate { get; set; }
        public Guid StatusId { get; set; }
        public decimal Price { get; set; }
        public DateTime DateCreated { get; set; } 
        public string Remark { get; set; }
        public Guid ClientId { get; set; }
        public Guid LocationId { get; set; }
        public Guid InsuranceCompanyId { get; set; }
        public Guid PolicyTypeId { get; set; }
        public Guid PartnerId { get; set; }
        public string PreviousPolicyNumber { get; set; }
        public bool IsRenewed { get; set; }
    }
}



