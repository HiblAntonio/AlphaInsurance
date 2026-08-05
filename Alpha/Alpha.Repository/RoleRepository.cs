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
    public class RoleRepository : IRoleRepository
    {
        private readonly string _connectionString;

        public RoleRepository(string connectionString)
        {
            _connectionString = connectionString;
        }
        public async Task<List<string>> GetAllRolesAsync()
        {
            List<string> roles = new List<string>();

            using (var conn = new SqlConnection(_connectionString))
            {
                await conn.OpenAsync();

                string queryString = "SELECT \"Name\" FROM \"Roles\"";
                SqlCommand sqlCommand = new SqlCommand(queryString, conn);

                SqlDataReader reader = await sqlCommand.ExecuteReaderAsync();

                while (await reader.ReadAsync())
                {
                    roles.Add(reader["Name"].ToString());
                }
            }

            return roles;
        }

        public async Task<Guid> GetRoleIdAsync(string role)
        {
            Guid returnValue = Guid.Empty;

            using (var conn = new SqlConnection(_connectionString))
            {
                await conn.OpenAsync();

                string queryString = "SELECT \"Id\" FROM \"Roles\" WHERE Name = @Role";
                SqlCommand sqlCommand = new SqlCommand(queryString, conn);
                sqlCommand.Parameters.AddWithValue("@Role", role);

                SqlDataReader reader = await sqlCommand.ExecuteReaderAsync();

                while (await reader.ReadAsync())
                {
                    returnValue = (Guid)reader["Id"];
                }
            }

            return returnValue;
        }
    }
}



