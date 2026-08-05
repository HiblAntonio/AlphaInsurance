using Alpha.Model;
using System;
using System.Collections.Generic;
using System.Linq;
using System.Text;
using System.Threading.Tasks;

namespace Alpha.Service.Common
{
    public interface ILocationService
    {
        Task<List<string>> GetAllLocationsAsync();
        Task<List<LookupItem>> GetAllLocationsWithStatusAsync();
        Task<List<string>> GetAllActiveLocationsAsync();
        Task<bool> SetLocationActiveAsync(string name, bool isActive);

        // ------------------- LOCATION METHODS FROM WEBFORMS ------------------
        Task<List<LocationStatistics>> GetAllLocationsInfoFilteredAsync(StatisticsFiltering statisticsFiltering);
        Task<bool> AddLocation(string location);
        Task<bool> UpdateLocations(string location, string newLocation);
    }
}



