using System.Collections.Generic;

namespace Alpha.Model
{
    public class InsuranceCompanyYearlyStats
    {
        public string CompanyName { get; set; }
        public int PolicyCount { get; set; }
        public decimal PolicySum { get; set; }
        public double Percentage { get; set; }
        public List<YearlyBreakdownItem> YearlyBreakdown { get; set; } = new();
    }

    public class YearlyBreakdownItem
    {
        public int Year { get; set; }
        public int PolicyCount { get; set; }
        public decimal PolicySum { get; set; }
        public double GrowthPercentage { get; set; }
    }
}
