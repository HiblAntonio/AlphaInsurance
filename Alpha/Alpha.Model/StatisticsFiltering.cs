using System;
using System.Collections.Generic;
using System.Linq;
using System.Text;
using System.Threading.Tasks;

namespace Alpha.Model
{
    public class StatisticsFiltering
    {
        public string? Location { get; set; }
        public DateTime? DateFrom { get; set; }
        public DateTime? DateTo { get; set; }
        public string? InsuranceCompany { get; set; }
        public string? InsuranceType { get; set; }
        public string? Partner { get; set; }
        public string? Year { get; set; }

        public StatisticsFiltering()
        {
        }

        public StatisticsFiltering(string? location = null, DateTime? dateFrom = null, DateTime? dateTo = null, string? insuranceCompany = null, string? insuranceType = null, string? partner = null, string? year = null)
        {
            Location = location;
            DateFrom = dateFrom;
            DateTo = dateTo;
            InsuranceCompany = insuranceCompany;
            InsuranceType = insuranceType;
            Partner = partner;
            Year = year;
        }
    }
}



