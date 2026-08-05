using Alpha.Model;
using Alpha.Common;
using Alpha.Repository.Common;
using System;
using System.Collections.Generic;
using System.Configuration;
using Microsoft.Data.SqlClient;
using System.Linq;
using System.Security.Cryptography;
using System.Text;
using System.Threading.Tasks;
using System.Xml.Linq;
using System.Security.Cryptography.X509Certificates;

namespace Alpha.Repository
{
    public class ClientRepository : IClientRepository
    {
        private readonly string _connectionString;
        private readonly IUserRepository _userRepository;

        public ClientRepository(string connectionString)
        {
            _connectionString = connectionString;
            _userRepository = new UserRepository(_connectionString);
        }

        /// <summary>
        /// Getting a list of clients by OIB. Returns a list of ClientView objects that match the given OIB. If no clients are found, returns an empty list.
        /// Used for loading all clients that have the same OIB, since there can be multiple clients with the same OIB that have different legal status.
        /// </summary>
        /// <param name="oib"></param>
        /// <returns></returns>
        public async Task<List<ClientView>> GetAllClientsByOibAsync(string oib)
        {
            List<ClientView> clientViews = new List<ClientView>();

            using (var conn = new SqlConnection(_connectionString))
            {
                // TODO: Load legal status also
                string clientQuery = "SELECT Clients.Id, Clients.OIB, Users.Name FROM Clients INNER JOIN Users ON Clients.UserId = Users.Id WHERE OIB = @Oib";
                using SqlCommand cmd = new SqlCommand(clientQuery, conn);
                cmd.Parameters.AddWithValue("@Oib", oib);

                await conn.OpenAsync();

                using SqlDataReader reader = await cmd.ExecuteReaderAsync();

                while (await reader.ReadAsync())
                {
                    ClientView client = new ClientView(
                        (Guid)reader["Id"],
                        (string)reader["OIB"],
                        (string)reader["Name"]
                    );

                    clientViews.Add(client);
                }
            }

            return clientViews;
        }

        /// <summary>
        /// Adding a new client to the database. Returns true if the client was successfully added, false otherwise.
        /// </summary>
        /// <param name="client"></param>
        /// <returns></returns>
        public async Task<Guid> AddClientAsync(ClientRequest client)
        {
            Guid clientGuid = Guid.NewGuid();

            using (SqlConnection conn = new SqlConnection(_connectionString))
            {
                string clientQuery = "INSERT INTO \"Clients\" VALUES (@Id, @MailAddress, @DateOfBirth, @UserId, @Phonenumber, @OIB)";
                SqlCommand cmd = new SqlCommand(clientQuery, conn);

                cmd.Parameters.AddWithValue("@Id", clientGuid);
                cmd.Parameters.AddWithValue("@MailAddress", client.EmailAddress);
                cmd.Parameters.AddWithValue("@DateOfBirth", (object?)client.Dob ?? DBNull.Value);
                cmd.Parameters.AddWithValue("@UserId", await _userRepository.AddUserAsync(client.Name));
                cmd.Parameters.AddWithValue("@Phonenumber", client.PhoneNumber);
                cmd.Parameters.AddWithValue("@OIB", client.Oib);

                await conn.OpenAsync();

                SqlTransaction tran = conn.BeginTransaction();
                cmd.Transaction = tran;

                int userAdded = await cmd.ExecuteNonQueryAsync();

                if (userAdded != 0)
                {
                    tran.Commit();
                    return clientGuid;
                }
            }

            return Guid.Empty;
        }

        /// <summary>
        /// Updates the OIB of a client in the database. Returns true if the OIB was successfully updated, false otherwise.
        /// Used for updating the OIB of a client when changing to a different client, since the same client can have multiple OIBs with different legal status, and we want to update the OIB of the client that is being changed to.
        /// </summary>
        /// <param name="clientId"></param>
        /// <param name="oib"></param>
        /// <returns></returns>
        public async Task<bool> UpdateOib(Guid clientId, string oib)
        {
            using (var conn = new SqlConnection(_connectionString))
            {
                await conn.OpenAsync();

                string clientQuery = @"
                    UPDATE c
                    SET c.OIB = @NewOib
                    FROM Clients c
                    INNER JOIN Users u ON c.UserId = u.Id
                    WHERE c.Id = @ClientId";

                SqlCommand sqlCommand = new SqlCommand(clientQuery, conn);
                sqlCommand.Parameters.AddWithValue("@NewOib", oib);
                sqlCommand.Parameters.AddWithValue("@ClientId", clientId);
                
                int rowsAffected = await sqlCommand.ExecuteNonQueryAsync();

                return rowsAffected > 0;
            }
        }

        /// <summary>
        /// Changes the client associated with a specific insurance policy to a different client. 
        /// </summary>
        /// <param name="clientRequest"></param>
        /// <returns></returns>
        public async Task<bool> ChangeToDifferentClientAsync(ChangeClientRequest clientRequest)
        {
            using (var conn = new SqlConnection(_connectionString))
            {
                await conn.OpenAsync();

                // Load the selected policy to get its ClientId and PolicyNumber
                string anchorQuery = @"
                    SELECT Id, PolicyNumber, PreviousPolicyNumber, ClientId
                    FROM InsurancePolicies
                    WHERE Id = @PolicyId";

                string anchorPolicyNumber = null;
                string anchorPreviousPolicyNumber = null;
                string clientId = null;

                using (var cmd = new SqlCommand(anchorQuery, conn))
                {
                    cmd.Parameters.AddWithValue("@PolicyId", clientRequest.PolicyId);
                    using var reader = await cmd.ExecuteReaderAsync();
                    if (await reader.ReadAsync())
                    {
                        anchorPolicyNumber = reader["PolicyNumber"]?.ToString();
                        anchorPreviousPolicyNumber = reader["PreviousPolicyNumber"]?.ToString();
                        clientId = reader["ClientId"]?.ToString();
                    }
                }

                if (anchorPolicyNumber == null || clientId == null)
                    return false;

                // Load all policies for this client to traverse the chain in C#
                string loadQuery = @"
                    SELECT Id, PolicyNumber, PreviousPolicyNumber
                    FROM InsurancePolicies
                    WHERE ClientId = @ClientId";

                var allPolicies = new List<(Guid Id, string PolicyNumber, string PreviousPolicyNumber)>();
                using (var cmd = new SqlCommand(loadQuery, conn))
                {
                    cmd.Parameters.AddWithValue("@ClientId", clientId);
                    using var reader = await cmd.ExecuteReaderAsync();
                    while (await reader.ReadAsync())
                    {
                        var id = (Guid)reader["Id"];
                        var pn = reader["PolicyNumber"]?.ToString() ?? "";
                        var ppn = reader["PreviousPolicyNumber"]?.ToString() ?? "";
                        allPolicies.Add((id, pn, ppn));
                    }
                }

                // Build lookup maps (GroupBy handles duplicate PolicyNumbers in DB)
                var byPolicyNumber = allPolicies
                    .GroupBy(p => p.PolicyNumber)
                    .ToDictionary(g => g.Key, g => g.First());
                var byPreviousPolicyNumber = allPolicies
                    .Where(p => !string.IsNullOrEmpty(p.PreviousPolicyNumber))
                    .GroupBy(p => p.PreviousPolicyNumber)
                    .ToDictionary(g => g.Key, g => g.Select(x => x).ToList());

                // Traverse chain in both directions from the anchor policy
                var chainIds = new HashSet<Guid>();
                var visited = new HashSet<string>();
                var queue = new Queue<string>();
                queue.Enqueue(anchorPolicyNumber);

                while (queue.Count > 0)
                {
                    var current = queue.Dequeue();
                    if (!visited.Add(current)) continue;

                    if (!byPolicyNumber.TryGetValue(current, out var policy)) continue;
                    chainIds.Add(policy.Id);

                    // Walk backward: find the policy whose PolicyNumber = current.PreviousPolicyNumber
                    if (!string.IsNullOrEmpty(policy.PreviousPolicyNumber) &&
                        !visited.Contains(policy.PreviousPolicyNumber))
                        queue.Enqueue(policy.PreviousPolicyNumber);

                    // Walk forward: find policies whose PreviousPolicyNumber = current.PolicyNumber
                    if (byPreviousPolicyNumber.TryGetValue(current, out var forwards))
                        foreach (var fwd in forwards)
                            if (!visited.Contains(fwd.PolicyNumber))
                                queue.Enqueue(fwd.PolicyNumber);
                }

                if (chainIds.Count == 0) return false;

                // Update all policies in the chain
                var idParams = string.Join(",", chainIds.Select((_, i) => $"@Id{i}"));
                string updateQuery = $"UPDATE InsurancePolicies SET ClientId = @NewClientId WHERE Id IN ({idParams})";

                using (var cmd = new SqlCommand(updateQuery, conn))
                {
                    cmd.Parameters.AddWithValue("@NewClientId", clientRequest.Client.ClientId);
                    int i = 0;
                    foreach (var id in chainIds)
                        cmd.Parameters.AddWithValue($"@Id{i++}", id);
                    int rowsAffected = await cmd.ExecuteNonQueryAsync();
                    return rowsAffected > 0;
                }
            }
        }

        /// <summary>
        /// Method that updates the details of a client in the database. It takes an UpdateClientRequest object as a parameter, which contains the updated details of the client.
        /// </summary>
        /// <param name="request"></param>
        /// <returns></returns>
        public async Task<bool> UpdateClientAsync(UpdateClientRequest request)
        {
            using (SqlConnection conn = new SqlConnection(_connectionString))
            {
                await conn.OpenAsync();

                using (SqlTransaction tran = conn.BeginTransaction())
                {
                    try
                    {
                        // Update Clients tablice
                        string updateClientQuery = @"
                            UPDATE Clients SET
                                OIB = @Oib,
                                MailAddress = @EmailAddress,
                                DateOfBirth = @Dob,
                                PhoneNumber = @PhoneNumber
                            WHERE Id = @ClientId";

                        using (SqlCommand cmd = new SqlCommand(updateClientQuery, conn, tran))
                        {
                            cmd.Parameters.AddWithValue("@Oib", request.Oib ?? string.Empty);
                            cmd.Parameters.AddWithValue("@EmailAddress", request.EmailAddress ?? string.Empty);
                            cmd.Parameters.AddWithValue("@Dob", (object?)request.Dob ?? DBNull.Value);
                            cmd.Parameters.AddWithValue("@PhoneNumber", request.PhoneNumber ?? string.Empty);
                            cmd.Parameters.AddWithValue("@ClientId", request.ClientId);

                            await cmd.ExecuteNonQueryAsync();
                        }

                        // Update Users tablice
                        string updateUserQuery = @"
                            UPDATE Users SET
                                Name = @Name
                            WHERE Id = (SELECT UserId FROM Clients WHERE Id = @ClientId)";

                        using (SqlCommand cmd = new SqlCommand(updateUserQuery, conn, tran))
                        {
                            cmd.Parameters.AddWithValue("@Name", request.Name ?? string.Empty);
                            cmd.Parameters.AddWithValue("@ClientId", request.ClientId);

                            await cmd.ExecuteNonQueryAsync();
                        }

                        tran.Commit();
                        return true;
                    }
                    catch
                    {
                        tran.Rollback();
                        throw;
                    }
                }
            }
        }

        /// <summary>
        /// Returns the number of clients that exists but don't have an active policy
        /// </summary>
        /// <returns></returns>
        public async Task<int> GetInactiveClientsAsync()
        {
            using (SqlConnection conn = new SqlConnection(_connectionString))
            {
                await conn.OpenAsync();

                string query = @"
                    SELECT COUNT(DISTINCT Clients.Id)
                    FROM Clients
                    INNER JOIN InsurancePolicies ON InsurancePolicies.ClientId = Clients.Id
                    WHERE NOT EXISTS (
                        SELECT 1 FROM InsurancePolicies IP
                        WHERE IP.ClientId = Clients.Id
                        AND IP.IsRenewed = 0
                        AND DATEADD(YEAR, 1, IP.StartingDate) >= GETDATE()
                    )";

                using (SqlCommand cmd = new SqlCommand(query, conn))
                {
                    var result = await cmd.ExecuteScalarAsync();
                    return result == null || result == DBNull.Value ? 0 : Convert.ToInt32(result);
                }
            }
        }

        /// <summary>
        /// Returns the number of clients whose policy has expired 2 weeks ago and they didn't renew it and they don't have any other active policies. 
        /// This is used for showing how many clients recently lost their insurance.
        /// </summary>
        /// <returns></returns>
        public async Task<int> GetRecentlyLostClientsCountAsync()
        {
            using (SqlConnection conn = new SqlConnection(_connectionString))
            {
                await conn.OpenAsync();

                string query = @"
                    SELECT COUNT(DISTINCT Clients.Id)
                    FROM Clients
                    INNER JOIN InsurancePolicies ON InsurancePolicies.ClientId = Clients.Id
                    WHERE NOT EXISTS (
                        SELECT 1 FROM InsurancePolicies IP
                        WHERE IP.ClientId = Clients.Id
                        AND IP.IsRenewed = 0
                        AND DATEADD(YEAR, 1, IP.StartingDate) >= GETDATE()
                    )
                    AND EXISTS (
                        SELECT 1 FROM InsurancePolicies IP2
                        WHERE IP2.ClientId = Clients.Id
                        AND IP2.IsRenewed = 0
                        AND DATEADD(YEAR, 1, IP2.StartingDate) >= DATEADD(DAY, -14, GETDATE())
                        AND DATEADD(YEAR, 1, IP2.StartingDate) < GETDATE()
                    )";

                using (SqlCommand cmd = new SqlCommand(query, conn))
                {
                    var result = await cmd.ExecuteScalarAsync();
                    return result == null || result == DBNull.Value ? 0 : Convert.ToInt32(result);
                }
            }
        }

        /// <summary>
        /// Retrieves a paginated list of clients from the database based on the provided filtering criteria. 
        /// </summary>
        /// <param name="filter"></param>
        /// <param name="paging"></param>
        /// <returns></returns>
        public async Task<List<ClientModelView>> GetAllFilteredClientsAsync(ClientFiltering filter, Paging paging)
        {
            var clients = new List<ClientModelView>();

            using (SqlConnection conn = new SqlConnection(_connectionString))
            {
                await conn.OpenAsync();

                StringBuilder queryBuilder = new StringBuilder(@"
                    SELECT 
                        Clients.Id,
                        Clients.OIB,
                        Users.Name AS ClientName,
                        Clients.MailAddress,
                        Clients.DateOfBirth,
                        Clients.PhoneNumber,
                        CASE 
                            WHEN EXISTS (
                                SELECT 1 FROM InsurancePolicies IP
                                WHERE IP.ClientId = Clients.Id
                                AND IP.IsRenewed = 0
                                AND DATEADD(YEAR, 1, IP.StartingDate) >= GETDATE()
                            ) THEN 1 ELSE 0 
                        END AS IsActive,
                        CASE
                            WHEN DAY(Clients.DateOfBirth) = DAY(GETDATE())
                            AND MONTH(Clients.DateOfBirth) = MONTH(GETDATE())
                            THEN 1 ELSE 0
                        END AS IsBirthday
                    FROM Clients
                    INNER JOIN Users ON Clients.UserId = Users.Id
                    WHERE 1=1 ");

                await FilteringQuery(filter, queryBuilder);

                queryBuilder.Append(
                    filter.SortNewestFirst
                        ? @"ORDER BY COALESCE((
                                SELECT MAX(IP.DateCreated)
                                FROM InsurancePolicies IP
                                WHERE IP.ClientId = Clients.Id
                            ), '19000101') DESC, Users.Name ASC "
                        : @"ORDER BY COALESCE((
                                SELECT MAX(IP.DateCreated)
                                FROM InsurancePolicies IP
                                WHERE IP.ClientId = Clients.Id
                            ), '19000101') ASC, Users.Name ASC "
                );
                queryBuilder.Append("OFFSET @Offset ROWS FETCH NEXT @PageSize ROWS ONLY");

                using (SqlCommand cmd = new SqlCommand(queryBuilder.ToString(), conn))
                {
                    cmd.Parameters.AddWithValue("@Offset", (paging.PageNumber - 1) * paging.PageSize);
                    cmd.Parameters.AddWithValue("@PageSize", paging.PageSize);

                    if (!string.IsNullOrWhiteSpace(filter.Search))
                        cmd.Parameters.AddWithValue("@Search", $"%{filter.Search}%");

                    //if (!string.IsNullOrWhiteSpace(filter.LegalStatus))
                    //    cmd.Parameters.AddWithValue("@LegalStatus", filter.LegalStatus);

                    using (SqlDataReader reader = await cmd.ExecuteReaderAsync())
                    {
                        while (await reader.ReadAsync())
                        {
                            clients.Add(new ClientModelView(
                                (Guid)reader["Id"],
                                (string)reader["OIB"],
                                (string)reader["ClientName"],
                                //Convert.IsDBNull(reader["LegalStatus"]) ? string.Empty : (string)reader["LegalStatus"],
                                Convert.IsDBNull(reader["MailAddress"]) ? string.Empty : (string)reader["MailAddress"],
                                (DateTime)reader["DateOfBirth"],
                                Convert.IsDBNull(reader["PhoneNumber"]) ? string.Empty : (string)reader["PhoneNumber"],
                                Convert.ToBoolean(reader["IsActive"]),
                                Convert.ToBoolean(reader["IsBirthday"])
                            ));
                        }
                    }
                }
            }

            return clients;
        }

        /// <summary>
        /// Helper method that appends filtering conditions to the provided SQL query based on the search term, legal status, and active status specified in the ClientFiltering object.
        /// </summary>
        /// <param name="filter"></param>
        /// <param name="queryBuilder"></param>
        /// <returns></returns>
        private async Task FilteringQuery(ClientFiltering filter, StringBuilder queryBuilder)
        {
            if (!string.IsNullOrWhiteSpace(filter.Search))
            {
                queryBuilder.Append("AND (Users.Name LIKE @Search OR Clients.OIB LIKE @Search) ");
            }

            if (!string.IsNullOrWhiteSpace(filter.LegalStatus))
            {
                queryBuilder.Append("AND Clients.LegalStatus = @LegalStatus ");
            }

            if (filter.HasBirthday)
            {
                queryBuilder.Append(@"
                    AND DAY(Clients.DateOfBirth) = DAY(GETDATE())
                    AND MONTH(Clients.DateOfBirth) = MONTH(GETDATE()) ");
            }

            if (filter.IsActive == true && filter.IsNotActive == false)
            {
                queryBuilder.Append(@"
                    AND EXISTS (
                        SELECT 1 
                        FROM InsurancePolicies IP
                        WHERE IP.ClientId = Clients.Id
                        AND IP.IsRenewed = 0
                        AND DATEADD(YEAR, 1, IP.StartingDate) >= GETDATE()
                    ) ");
            }
            else if (filter.IsActive == false && filter.IsNotActive == true)
            {
                queryBuilder.Append(@"
                    AND NOT EXISTS (
                        SELECT 1 
                        FROM InsurancePolicies IP
                        WHERE IP.ClientId = Clients.Id
                        AND IP.IsRenewed = 0
                        AND DATEADD(YEAR, 1, IP.StartingDate) >= GETDATE()
                    ) ");
            }
            else if (filter.IsActive == false && filter.IsNotActive == false)
            {
                queryBuilder.Append(" AND 1 = 0 ");
            }

            await Task.CompletedTask;
        }

        /// <summary>
        /// Used to show number of tabs for each client's group by legal status 
        /// </summary>
        /// <param name="filter"></param>
        /// <returns></returns>
        public async Task<int> GetTotalClientCountAsync(ClientFiltering filter)
        {
            using (SqlConnection conn = new SqlConnection(_connectionString))
            {
                await conn.OpenAsync();

                StringBuilder queryBuilder = new StringBuilder(@"
                    SELECT COUNT(*)
                    FROM Clients
                    INNER JOIN Users ON Clients.UserId = Users.Id
                    WHERE 1=1 ");

                await FilteringQuery(filter, queryBuilder);

                using (SqlCommand cmd = new SqlCommand(queryBuilder.ToString(), conn))
                {
                    if (!string.IsNullOrWhiteSpace(filter.Search))
                        cmd.Parameters.AddWithValue("@Search", $"%{filter.Search}%");

                    if (!string.IsNullOrWhiteSpace(filter.LegalStatus))
                        cmd.Parameters.AddWithValue("@LegalStatus", filter.LegalStatus);

                    var result = await cmd.ExecuteScalarAsync();
                    return result == null || result == DBNull.Value ? 0 : Convert.ToInt32(result);
                }
            }
        }

        /// <summary>
        /// Fetches all of the details required to show client details
        /// </summary>
        /// <param name="clientId"></param>
        /// <returns></returns>
        public async Task<ClientDetailsView> GetClientDetailsByIdAsync(Guid clientId)
        {
            ClientDetailsView client = null;

            using (SqlConnection conn = new SqlConnection(_connectionString))
            {
                await conn.OpenAsync();

                string clientQuery = @"
                    SELECT 
                        Clients.Id,
                        Users.Name AS ClientName,
                        Clients.OIB,
                        Clients.PhoneNumber,
                        Clients.MailAddress,
                        Clients.DateOfBirth,
                        COALESCE(SUM(IP.Price), 0) AS TotalPremiumSum,
                        COALESCE(SUM(CASE 
                            WHEN IP.IsRenewed = 0 
                            AND DATEADD(YEAR, 1, IP.StartingDate) >= GETDATE() 
                            THEN IP.Price ELSE 0 END), 0) AS ActivePremiumSum
                    FROM Clients
                    INNER JOIN Users ON Clients.UserId = Users.Id
                    LEFT JOIN InsurancePolicies IP ON IP.ClientId = Clients.Id
                    WHERE Clients.Id = @ClientId
                    GROUP BY 
                        Clients.Id, Users.Name, Clients.OIB, 
                        Clients.PhoneNumber, Clients.MailAddress, 
                        Clients.DateOfBirth";

                using (SqlCommand cmd = new SqlCommand(clientQuery, conn))
                {
                    cmd.Parameters.AddWithValue("@ClientId", clientId);

                    using (SqlDataReader reader = await cmd.ExecuteReaderAsync())
                    {
                        if (await reader.ReadAsync())
                        {
                            client = new ClientDetailsView
                            {
                                Id = (Guid)reader["Id"],
                                Name = (string)reader["ClientName"],
                                Oib = Convert.IsDBNull(reader["OIB"]) ? string.Empty : (string)reader["OIB"],
                                PhoneNumber = Convert.IsDBNull(reader["PhoneNumber"]) ? string.Empty : (string)reader["PhoneNumber"],
                                EmailAddress = Convert.IsDBNull(reader["MailAddress"]) ? string.Empty : (string)reader["MailAddress"],
                                Dob = (DateTime)reader["DateOfBirth"],
                                //LegalStatus = Convert.IsDBNull(reader["LegalStatus"]) ? string.Empty : (string)reader["LegalStatus"],
                                TotalPremiumSum = Convert.ToDecimal(reader["TotalPremiumSum"]),
                                ActivePremiumSum = Convert.ToDecimal(reader["ActivePremiumSum"])
                            };
                        }
                    }
                }

                if (client == null)
                    return null;

                string policiesQuery = @"
                    SELECT 
                        IP.PolicyNumber,
                        IC.Name AS InsuranceCompany,
                        PT.Type AS PolicyType,
                        IP.Price,
                        IP.StartingDate,
                        L.Name AS LocationName,
                        IP.IsRenewed,
                        CASE 
                            WHEN IP.IsRenewed = 0 
                            AND DATEADD(YEAR, 1, IP.StartingDate) >= GETDATE() 
                            THEN 1 ELSE 0 
                        END AS IsActive
                    FROM InsurancePolicies IP
                    INNER JOIN InsuranceCompanies IC ON IP.InsuranceCompanyId = IC.Id
                    INNER JOIN Locations L on IP.LocationId = l.Id
                    INNER JOIN PolicyTypes PT ON IP.PolicyTypeId = PT.Id
                    WHERE IP.ClientId = @ClientId
                    ORDER BY IP.StartingDate DESC";

                using (SqlCommand cmd = new SqlCommand(policiesQuery, conn))
                {
                    cmd.Parameters.AddWithValue("@ClientId", clientId);

                    using (SqlDataReader reader = await cmd.ExecuteReaderAsync())
                    {
                        while (await reader.ReadAsync())
                        {
                            client.Policies.Add(new ClientPolicyView
                            {
                                PolicyNumber = (string)reader["PolicyNumber"],
                                InsuranceCompany = (string)reader["InsuranceCompany"],
                                PolicyType = (string)reader["PolicyType"],
                                Price = (decimal)reader["Price"],
                                StartingDate = (DateTime)reader["StartingDate"],
                                Location = (string)reader["LocationName"],
                                IsRenewed = (bool)reader["IsRenewed"],
                                IsActive = Convert.ToBoolean(reader["IsActive"])
                            });
                        }
                    }
                }
            }

            return client;
        }






        // ------------------- CLIENT METHODS FROM WEBFORMS ------------------

        public async Task<bool> ClientExistsAsync(string oib)
        {
            using (var conn = new SqlConnection(_connectionString))
            {
                string clientExistQuery = "SELECT TOP 1 1 FROM Clients WHERE \"OIB\" = @ClientOib";
                SqlCommand cmd = new SqlCommand(clientExistQuery, conn);

                cmd.Parameters.AddWithValue("@ClientOib", oib);

                conn.Open();

                var result = await cmd.ExecuteScalarAsync();
                return result != null;
            }
        }

        public async Task<bool> ClientExistsByNameAsync(string name)
        {
            using (var conn = new SqlConnection(_connectionString))
            {
                await conn.OpenAsync();

                string clientQuery = "SELECT TOP 1 1 FROM Clients c INNER JOIN Users u ON c.UserId = u.Id WHERE u.Name = @Username";

                using (SqlCommand cmd = new SqlCommand(clientQuery, conn))
                {
                    cmd.Parameters.AddWithValue("@Username", name);

                    object result = await cmd.ExecuteScalarAsync();

                    int count = result != null ? Convert.ToInt32(result) : 0;

                    return count > 0;
                }
            }
        }

        public async Task<Guid> GetClientIdByName(string name)
        {
            Guid returnValue = Guid.Empty;

            using (var conn = new SqlConnection(_connectionString))
            {
                await conn.OpenAsync();

                string clientQuery = "SELECT c.Id FROM Clients c INNER JOIN Users u ON c.UserId = u.Id WHERE u.Name = @Username";
                SqlCommand sqlCommand = new SqlCommand(clientQuery, conn);
                sqlCommand.Parameters.AddWithValue("@Username", name);

                SqlDataReader reader = await sqlCommand.ExecuteReaderAsync();

                while (await reader.ReadAsync())
                {
                    returnValue = (Guid)reader["Id"];
                }
            }

            return returnValue;
        }

        public async Task<string> GetClientOibByName(string name)
        {
            string clientOib = null;

            using (var conn = new SqlConnection(_connectionString))
            {
                await conn.OpenAsync();

                string clientQuery = "SELECT c.OIB FROM Clients c INNER JOIN Users u ON c.UserId = u.Id WHERE u.Name = @Username";
                SqlCommand sqlCommand = new SqlCommand(clientQuery, conn);
                sqlCommand.Parameters.AddWithValue("@Username", name);

                SqlDataReader reader = await sqlCommand.ExecuteReaderAsync();

                while (await reader.ReadAsync())
                {
                    clientOib = reader["OIB"] != DBNull.Value ? (string)reader["OIB"] : string.Empty;
                }
            }

            return clientOib;
        }

        public async Task<List<BirthdaysInfo>> GetBirthdaysInfosAsync()
        {
            List<BirthdaysInfo> birthdaysInfoReturnValue = new List<BirthdaysInfo>();

            using (SqlConnection conn = new SqlConnection(_connectionString))
            {
                string filterQuery = "SELECT Users.Name, Clients.DateOfBirth, Clients.MailAddress, Clients.PhoneNumber " +
                    "FROM Clients " +
                    "INNER JOIN Users ON Clients.UserId = Users.Id " +
                    "WHERE DAY(Clients.DateOfBirth) = DAY(@DateDay) AND " +
                    "MONTH(Clients.DateOfBirth) = MONTH(@DateMonth)";

                SqlCommand queryCommand = new SqlCommand(filterQuery, conn);
                queryCommand.Parameters.AddWithValue("@DateDay", DateTime.Today.Date);
                queryCommand.Parameters.AddWithValue("@DateMonth", DateTime.Today.Date);
                await conn.OpenAsync();

                SqlDataReader reader = await queryCommand.ExecuteReaderAsync();

                if (reader.HasRows)
                {
                    while (await reader.ReadAsync())
                    {
                        BirthdaysInfo birthdaysInfo = new BirthdaysInfo(
                            (string)reader["Name"], 
                            (string)reader["MailAddress"], 
                            (string)reader["PhoneNumber"], 
                            (DateTime)reader["DateOfBirth"]);

                        birthdaysInfoReturnValue.Add(birthdaysInfo);
                    }
                    reader.Close();
                }
            }

            return birthdaysInfoReturnValue;
        }

        public async Task<Guid> GetClientIdByOibAsync(string oib)
        {
            Guid clientId = Guid.Empty;

            using (var conn = new SqlConnection(_connectionString))
            {
                await conn.OpenAsync();

                string clientQuery = "SELECT TOP 1 Id FROM Clients WHERE OIB = @Oib";
                SqlCommand sqlCommand = new SqlCommand(clientQuery, conn);
                sqlCommand.Parameters.AddWithValue("@Oib", oib);

                SqlDataReader reader = await sqlCommand.ExecuteReaderAsync();

                while (await reader.ReadAsync())
                {
                    clientId = reader["Id"] != DBNull.Value ? (Guid)reader["Id"] : Guid.Empty;
                }
            }

            return clientId;
        }
    }
}



