using System;
using System.Collections.Generic;
using System.Linq;
using System.Text;
using System.Threading.Tasks;

namespace Alpha.Model
{
    public class InsuranceFiltering
    {
        public string? Search {  get; set; }
        public decimal PriceFrom {  get; set; }
        public decimal PriceTo { get; set; } = decimal.MaxValue;
        public DateTime? DateFrom { get; set; }
        public DateTime? DateTo { get; set; }
        public List<string>? InsuranceCompany {  get; set; }
        public List<string>? InsuranceType { get; set; }
        public string? Status { get; set; }
        public List<string>? Location { get; set; }
        public List<string>? Partner { get; set; }
        public int? Year { get; set; } = DateTime.Today.Year;
        public bool IsAsc {  get; set; }

        public InsuranceFiltering(int year, bool isAsc, string search = null, decimal priceFrom = 0.0m, decimal priceTo = 0.0m, DateTime? dateFrom = null, DateTime? dateTo = null, string status = null, List<string>? insuranceCompany = null, List<string>? insuranceType = null, List<string>? location = null, List<string>? partner = null)
        {
            Search = search;
            PriceFrom = priceFrom;
            PriceTo = priceTo;
            DateFrom = dateFrom;
            DateTo = dateTo;
            IsAsc = isAsc;
            InsuranceCompany = insuranceCompany;
            InsuranceType = insuranceType;
            Status = status;
            Location = location;
            Partner = partner;
            Year = year;
        }

        public InsuranceFiltering() {}
    }
}



