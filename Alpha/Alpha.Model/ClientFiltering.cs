using System;
using System.Collections.Generic;
using System.Linq;
using System.Text;
using System.Threading.Tasks;

namespace Alpha.Model
{
    public class ClientFiltering
    {
        public string? Search {  get; set; }
        public string? LegalStatus { get; set; }
        public bool SortNewestFirst { get; set; }
        public bool IsActive { get; set; } = true;
        public bool IsNotActive { get; set; } = true;
        public bool HasBirthday { get; set; }
        /*
        public ClientFiltering(string search = null, string legalStatus = null, bool isAsc = true, bool isActive = true)
        {
            Search = search;
            LegalStatus = legalStatus;
            IsAsc = isAsc;
            IsActive = isActive;
        }
        */

        public ClientFiltering(){}
    }
}



