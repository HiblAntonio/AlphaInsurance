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
    public class PolicyTypeRepository : IPolicyTypeRepository
    {
        private readonly string _connectionString;

        public PolicyTypeRepository(string connectionString)
        {
            _connectionString = connectionString;
        }

        public async Task<List<string>> GetAllPolicyTypesAsync()
        {
            List<string> policyTypes = new List<string>();

            using (var conn = new SqlConnection(_connectionString))
            {
                await conn.OpenAsync();

                string queryString = "SELECT \"Type\" FROM \"PolicyTypes\"";
                SqlCommand sqlCommand = new SqlCommand(queryString, conn);

                SqlDataReader reader = await sqlCommand.ExecuteReaderAsync();

                while (await reader.ReadAsync())
                {
                    policyTypes.Add(reader["Type"].ToString());
                }
            }

            return policyTypes;
        }

        public async Task<List<LookupItem>> GetAllPolicyTypesWithStatusAsync()
        {
            var result = new List<LookupItem>();
            using (var conn = new SqlConnection(_connectionString))
            {
                await conn.OpenAsync();
                var cmd = new SqlCommand("SELECT Type AS Name, IsActive FROM PolicyTypes ORDER BY Type", conn);
                var reader = await cmd.ExecuteReaderAsync();
                while (await reader.ReadAsync())
                    result.Add(new LookupItem { Name = reader["Name"].ToString(), IsActive = Convert.ToBoolean(reader["IsActive"]) });
            }
            return result;
        }

        public async Task<List<string>> GetAllActivePolicyTypesAsync()
        {
            var result = new List<string>();
            using (var conn = new SqlConnection(_connectionString))
            {
                await conn.OpenAsync();
                var cmd = new SqlCommand("SELECT Type FROM PolicyTypes WHERE IsActive = 1 ORDER BY Type", conn);
                var reader = await cmd.ExecuteReaderAsync();
                while (await reader.ReadAsync())
                    result.Add(reader["Type"].ToString());
            }
            return result;
        }

        public async Task<bool> SetPolicyTypeActiveAsync(string name, bool isActive)
        {
            using (var conn = new SqlConnection(_connectionString))
            {
                await conn.OpenAsync();
                var cmd = new SqlCommand("UPDATE PolicyTypes SET IsActive = @IsActive WHERE Type = @Name", conn);
                cmd.Parameters.AddWithValue("@IsActive", isActive);
                cmd.Parameters.AddWithValue("@Name", name);
                return await cmd.ExecuteNonQueryAsync() > 0;
            }
        }

        // ------------------- POLICY TYPE METHODS FROM WEBFORMS ------------------

        public async Task<bool> AddPolicyType(string policyType)
        {
            using (var conn = new SqlConnection(_connectionString))
            {
                await conn.OpenAsync();

                string queryString = "INSERT INTO \"PolicyTypes\" VALUES (@Id, @Type)";

                SqlCommand cmd = new SqlCommand(queryString, conn);

                cmd.Parameters.AddWithValue("@Id", Guid.NewGuid());
                cmd.Parameters.AddWithValue("@Type", policyType);

                SqlTransaction tran = conn.BeginTransaction();
                cmd.Transaction = tran;

                int policyTypeAdded = await cmd.ExecuteNonQueryAsync();

                if (policyTypeAdded != 0)
                {
                    tran.Commit();
                    return true;
                }
            }

            return false;
        }

        public async Task<Guid> GetPolicyTypeIdByName(string policyType)
        {
            Guid returnValue = Guid.Empty;

            using (var conn = new SqlConnection(_connectionString))
            {
                await conn.OpenAsync();

                string queryString = "SELECT \"Id\" FROM \"PolicyTypes\" WHERE Type = @PolicyType";
                SqlCommand sqlCommand = new SqlCommand(queryString, conn);
                sqlCommand.Parameters.AddWithValue("@PolicyType", policyType);

                SqlDataReader reader = await sqlCommand.ExecuteReaderAsync();

                while (await reader.ReadAsync())
                {
                    returnValue = (Guid)reader["Id"];
                }
            }

            return returnValue;
        }

        public async Task<bool> UpdatePolicyType(string policyType, string newPolicyType)
        {
            using (var conn = new SqlConnection(_connectionString))
            {
                await conn.OpenAsync();

                string queryString = "UPDATE PolicyTypes SET Type = @newType WHERE Type = @oldType";
                SqlCommand sqlCommand = new SqlCommand(queryString, conn);
                sqlCommand.Parameters.AddWithValue("@newType", newPolicyType);
                sqlCommand.Parameters.AddWithValue("@oldType", policyType);

                int rows = await sqlCommand.ExecuteNonQueryAsync();
                return rows > 0;
            }
        }
    }
}



