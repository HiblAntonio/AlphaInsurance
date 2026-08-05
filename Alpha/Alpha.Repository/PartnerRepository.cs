using Alpha.Repository.Common;
using Alpha.Model;
using System;
using System.Collections.Generic;
using System.Configuration;
using Microsoft.Data.SqlClient;
using System.Linq;
using System.Text;
using System.Threading.Tasks;

namespace Alpha.Repository
{
    public class PartnerRepository : IPartnerRepository
    {
        private readonly string _connectionString;

        public PartnerRepository(string connectionString)
        {
            _connectionString = connectionString;
        }

        public async Task<List<string>> GetAllPartnersAsync()
        {
            List<string> partners = new List<string>();

            using (var conn = new SqlConnection(_connectionString))
            {
                await conn.OpenAsync();

                string queryString = "SELECT \"Name\" FROM \"Partners\"";
                SqlCommand sqlCommand = new SqlCommand(queryString, conn);

                SqlDataReader reader = await sqlCommand.ExecuteReaderAsync();

                while (await reader.ReadAsync())
                {
                    partners.Add(reader["Name"].ToString());
                }
            }

            return partners;
        }

        public async Task<List<LookupItem>> GetAllPartnersWithStatusAsync()
        {
            var result = new List<LookupItem>();
            using (var conn = new SqlConnection(_connectionString))
            {
                await conn.OpenAsync();
                var cmd = new SqlCommand("SELECT Name, IsActive FROM Partners ORDER BY Name", conn);
                var reader = await cmd.ExecuteReaderAsync();
                while (await reader.ReadAsync())
                    result.Add(new LookupItem { Name = reader["Name"].ToString(), IsActive = Convert.ToBoolean(reader["IsActive"]) });
            }
            return result;
        }

        public async Task<List<string>> GetAllActivePartnersAsync()
        {
            var result = new List<string>();
            using (var conn = new SqlConnection(_connectionString))
            {
                await conn.OpenAsync();
                var cmd = new SqlCommand("SELECT Name FROM Partners WHERE IsActive = 1 ORDER BY Name", conn);
                var reader = await cmd.ExecuteReaderAsync();
                while (await reader.ReadAsync())
                    result.Add(reader["Name"].ToString());
            }
            return result;
        }

        public async Task<bool> SetPartnerActiveAsync(string name, bool isActive)
        {
            using (var conn = new SqlConnection(_connectionString))
            {
                await conn.OpenAsync();
                var cmd = new SqlCommand("UPDATE Partners SET IsActive = @IsActive WHERE Name = @Name", conn);
                cmd.Parameters.AddWithValue("@IsActive", isActive);
                cmd.Parameters.AddWithValue("@Name", name);
                return await cmd.ExecuteNonQueryAsync() > 0;
            }
        }

        // ------------------- PARTNER METHODS FROM WEBFORMS ------------------

        public async Task<bool> AddPartner(string partner)
        {
            using (var conn = new SqlConnection(_connectionString))
            {
                await conn.OpenAsync();

                string queryString = "INSERT INTO \"Partners\" VALUES (@Id, @Name)";

                SqlCommand cmd = new SqlCommand(queryString, conn);

                cmd.Parameters.AddWithValue("@Id", Guid.NewGuid());
                cmd.Parameters.AddWithValue("@Name", partner);


                SqlTransaction tran = conn.BeginTransaction();
                cmd.Transaction = tran;

                int partnerAdded = await cmd.ExecuteNonQueryAsync();

                if (partnerAdded != 0)
                {
                    tran.Commit();
                    return true;
                }
            }

            return false;
        }

        public async Task<List<LocationStatistics>> GetAllInsuranceCompaniesInfoFilteredAsync(StatisticsFiltering statisticsFiltering)
        {
            var results = new List<LocationStatistics>();

            using (SqlConnection conn = new SqlConnection(_connectionString))
            {
                await conn.OpenAsync();

                // Construct query with placeholders
                var query = new StringBuilder(@"
                    SELECT 
                        Partners.Name as PartnerName,
                        COUNT(*) AS PolicyCount,
                        SUM(InsurancePolicies.Price) AS PolicySum
                    FROM InsurancePolicies
                    INNER JOIN Clients ON InsurancePolicies.ClientId = Clients.Id
                    INNER JOIN Users ON Clients.UserId = Users.Id
                    INNER JOIN Locations ON Locations.Id = InsurancePolicies.LocationId
                    LEFT JOIN Partners ON Partners.Id = InsurancePolicies.PartnerId
                    INNER JOIN Status ON Status.Id = InsurancePolicies.StatusId
                    INNER JOIN PolicyTypes ON PolicyTypes.Id = InsurancePolicies.PolicyTypeId
                    INNER JOIN InsuranceCompanies ON InsurancePolicies.InsuranceCompanyId = InsuranceCompanies.Id
                      WHERE YEAR(InsurancePolicies.StartingDate) = @SelectedYear ");

                // Dynamically add filters based on the adminFiltering values
                if (statisticsFiltering.DateFrom != DateTime.Today.AddDays(1) || statisticsFiltering.DateTo != DateTime.Today.AddDays(1))
                {
                    query.Append(" AND DateCreated >= @From AND DateCreated <= @To");
                }

                if (!string.IsNullOrWhiteSpace(statisticsFiltering.InsuranceCompany) &&
                    statisticsFiltering.InsuranceCompany != "Osiguravajuća kuća")
                {
                    query.Append(" AND InsuranceCompanies.Name LIKE @InsuranceCompany");
                }

                if (!string.IsNullOrWhiteSpace(statisticsFiltering.InsuranceType) &&
                    statisticsFiltering.InsuranceType != "Vrsta osiguranja")
                {
                    query.Append(" AND PolicyTypes.Type LIKE @InsuranceType");
                }

                if (!string.IsNullOrWhiteSpace(statisticsFiltering.Partner) &&
                    statisticsFiltering.Partner != "Partneri")
                {
                    query.Append(" AND Partners.Name = @Partner");
                }

                query.Append(" GROUP BY Partners.Name");
                query.Append(" ORDER BY PolicySum DESC");

                // Prepare the command
                using (SqlCommand cmd = new SqlCommand(query.ToString(), conn))
                {
                    // Add parameters with explicit types to prevent SQL injection
                    cmd.Parameters.AddWithValue("@SelectedYear", statisticsFiltering.Year);
                    if (statisticsFiltering.DateFrom != DateTime.Today.AddDays(1) || statisticsFiltering.DateTo != DateTime.Today.AddDays(1))
                    {
                        cmd.Parameters.AddWithValue("@From", statisticsFiltering.DateFrom);
                        cmd.Parameters.AddWithValue("@To", statisticsFiltering.DateTo);
                    }
                    if (!string.IsNullOrWhiteSpace(statisticsFiltering.InsuranceCompany) &&
                        statisticsFiltering.InsuranceCompany != "Osiguravajuća kuća")
                    {
                        cmd.Parameters.AddWithValue("@InsuranceCompany", $"%{statisticsFiltering.InsuranceCompany}%");
                    }
                    if (!string.IsNullOrWhiteSpace(statisticsFiltering.InsuranceType) &&
                        statisticsFiltering.InsuranceType != "Vrsta osiguranja")
                    {
                        cmd.Parameters.AddWithValue("@InsuranceType", $"%{statisticsFiltering.InsuranceType}%");
                    }
                    if (!string.IsNullOrWhiteSpace(statisticsFiltering.Partner) &&
                        statisticsFiltering.Partner != "Partneri")
                    {
                        cmd.Parameters.AddWithValue("@Partner", statisticsFiltering.Partner);
                    }

                    // Execute and read results
                    using (SqlDataReader reader = await cmd.ExecuteReaderAsync())
                    {
                        while (await reader.ReadAsync())
                        {
                            results.Add(new LocationStatistics
                            {
                                LocationName = reader["PartnerName"].ToString(),
                                PolicyCount = (int)reader["PolicyCount"],
                                PolicySum = (decimal)reader["PolicySum"]
                            });
                        }
                    }
                }
            }

            return results;
        }

        public async Task<Guid> GetPartnerIdByName(string partner)
        {
            Guid returnValue = Guid.Empty;

            using (var conn = new SqlConnection(_connectionString))
            {
                await conn.OpenAsync();

                string queryString = "SELECT \"Id\" FROM \"Partners\" WHERE Name = @Partner";
                SqlCommand sqlCommand = new SqlCommand(queryString, conn);
                sqlCommand.Parameters.AddWithValue("@Partner", partner);

                SqlDataReader reader = await sqlCommand.ExecuteReaderAsync();

                while (await reader.ReadAsync())
                {
                    returnValue = (Guid)reader["Id"];
                }
            }

            return returnValue;
        }

        public async Task<bool> UpdatePartner(string partner, string newPartner)
        {
            using (var conn = new SqlConnection(_connectionString))
            {
                await conn.OpenAsync();

                string queryString = "UPDATE Partners SET Name = @newName WHERE Name = @oldName";
                SqlCommand sqlCommand = new SqlCommand(queryString, conn);
                sqlCommand.Parameters.AddWithValue("@newName", newPartner);
                sqlCommand.Parameters.AddWithValue("@oldName", partner);

                int rows = await sqlCommand.ExecuteNonQueryAsync();
                return rows > 0;
            }
        }
    }
}



