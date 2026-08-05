using System.Collections.Generic;

namespace Alpha.Model
{
    public class PremiumComparisonData
    {
        public List<PremiumMonthlyPoint> DataPoints { get; set; } = new();
    }

    public class PremiumMonthlyPoint
    {
        public int MonthNumber { get; set; }
        public string MonthLabel { get; set; }
        public Dictionary<int, decimal> CumulativeValueByYear { get; set; } = new();
    }
}
