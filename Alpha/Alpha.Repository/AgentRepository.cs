using Alpha.Model;
using Alpha.Common;
using Alpha.Repository.Common;
using System;
using System.Collections.Generic;
using System.Configuration;
using Microsoft.Data.SqlClient;
using System.Linq;
using System.Text;
using System.Threading.Tasks;
using Dapper;

namespace Alpha.Repository
{
    public class AgentRepository : IAgentRepository
    {
        private readonly string _connectionString;
        private LocationRepository _locationRepository;
        private RoleRepository _roleRepository;

        public AgentRepository(string connectionString)
        {
            _connectionString = connectionString;

            _locationRepository = new LocationRepository(_connectionString);
            _roleRepository = new RoleRepository(_connectionString);
        }

        /// <summary>
        /// Checks the login information of the user by querying the database for a matching identification number and password.
        /// </summary>
        /// <param name="userDetails"></param>
        /// <returns></returns>
        public async Task<LoginInfo> CheckLoginInfoAsync(LoginRequest userDetails)
        {
            string query = "SELECT " +
                                "CAST(Agents.Id AS NVARCHAR(36)) AS Id, " +
                                "Users.Name AS Username, " +
                                "Roles.Name AS Role, " +
                                "Agents.Password AS PasswordHash " +
                            "FROM Agents " +
                            "INNER JOIN Users ON Agents.UserId = Users.Id " +
                            "INNER JOIN Roles ON Agents.RoleId = Roles.Id " +
                            "WHERE IdentificationNumber = @IdentificationNumber AND Agents.IsActive = 1";

            using (var connection = new SqlConnection(_connectionString))
            {
                await connection.OpenAsync();
                var row = await connection.QueryFirstOrDefaultAsync<dynamic>(query, new { IdentificationNumber = userDetails.Id });
                if (row == null) return null;
                if (!BCrypt.Net.BCrypt.Verify(userDetails.Password, (string)row.PasswordHash)) return null;
                return new LoginInfo { Id = row.Id, Username = row.Username, Role = row.Role };
            }
        }

        /// <summary>
        /// Retrieves a list of all agent names from the database, excluding those with the role of "Super Admin".
        /// </summary>
        /// <returns></returns>
        public async Task<List<string>> GetAllAgentsAsync()
        {
            List<string> agents = new List<string>();

            using (var conn = new SqlConnection(_connectionString))
            {
                await conn.OpenAsync();

                string queryString = "SELECT U.Name FROM Agents INNER JOIN Users U ON Agents.UserId = U.Id";
                SqlCommand sqlCommand = new SqlCommand(queryString, conn);

                SqlDataReader reader = await sqlCommand.ExecuteReaderAsync();

                while (await reader.ReadAsync())
                {
                    agents.Add(reader["Name"].ToString());
                }
            }

            return agents;
        }

        /// <summary>
        /// Retrieves a paginated list of agents from the database based on the provided filtering criteria and pagination parameters. 
        /// The method constructs a dynamic SQL query that includes filtering conditions for search terms and role, and applies pagination using OFFSET and FETCH.
        /// </summary>
        /// <param name="filter"></param>
        /// <param name="paging"></param>
        /// <returns></returns>
        public async Task<List<AgentModelView>> GetAllAgentsAsync(AgentFiltering filter, Paging paging)
        {
            List<AgentModelView> agentModelViews = new List<AgentModelView>();

            using (SqlConnection conn = new SqlConnection(_connectionString))
            {
                await conn.OpenAsync();

                StringBuilder queryBuilder = new StringBuilder(
                    "SELECT Agents.Id, " +
                    "Roles.Name as RoleName, " +
                    "Agents.IdentificationNumber, " +
                    "Users.Name as UserName, " +
                    "Agents.MailAddress, " +
                    "Locations.Name as Location, " +
                    "Agents.IsActive " +
                    "FROM Agents " +
                    "INNER JOIN Users ON Users.Id = Agents.UserId " +
                    "INNER JOIN Roles ON Roles.Id = Agents.RoleId " +
                    "INNER JOIN Locations ON Locations.Id = Agents.LocationId " +
                    "WHERE Roles.Name != 'Super Admin' ");

                await FilteringQuery(filter, queryBuilder);

                queryBuilder.Append("ORDER BY Agents.Id ");
                queryBuilder.Append("OFFSET @Offset ROWS FETCH NEXT @NumberOfRows ROWS ONLY");

                using (SqlCommand cmd = new SqlCommand(queryBuilder.ToString(), conn))
                {
                    cmd.Parameters.AddWithValue("@Offset", (paging.PageNumber - 1) * paging.PageSize);
                    cmd.Parameters.AddWithValue("@NumberOfRows", paging.PageSize);

                    if (!string.IsNullOrWhiteSpace(filter.Search))
                        cmd.Parameters.AddWithValue("@Search", $"%{filter.Search}%");

                    if (!string.IsNullOrWhiteSpace(filter.Role) && filter.Role != "Svi")
                        cmd.Parameters.AddWithValue("@Role", filter.Role);

                    using (SqlDataReader reader = await cmd.ExecuteReaderAsync())
                    {
                        while (await reader.ReadAsync())
                        {
                            agentModelViews.Add(new AgentModelView(
                                (Guid)reader["Id"],
                                (string)reader["UserName"],
                                (string)reader["RoleName"],
                                (string)reader["IdentificationNumber"],
                                Convert.IsDBNull(reader["MailAddress"]) ? string.Empty : (string)reader["MailAddress"],
                                (string)reader["Location"],
                                (bool)reader["IsActive"]
                            ));
                        }
                    }
                }
            }

            return agentModelViews;
        }

        /// <summary>
        /// Retrieves the total count of agents from the database that match the provided filtering criteria. 
        /// Used for showing how many employees there are that fit the given filter.
        /// </summary>
        /// <param name="filter"></param>
        /// <returns></returns>
        public async Task<int> GetTotalAgentsCountAsync(AgentFiltering filter)
        {
            using (SqlConnection conn = new SqlConnection(_connectionString))
            {
                await conn.OpenAsync();

                StringBuilder queryBuilder = new StringBuilder(
                    "SELECT COUNT(*) " +
                    "FROM Agents " +
                    "INNER JOIN Users ON Users.Id = Agents.UserId " +
                    "INNER JOIN Roles ON Roles.Id = Agents.RoleId " +
                    "INNER JOIN Locations ON Locations.Id = Agents.LocationId " +
                    "WHERE Roles.Name != 'Super Admin' ");

                await FilteringQuery(filter, queryBuilder);

                using (SqlCommand cmd = new SqlCommand(queryBuilder.ToString(), conn))
                {
                    if (!string.IsNullOrWhiteSpace(filter.Search))
                        cmd.Parameters.AddWithValue("@Search", $"%{filter.Search}%");

                    if (!string.IsNullOrWhiteSpace(filter.Role) && filter.Role != "Svi")
                        cmd.Parameters.AddWithValue("@Role", filter.Role);

                    return (int)await cmd.ExecuteScalarAsync();
                }
            }
        }

        /// <summary>
        /// Helper method that appends filtering conditions to the provided SQL query based on the search term and role specified in the AgentFiltering object.
        /// </summary>
        /// <param name="filter"></param>
        /// <param name="queryBuilder"></param>
        /// <returns></returns>
        private async Task FilteringQuery(AgentFiltering filter, StringBuilder queryBuilder)
        {
            if (!string.IsNullOrWhiteSpace(filter.Search))
                {
                    queryBuilder.Append("AND (Agents.IdentificationNumber LIKE @Search ");
                    queryBuilder.Append("OR Agents.MailAddress LIKE @Search ");
                    queryBuilder.Append("OR Users.Name LIKE @Search) ");
                }

                if (!string.IsNullOrWhiteSpace(filter.Role) && filter.Role != "Svi")
                {
                    queryBuilder.Append("AND Roles.Name = @Role ");
                }

            await Task.CompletedTask;
        }

        /// <summary>
        /// Retrieves detailed information about a specific agent from the database based on the provided agent ID. 
        /// The method executes two SQL queries: the first one retrieves basic agent information along with their role and location, while the second query calculates statistics related to the agent's insurance policies.
        /// The results are combined into an AgentDetailsView object that includes both the agent's details and their policy statistics.
        /// </summary>
        /// <param name="filter"></param>
        /// <param name="queryBuilder"></param>
        /// <returns></returns>
        public async Task<AgentDetailsView> GetAgentDetailsByIdAsync(Guid agentId)
        {
            AgentDetailsView agent = null;

            /*
            Agents.OIB,
            Agents.DateOfBirth,
            Agents.PhoneNumber,
            */

            /*
            Agents.LastLogin,
            Agents.LastActivity,
            */

            using (SqlConnection conn = new SqlConnection(_connectionString))
            {
                await conn.OpenAsync();

                string agentQuery = @"
                    SELECT
                        Agents.Id,
                        Users.Name,
                        Agents.MailAddress,
                        Agents.IdentificationNumber,
                        Agents.IsActive,
                        Roles.Name AS RoleName,
                        Locations.Name AS LocationName
                    FROM Agents
                    INNER JOIN Users ON Agents.UserId = Users.Id
                    INNER JOIN Roles ON Agents.RoleId = Roles.Id
                    INNER JOIN Locations ON Agents.LocationId = Locations.Id
                    WHERE Agents.Id = @AgentId";

                using (SqlCommand cmd = new SqlCommand(agentQuery, conn))
                {
                    cmd.Parameters.AddWithValue("@AgentId", agentId);

                    using (SqlDataReader reader = await cmd.ExecuteReaderAsync())
                    {
                        if (await reader.ReadAsync())
                        {
                            agent = new AgentDetailsView
                            {
                                Id = (Guid)reader["Id"],
                                Name = (string)reader["Name"],
                                MailAddress = Convert.IsDBNull(reader["MailAddress"]) ? string.Empty : (string)reader["MailAddress"],
                                IdentificationNumber = (string)reader["IdentificationNumber"],
                                IsActive = (bool)reader["IsActive"],
                                RoleName = (string)reader["RoleName"],
                                LocationName = (string)reader["LocationName"]
                            };
                        }
                    }
                }

                if (agent == null)
                    return null;

                string policiesQuery = @"
                    SELECT
                        COUNT(*) AS TotalPoliciesCount,
                        COALESCE(SUM(IP.Price), 0) AS TotalPremiumSum,
                        COALESCE(SUM(CASE
                            WHEN YEAR(IP.DateCreated) = YEAR(GETDATE())
                            AND MONTH(IP.DateCreated) = MONTH(GETDATE())
                            THEN 1 ELSE 0 END), 0) AS MonthlyPoliciesCount,
                        COALESCE(SUM(CASE
                            WHEN YEAR(IP.DateCreated) = YEAR(GETDATE())
                            AND MONTH(IP.DateCreated) = MONTH(GETDATE())
                            THEN IP.Price ELSE 0 END), 0) AS MonthlyPremiumSum
                    FROM InsurancePolicies IP
                    INNER JOIN Partners P ON P.Id = IP.PartnerId
                    INNER JOIN Agents A ON A.UserId = (SELECT UserId FROM Agents WHERE Id = @AgentId)
                    INNER JOIN Users U ON U.Id = A.UserId
                    WHERE P.Name = U.Name";

                using (SqlCommand cmd = new SqlCommand(policiesQuery, conn))
                {
                    cmd.Parameters.AddWithValue("@AgentId", agentId);

                    using (SqlDataReader reader = await cmd.ExecuteReaderAsync())
                    {
                        if (await reader.ReadAsync())
                        {
                            agent.TotalPoliciesCount = Convert.ToInt32(reader["TotalPoliciesCount"]);
                            agent.TotalPremiumSum = Convert.ToDecimal(reader["TotalPremiumSum"]);
                            agent.MonthlyPoliciesCount = Convert.ToInt32(reader["MonthlyPoliciesCount"]);
                            agent.MonthlyPremiumSum = Convert.ToDecimal(reader["MonthlyPremiumSum"]);
                        }
                    }
                }
            }

            return agent;
        }

        

        /// <summary>
        /// Checks the next free identification number for the new agents that is being added
        /// </summary>
        /// <returns></returns>
        private async Task<string> GetNextIdentificationNumberAsync()
        {
            using (SqlConnection conn = new SqlConnection(_connectionString))
            {
                await conn.OpenAsync();

                string query = "SELECT MAX(CAST(IdentificationNumber AS INT)) FROM Agents";

                using (SqlCommand cmd = new SqlCommand(query, conn))
                {
                    var result = await cmd.ExecuteScalarAsync();
                    int lastNumber = result == DBNull.Value || result == null ? 99 : Convert.ToInt32(result);
                    return (lastNumber + 1).ToString();
                }
            }
        }

        /// <summary>
        /// Adding a new agent
        /// Using GetNextIdentificationNumberAsync function to automate the next identification number
        /// </summary>
        /// <param name="request"></param>
        /// <returns></returns>
        public async Task<bool> AddAgentAsync(AddAgentRequest request)
        {
            Guid userId = Guid.NewGuid();
            Guid agentId = Guid.NewGuid();
            string identificationNumber = await GetNextIdentificationNumberAsync();
            Guid roleId = await _roleRepository.GetRoleIdAsync(request.RoleName);
            Guid locationId = await _locationRepository.GetLocationIdByNameAsync(request.Location);

            await using SqlConnection conn = new SqlConnection(_connectionString);
            await conn.OpenAsync();
            await using SqlTransaction tran = conn.BeginTransaction();

            try
            {
                string userQuery = "INSERT INTO Users (Id, Name) VALUES (@Id, @Name)";
                await using SqlCommand userCmd = new SqlCommand(userQuery, conn, tran);
                userCmd.Parameters.AddWithValue("@Id", userId);
                userCmd.Parameters.AddWithValue("@Name", request.Name.ToUpper());
                await userCmd.ExecuteNonQueryAsync();

                string agentQuery = "INSERT INTO Agents (Id, RoleId, IdentificationNumber, MailAddress, Password, LocationId, UserId) " +
                                    "VALUES (@Id, @RoleId, @IdentificationNumber, @MailAddress, @Password, @LocationId, @UserId)";
                await using SqlCommand agentCmd = new SqlCommand(agentQuery, conn, tran);
                agentCmd.Parameters.AddWithValue("@Id", agentId);
                agentCmd.Parameters.AddWithValue("@RoleId", roleId);
                agentCmd.Parameters.AddWithValue("@IdentificationNumber", identificationNumber);
                agentCmd.Parameters.AddWithValue("@MailAddress", request.MailAddress);
                agentCmd.Parameters.AddWithValue("@Password", BCrypt.Net.BCrypt.HashPassword(request.Password));
                agentCmd.Parameters.AddWithValue("@LocationId", locationId);
                agentCmd.Parameters.AddWithValue("@UserId", userId);
                int rowsAffected = await agentCmd.ExecuteNonQueryAsync();
                await tran.CommitAsync();
                return rowsAffected > 0;
            }
            catch
            {
                await tran.RollbackAsync();
                throw;
            }
        }

        public async Task<bool> UpdateAgentAsync(Guid agentId, UpdateAgentRequest request)
        {
            await using SqlConnection conn = new SqlConnection(_connectionString);
            await conn.OpenAsync();
            await using SqlTransaction tran = conn.BeginTransaction();

            try
            {
                if (!string.IsNullOrWhiteSpace(request.Name))
                {
                    string userQuery = "UPDATE Users SET Name = @Name WHERE Id = (SELECT UserId FROM Agents WHERE Id = @AgentId)";
                    await using SqlCommand userCmd = new SqlCommand(userQuery, conn, tran);
                    userCmd.Parameters.AddWithValue("@Name", request.Name.Trim().ToUpper());
                    userCmd.Parameters.AddWithValue("@AgentId", agentId);
                    await userCmd.ExecuteNonQueryAsync();
                }

                var sets = new List<string>();
                var agentCmd = new SqlCommand("", conn, tran);

                if (!string.IsNullOrWhiteSpace(request.MailAddress))
                {
                    sets.Add("MailAddress = @MailAddress");
                    agentCmd.Parameters.AddWithValue("@MailAddress", request.MailAddress.Trim());
                }
                if (!string.IsNullOrWhiteSpace(request.IdentificationNumber))
                {
                    sets.Add("IdentificationNumber = @IdentificationNumber");
                    agentCmd.Parameters.AddWithValue("@IdentificationNumber", request.IdentificationNumber.Trim());
                }
                if (!string.IsNullOrWhiteSpace(request.LocationName))
                {
                    Guid locationId = await _locationRepository.GetLocationIdByNameAsync(request.LocationName.Trim());
                    sets.Add("LocationId = @LocationId");
                    agentCmd.Parameters.AddWithValue("@LocationId", locationId);
                }
                if (!string.IsNullOrWhiteSpace(request.RoleName))
                {
                    Guid roleId = await _roleRepository.GetRoleIdAsync(request.RoleName.Trim());
                    sets.Add("RoleId = @RoleId");
                    agentCmd.Parameters.AddWithValue("@RoleId", roleId);
                }
                if (!string.IsNullOrWhiteSpace(request.Oib))
                {
                    sets.Add("OIB = @Oib");
                    agentCmd.Parameters.AddWithValue("@Oib", request.Oib.Trim());
                }
                if (request.DateOfBirth.HasValue)
                {
                    sets.Add("DateOfBirth = @DateOfBirth");
                    agentCmd.Parameters.AddWithValue("@DateOfBirth", request.DateOfBirth.Value);
                }
                if (!string.IsNullOrWhiteSpace(request.PhoneNumber))
                {
                    sets.Add("PhoneNumber = @PhoneNumber");
                    agentCmd.Parameters.AddWithValue("@PhoneNumber", request.PhoneNumber.Trim());
                }

                if (sets.Count > 0)
                {
                    agentCmd.CommandText = $"UPDATE Agents SET {string.Join(", ", sets)} WHERE Id = @AgentId";
                    agentCmd.Parameters.AddWithValue("@AgentId", agentId);
                    await agentCmd.ExecuteNonQueryAsync();
                }

                await tran.CommitAsync();
                return true;
            }
            catch
            {
                await tran.RollbackAsync();
                throw;
            }
        }

        // ------------------- AGENT METHODS FROM WEBFORMS ------------------

        public async Task<bool> CheckCurrentUsersPasswordAsync(string id, string password)
        {
            using (SqlConnection conn = new SqlConnection(_connectionString))
            {
                string query = "SELECT TOP 1 Password FROM Agents WHERE Id = @IdNumber";

                using (SqlCommand cmd = new SqlCommand(query, conn))
                {
                    cmd.Parameters.AddWithValue("@IdNumber", id);

                    await conn.OpenAsync();

                    object result = await cmd.ExecuteScalarAsync();
                    if (result == null || result == DBNull.Value) return false;

                    return BCrypt.Net.BCrypt.Verify(password, result.ToString());
                }
            }
        }

        public async Task<bool> CheckIfIDExistsAsync(string id)
        {
            using (SqlConnection conn = new SqlConnection(_connectionString))
            {
                await conn.OpenAsync();

                string query = "SELECT TOP 1 1 FROM Agents WHERE IdentificationNumber = @IdNumber";
                using (SqlCommand cmd = new SqlCommand(query, conn))
                {
                    cmd.Parameters.AddWithValue("@IdNumber", id);

                    object result = await cmd.ExecuteScalarAsync();

                    int count = result != null ? Convert.ToInt32(result) : 0;

                    return count > 0;
                }
            }
        }

        public async Task<bool> CheckIfUserIsAdminAsync(string id)
        {
            bool isAdmin = false;

            string query = "SELECT Roles.Name FROM Agents " +
                "INNER JOIN Roles ON Roles.Id = Agents.RoleId " +
                "WHERE IdentificationNumber = @IdentificationNumber";

            using (SqlConnection conn = new SqlConnection(_connectionString))
            {
                using (SqlCommand cmd = new SqlCommand(query, conn))
                {
                    cmd.Parameters.AddWithValue("@IdentificationNumber", id);

                    await conn.OpenAsync();
                    object result = await cmd.ExecuteScalarAsync();

                    // Check if result is not null and equals "Admin"
                    if (result != null && (result.ToString() == "Admin" || result.ToString() == "Super Admin"))
                    {
                        isAdmin = true;
                    }
                }
            }

            return isAdmin;
        }

        public async Task<AgentDto> GetAgentByIdentificationNumberAsync(string identificationNumber)
        {
            string query = @"SELECT a.Id, u.Name, a.MailAddress,
                            CASE WHEN r.Name = 'Admin' THEN 1 ELSE 0 END AS IsAdmin
                     FROM Agents a
                     INNER JOIN Users u ON a.UserId = u.Id
                     INNER JOIN Roles r ON a.RoleId = r.Id
                     WHERE a.IdentificationNumber = '" + identificationNumber + "'";

            using (var connection = new SqlConnection(_connectionString))
            {
                await connection.OpenAsync();
                return await connection.QueryFirstOrDefaultAsync<AgentDto>(query, new { IdentificationNumber = identificationNumber });
            }
        }


        public async Task<bool> IsEmployeeDeletedAsync(Guid id)
        {
            using (SqlConnection conn = new SqlConnection(_connectionString))
            {
                string query = "DELETE TOP (1) FROM Agents WHERE Id = @id";

                using (SqlCommand cmd = new SqlCommand(query, conn))
                {
                    cmd.Parameters.AddWithValue("@id", id);

                    await conn.OpenAsync();

                    int rowsAffected = await cmd.ExecuteNonQueryAsync();

                    return rowsAffected > 0;
                }
            }
        }

        public async Task<bool> UpdatePasswordAsync(string id, string password)
        {
            using (SqlConnection conn = new SqlConnection(_connectionString))
            {
                string query = "UPDATE Agents SET Password = @Password WHERE Id = @IdNumber";

                using (SqlCommand cmd = new SqlCommand(query, conn))
                {
                    cmd.Parameters.AddWithValue("@Password", BCrypt.Net.BCrypt.HashPassword(password));
                    cmd.Parameters.AddWithValue("@IdNumber", id);

                    await conn.OpenAsync();

                    int rowsAffected = await cmd.ExecuteNonQueryAsync();

                    return rowsAffected > 0;
                }
            }
        }

        public async Task<LoginInfo> GetLoginInfoByAgentIdAsync(Guid agentId)
        {
            string query =
                "SELECT CAST(Agents.Id AS NVARCHAR(36)) AS Id, Users.Name AS Username, Roles.Name AS Role " +
                "FROM Agents " +
                "INNER JOIN Users ON Agents.UserId = Users.Id " +
                "INNER JOIN Roles ON Agents.RoleId = Roles.Id " +
                "WHERE Agents.Id = @AgentId";
            using var conn = new SqlConnection(_connectionString);
            await conn.OpenAsync();
            return await conn.QueryFirstOrDefaultAsync<LoginInfo>(query, new { AgentId = agentId });
        }

        public async Task StoreRefreshTokenAsync(Guid agentId, string token, DateTime expiresAt)
        {
            string query =
                "INSERT INTO RefreshTokens (Id, AgentId, Token, ExpiresAt, IsRevoked, CreatedAt) " +
                "VALUES (NEWID(), @AgentId, @Token, @ExpiresAt, 0, GETUTCDATE())";
            using var conn = new SqlConnection(_connectionString);
            await conn.OpenAsync();
            await conn.ExecuteAsync(query, new { AgentId = agentId, Token = token, ExpiresAt = expiresAt });
        }

        public async Task<RefreshToken> GetRefreshTokenAsync(string token)
        {
            string query = "SELECT * FROM RefreshTokens WHERE Token = @Token AND IsRevoked = 0";
            using var conn = new SqlConnection(_connectionString);
            await conn.OpenAsync();
            return await conn.QueryFirstOrDefaultAsync<RefreshToken>(query, new { Token = token });
        }

        public async Task RevokeRefreshTokenAsync(string token)
        {
            string query = "UPDATE RefreshTokens SET IsRevoked = 1 WHERE Token = @Token";
            using var conn = new SqlConnection(_connectionString);
            await conn.OpenAsync();
            await conn.ExecuteAsync(query, new { Token = token });
        }

        public async Task<bool> SetAgentActiveAsync(Guid agentId, bool isActive)
        {
            string query = "UPDATE Agents SET IsActive = @IsActive WHERE Id = @AgentId";
            using var conn = new SqlConnection(_connectionString);
            await conn.OpenAsync();
            int rows = await conn.ExecuteAsync(query, new { IsActive = isActive, AgentId = agentId });
            return rows > 0;
        }
    }
}



