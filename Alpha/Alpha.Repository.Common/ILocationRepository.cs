using Alpha.Model;
using System;
using System.Collections.Generic;
using System.Linq;
using System.Text;
using System.Threading.Tasks;

namespace Alpha.Repository.Common
{
    public interface ILocationRepository
    {
        Task<List<string>> GetAllLocationsAsync();
        Task<List<LookupItem>> GetAllLocationsWithStatusAsync();
        Task<List<string>> GetAllActiveLocationsAsync();
        Task<bool> SetLocationActiveAsync(string name, bool isActive);

        // ----------------  LOCATION METHODS FROM WEBFORMS ------------------

        Task<List<LocationStatistics>> GetAllLocationsInfoFilteredAsync(StatisticsFiltering statisticsFiltering);
        Task<Guid> GetLocationIdByNameAsync(string location);
        Task<bool> AddLocation(string location);
        Task<bool> UpdateLocation(string location, string newLocation);
    }
}



