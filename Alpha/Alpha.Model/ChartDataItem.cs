using System;
using System.Collections.Generic;
using System.Linq;
using System.Text;
using System.Threading.Tasks;

namespace Alpha.Model
{
    public class ChartDataItem
    {
        public string Label { get; set; } = string.Empty;
        public int PolicyCount { get; set; }
        public int NewPoliciesCount { get; set; }
        public int RenewedPoliciesCount { get; set; }
    }
}