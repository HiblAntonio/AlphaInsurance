using System.Collections.Generic;

namespace Alpha.Model
{
    public class SalesChartResponse
    {
        public int TotalCount { get; set; }
        public decimal TotalSum { get; set; }
        public List<SalesChartDataPoint> DataPoints { get; set; } = new();
    }

    public class SalesChartDataPoint
    {
        public string Label { get; set; } = string.Empty;
        public int PolicyCount { get; set; }
        public decimal PriceSum { get; set; }
    }
}
