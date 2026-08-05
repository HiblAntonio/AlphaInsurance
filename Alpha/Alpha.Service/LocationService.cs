using Alpha.Repository.Common;
using Alpha.Model;
using Alpha.Service.Common;
using System;
using System.Collections.Generic;
using System.Linq;
using System.Text;
using System.Threading.Tasks;

namespace Alpha.Service
{
    public class LocationService : ILocationService
    {
        private readonly ILocationRepository locationRepository;

        public LocationService(ILocationRepository _locationRepository) {
            this.locationRepository = _locationRepository;
        }

        public async Task<List<string>> GetAllLocationsAsync() =>
            await locationRepository.GetAllLocationsAsync();

        public async Task<List<LookupItem>> GetAllLocationsWithStatusAsync() =>
            await locationRepository.GetAllLocationsWithStatusAsync();

        public async Task<List<string>> GetAllActiveLocationsAsync() =>
            await locationRepository.GetAllActiveLocationsAsync();

        public async Task<bool> SetLocationActiveAsync(string name, bool isActive) =>
            await locationRepository.SetLocationActiveAsync(name, isActive);

        // -------------------  LOCATION METHODS FROM WEBFORMS ------------------

        public async Task<bool> AddLocation(string location)
        {
            return await locationRepository.AddLocation(location);
        }

        public async Task<List<LocationStatistics>> GetAllLocationsInfoFilteredAsync(StatisticsFiltering statisticsFiltering)
        {
            return await locationRepository.GetAllLocationsInfoFilteredAsync(statisticsFiltering);
        }

        public async Task<bool> UpdateLocations(string location, string newLocation)
        {
            return await locationRepository.UpdateLocation(location, newLocation);
        }
    }
}



