using System;
using System.Collections.Generic;
using System.Linq;
using System.Text;
using System.Threading.Tasks;

namespace Alpha.Model
{
    public class DailyStatisticsFiltering
    {
        public string? Search { get; set; }
        //public DateTime? DateFrom { get; set; }
        //public DateTime? DateTo { get; set; }
        public string? AgentName { get; set; }
        public string? Location { get; set; }
        //public string PolicyKind { get; set; }

        public DailyStatisticsFiltering() { }

        public DailyStatisticsFiltering(string search, string agentName, string location){
            Search = search;
            AgentName = agentName;
            Location = location;
        }
    }
}



