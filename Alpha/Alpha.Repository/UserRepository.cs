using Alpha.Repository.Common;
using Alpha.Model;
using System;
using System.Collections.Generic;
using System.Configuration;
using System.Data;
using Microsoft.Data.SqlClient;
using System.Drawing;
using System.Linq;
using System.Text;
using System.Threading.Tasks;

namespace Alpha.Repository
{
    public class UserRepository : IUserRepository
    {
        private readonly string _connectionString;

        public UserRepository(string connectionString)
        {
            _connectionString = connectionString;
        }
        public async Task<Guid> AddUserAsync(string name)
        {
            Guid userGuid = Guid.NewGuid();

            using (var conn = new SqlConnection(_connectionString))
            {
                await conn.OpenAsync();

                using (var tran = conn.BeginTransaction())
                {
                    string userQuery = "INSERT INTO \"Users\" (Id, Name) VALUES (@Id, @Name)";
                    using (var userCommand = new SqlCommand(userQuery, conn, tran))
                        {
                        userCommand.Parameters.AddWithValue("@Id", userGuid);
                        userCommand.Parameters.AddWithValue("@Name", name.ToUpper());

                        int rowsAffected = await userCommand.ExecuteNonQueryAsync();

                        if (rowsAffected > 0)
                        {
                            tran.Commit();
                            return userGuid;
                        }
                        else
                        {
                            tran.Rollback();
                            throw new Exception("Greška prilikom dodavanja korisnika u bazu.");
                        }
                    }
                }
            }
        }

        // ------------------- USER METHODS FROM WEBFORMS ------------------

        public async Task<Dictionary<string, string>> GetAllUsers(string userName)
        {
            Dictionary<string, string> usersInfo = new Dictionary<string, string>();

            string query = "SELECT TOP 10 Users.Name, Clients.Oib FROM Clients INNER JOIN Users ON Clients.UserId = Users.Id WHERE" +
                " Users.Name LIKE @UserName";

            using (var conn = new SqlConnection(_connectionString)){
                SqlCommand cmd = new SqlCommand(query, conn);

                cmd.Parameters.AddWithValue("@UserName", "%" + userName + "%");

                await conn.OpenAsync();

                using (SqlDataReader reader = cmd.ExecuteReader())
                {
                    while (await reader.ReadAsync())
                    {
                        string name = reader.GetString(0);
                        string oib = reader.GetString(1);

                        if (usersInfo.ContainsKey(name))
                        {
                            // Dodajte broj za razlikovanje duplikata
                            int duplicateCount = usersInfo.Count(kvp => kvp.Key.StartsWith(name));
                            name += $" ({duplicateCount + 1})";
                        }

                        usersInfo[name] = oib;
                    }
                }
            }

            return usersInfo;
        }

        public async Task<bool> UpdateUserAsync(string name, string policyNumber)
        {
            using (SqlConnection conn = new SqlConnection(_connectionString))
            {
                await conn.OpenAsync();

                string query = @"
                    UPDATE Users
                    SET 
                        Name = @Name 
                    FROM Users
                    INNER JOIN Clients ON Clients.UserId = Users.Id
                    INNER JOIN InsurancePolicies ON InsurancePolicies.ClientId = Clients.Id
                    WHERE InsurancePolicies.PolicyNumber = @PolicyNumber;";

                using (SqlCommand cmd = new SqlCommand(query, conn))
                {
                    // Add parameters
                    cmd.Parameters.AddWithValue("@Name", name);
                    cmd.Parameters.AddWithValue("@PolicyNumber", policyNumber);

                    // Execute the query
                    int rowsAffected = await cmd.ExecuteNonQueryAsync();
                    return rowsAffected > 0;
                }
            }
        }
    }
}



