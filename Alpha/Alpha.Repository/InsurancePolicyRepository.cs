using Alpha.Repository.Common;
using Alpha.Common;         
using Alpha.Model;    
using Bogus.DataSets;
using Alpha.Repository;
using System;
using System.Collections.Generic;
using System.Configuration;
using Microsoft.Data.SqlClient;
using System.Linq;
using System.Net.NetworkInformation;
using System.Text;
using System.Threading.Tasks;

namespace Alpha.Repository
{
    public class InsurancePolicyRepository : IInsurancePolicyRepository
    {
        private readonly string _connectionString;

        private LocationRepository _locationRepository;
        private InsuranceCompanyRepository _insuranceCompanyRepository;
        private PolicyTypeRepository _policyTypeRepository;
        private PartnerRepository _partnerRepository;
        private StatusRepository _statusRepository;
        private ClientRepository _clientRepository;
        private UserRepository _userRepository;

        public InsurancePolicyRepository(string connectionString)
        {
            _connectionString = connectionString;

            _locationRepository = new LocationRepository(_connectionString);
            _insuranceCompanyRepository = new InsuranceCompanyRepository(_connectionString);
            _policyTypeRepository = new PolicyTypeRepository(_connectionString);
            _partnerRepository = new PartnerRepository(_connectionString);
            _statusRepository = new StatusRepository(_connectionString);
            _clientRepository = new ClientRepository(_connectionString);
            _userRepository = new UserRepository(_connectionString);

        }

        /// <summary>
        /// Fetches a list of insurance policies based on various filters and supports pagination.
        /// </summary>
        /// <param name="filter"></param>
        /// <param name="paging"></param>
        /// <param name="isGettingAllPolicies"></param>
        /// <returns></returns>
        public async Task<List<InsurancePolicyModelView>> GetAllPoliciesAsync(InsuranceFiltering filter, Paging paging, bool isGettingAllPolicies)
        {
            List<InsurancePolicyModelView> insurancePolicies = new List<InsurancePolicyModelView>();

            try
            {
                using (SqlConnection conn = new SqlConnection(_connectionString))
                {
                    await conn.OpenAsync();

                    StringBuilder queryBuilder = new StringBuilder("SELECT " +
                        "InsurancePolicies.Id, " +
                        "InsurancePolicies.PolicyNumber, " +
                        "Users.Name AS UserName, " +
                        "InsurancePolicies.StartingDate, " +
                        "InsuranceCompanies.Name AS CompanyName, " +
                        "PolicyTypes.Type AS PolicyType, " +
                        "InsurancePolicies.Price, " +
                        "Locations.Name AS LocationName, " +
                        "Partners.Name AS PartnerName, " +
                        "InsurancePolicies.IsRenewed, " +
                        "Clients.PhoneNumber, " +
                        "CASE " +
                            "WHEN InsurancePolicies.IsRenewed = 1 THEN 'Renewed' " +
                            "WHEN DATEDIFF(DAY, GETDATE(), DATEADD(YEAR, 1, InsurancePolicies.StartingDate)) > 14 THEN 'Active' " +
                            "WHEN DATEDIFF(DAY, GETDATE(), DATEADD(YEAR, 1, InsurancePolicies.StartingDate)) BETWEEN 8 AND 14 THEN 'Two Weeks Active' " +
                            "WHEN DATEDIFF(DAY, GETDATE(), DATEADD(YEAR, 1, InsurancePolicies.StartingDate)) BETWEEN 0 AND 7 " +
                                "OR (DAY(InsurancePolicies.StartingDate) = DAY(GETDATE()) AND MONTH(InsurancePolicies.StartingDate) = MONTH(GETDATE())) THEN 'One Week Active' " +
                            "ELSE 'Inactive' " +
                        "END AS PolicyStatus " +
                        "FROM InsurancePolicies " +
                        "INNER JOIN Clients ON InsurancePolicies.ClientId = Clients.Id " +
                        "INNER JOIN Users ON Clients.UserId = Users.Id " +
                        "INNER JOIN Locations ON Locations.Id = InsurancePolicies.LocationId " +
                        "LEFT JOIN Partners ON Partners.Id = InsurancePolicies.PartnerId " +
                        "INNER JOIN PolicyTypes ON PolicyTypes.Id = InsurancePolicies.PolicyTypeId " +
                        "INNER JOIN InsuranceCompanies ON InsurancePolicies.InsuranceCompanyId = InsuranceCompanies.Id WHERE " +
                        "(InsurancePolicies.IsActive = 1 OR InsurancePolicies.IsActive IS NULL) AND " +
                        "YEAR(InsurancePolicies.StartingDate) = @SelectedYear ");

                    await FilteringQuery(filter, queryBuilder);
                    
                    queryBuilder.Append(" ORDER BY InsurancePolicies.StartingDate ");
                    if (filter.IsAsc) queryBuilder.Append("ASC");
                    else queryBuilder.Append("DESC");

                    if(!isGettingAllPolicies)
                        queryBuilder.Append(" OFFSET @Offset ROWS FETCH NEXT " + paging.PageSize.ToString() + "ROWS ONLY");

                    using (SqlCommand cmd = new SqlCommand(queryBuilder.ToString(), conn))
                    {
                        if(!isGettingAllPolicies) cmd.Parameters.AddWithValue("@Offset", (paging.PageNumber - 1) * paging.PageSize);
                        cmd.Parameters.AddWithValue("@SelectedYear", filter.Year.ToString());

                        using (SqlDataReader reader = cmd.ExecuteReader())
                        {
                            while (reader.Read())
                            {
                                insurancePolicies.Add(new InsurancePolicyModelView(
                                    (Guid)reader["Id"],
                                    (string)reader["PolicyNumber"],
                                    (DateTime)reader["StartingDate"],
                                    (string)reader["UserName"],
                                    (string)reader["CompanyName"],
                                    (string)reader["PolicyType"],
                                    (decimal)reader["Price"],
                                    (string)reader["LocationName"],
                                    reader["PartnerName"] == DBNull.Value ? string.Empty : (string)reader["PartnerName"],
                                    (bool)reader["isRenewed"],
                                    (string)reader["PolicyStatus"],
                                    reader["PhoneNumber"] == DBNull.Value ? null : (string)reader["PhoneNumber"]
                                ));
                            }
                        }
                    }
                }

                return insurancePolicies;
            }
            catch
            {
                return null;
            }
        }

        /// <summary>
        /// Helper method to build the dynamic part of the SQL query based on the provided filters. 
        /// This method appends the necessary WHERE clauses to the query string builder depending on which filters are set in the InsuranceFiltering object.
        /// </summary>
        /// <param name="filter"></param>
        /// <param name="queryBuilder"></param>
        /// <returns></returns>
        private async Task FilteringQuery(InsuranceFiltering filter, StringBuilder queryBuilder)
        {
            // price filtering
            if(filter.PriceFrom != 0 || filter.PriceTo != decimal.MaxValue)
            {
                queryBuilder.Append("AND InsurancePolicies.Price >= " + filter.PriceFrom.ToString() + " AND InsurancePolicies.Price <= " + filter.PriceTo.ToString() + " ");
            }

            if (filter.DateFrom.HasValue && filter.DateTo.HasValue &&
                (filter.DateFrom.Value.Date != DateTime.Today.Date || filter.DateTo.Value.Date != DateTime.Today.Date))
            {
                queryBuilder.Append("AND InsurancePolicies.StartingDate >= '" + filter.DateFrom.Value.ToString("yyyy/MM/dd") + "' AND InsurancePolicies.StartingDate <= '" + filter.DateTo.Value.ToString("yyyy/MM/dd") + "' ");
            }

            if (!string.IsNullOrWhiteSpace(filter.Search))
            {
                queryBuilder.Append("AND (InsurancePolicies.PolicyNumber LIKE N'%" + filter.Search + "%' ");
                queryBuilder.Append("OR Users.Name LIKE N'%" + filter.Search + "%' ");
                queryBuilder.Append("OR CAST(InsurancePolicies.Price AS NVARCHAR) LIKE N'%" + filter.Search + "%') ");
            }

            if (filter.Status == "ActiveStatus")
            {
                queryBuilder.Append("AND InsurancePolicies.StartingDate  >= '" + DateTime.Today.AddYears(-1).ToString("yyyy/MM/dd") + "'");
            }
            else if (filter.Status == "InactiveStatus")
            {
                queryBuilder.Append("AND InsurancePolicies.StartingDate < '" + DateTime.Today.AddYears(-1).ToString("yyyy/MM/dd") + "' AND InsurancePolicies.IsRenewed = 0 ");
            }
            else if (filter.Status == "TwoWeekStatus")
            {
                queryBuilder.Append("AND InsurancePolicies.StartingDate BETWEEN '" + DateTime.Today.AddYears(-1).ToString("yyyy/MM/dd") + "' AND '" + DateTime.Today.AddYears(-1).AddDays(14).ToString("yyyy/MM/dd") + "'");
            }
            else if (filter.Status == "OneWeekStatus")
            {
                queryBuilder.Append("AND InsurancePolicies.StartingDate BETWEEN '" + DateTime.Today.AddYears(-1).ToString("yyyy/MM/dd") + "' AND '" + DateTime.Today.AddYears(-1).AddDays(7).ToString("yyyy/MM/dd") + "'");
            }

            if (filter.InsuranceCompany?.Count > 0)
            {
                var quoted = string.Join(",", filter.InsuranceCompany.Select(v => "N'" + v.Replace("'", "''") + "'"));
                queryBuilder.Append($"AND InsuranceCompanies.Name IN ({quoted}) ");
            }

            if (filter.InsuranceType?.Count > 0)
            {
                var quoted = string.Join(",", filter.InsuranceType.Select(v => "N'" + v.Replace("'", "''") + "'"));
                queryBuilder.Append($"AND PolicyTypes.Type IN ({quoted}) ");
            }

            if (filter.Location?.Count > 0)
            {
                var quoted = string.Join(",", filter.Location.Select(v => "N'" + v.Replace("'", "''") + "'"));
                queryBuilder.Append($"AND Locations.Name IN ({quoted}) ");
            }

            if (filter.Partner?.Count > 0)
            {
                var quoted = string.Join(",", filter.Partner.Select(v => "N'" + v.Replace("'", "''") + "'"));
                queryBuilder.Append($"AND Partners.Name IN ({quoted}) ");
            }

            await Task.CompletedTask;
        }

        /// <summary>
        /// Fetches detailed information about a specific insurance policy based on its unique identifier (policyId).
        /// </summary>
        /// <param name="policyId"></param>
        /// <returns></returns>
        public async Task<InsurancePolicyView> GetInsurancePolicyDetailsByIdAsync(Guid policyId)
        {
            InsurancePolicyView insurancePolicy = null;
            List<RelatedPolicyView> relatedPolicies = new List<RelatedPolicyView>();

            using (SqlConnection conn = new SqlConnection(_connectionString))
            {
                await conn.OpenAsync();

                string query = "SELECT " +
                    "InsurancePolicies.PolicyNumber, " +
                    "Clients.Id AS ClientId, " +
                    "Clients.OIB, " +
                    "Clients.DateOfBirth, " +
                    "Clients.PhoneNumber, " +
                    "Clients.MailAddress, " +
                    "Users.Name AS UserName, " +
                    "InsurancePolicies.StartingDate, " +
                    "InsurancePolicies.DateCreated, " +
                    "InsuranceCompanies.Name AS CompanyName, " +
                    "PolicyTypes.Type AS PolicyType, " +
                    "InsurancePolicies.Price, " +
                    "Locations.Name AS LocationName, " +
                    "Partners.Name AS PartnerName, " +
                    "InsurancePolicies.Remark, " +
                    "InsurancePolicies.PreviousPolicyNumber, " +
                    "InsurancePolicies.IsRenewed, " +
                    "CreatorUser.Name AS CreatedByName " +
                    "FROM InsurancePolicies " +
                    "INNER JOIN Clients ON InsurancePolicies.ClientId = Clients.Id " +
                    "INNER JOIN Users ON Clients.UserId = Users.Id " +
                    "INNER JOIN Locations ON Locations.Id = InsurancePolicies.LocationId " +
                    "LEFT JOIN Partners ON Partners.Id = InsurancePolicies.PartnerId " +
                    "INNER JOIN PolicyTypes ON PolicyTypes.Id = InsurancePolicies.PolicyTypeId " +
                    "INNER JOIN InsuranceCompanies ON InsurancePolicies.InsuranceCompanyId = InsuranceCompanies.Id " +
                    "LEFT JOIN Agents AS CreatorAgent ON CreatorAgent.Id = InsurancePolicies.CreatedBy " +
                    "LEFT JOIN Users AS CreatorUser ON CreatorUser.Id = CreatorAgent.UserId " +
                    "WHERE InsurancePolicies.Id = @PolicyId";

                using (SqlCommand cmd = new SqlCommand(query, conn))
                {
                    cmd.Parameters.AddWithValue("@PolicyId", policyId);

                    using (SqlDataReader reader = await cmd.ExecuteReaderAsync())
                    {
                        if (await reader.ReadAsync())
                        {
                            insurancePolicy = new InsurancePolicyView(
                                (string)reader["PolicyNumber"],
                                (string)reader["OIB"],
                                (DateTime)reader["StartingDate"],
                                (DateTime)reader["DateCreated"],
                                (decimal)reader["Price"],
                                Convert.IsDBNull(reader["Remark"]) ? string.Empty : (string)reader["Remark"],
                                (Guid)reader["ClientId"],
                                (string)reader["UserName"],
                                Convert.IsDBNull(reader["DateOfBirth"]) ? null : (DateTime)reader["DateOfBirth"],
                                Convert.IsDBNull(reader["PhoneNumber"]) ? string.Empty : (string)reader["PhoneNumber"],
                                Convert.IsDBNull(reader["MailAddress"]) ? string.Empty : (string)reader["MailAddress"],
                                (string)reader["LocationName"],
                                (string)reader["CompanyName"],
                                (string)reader["PolicyType"],
                                Convert.IsDBNull(reader["PartnerName"]) ? string.Empty : (string)reader["PartnerName"],
                                (bool)reader["IsRenewed"],
                                Convert.IsDBNull(reader["PreviousPolicyNumber"]) ? string.Empty : (string)reader["PreviousPolicyNumber"]
                            );
                            insurancePolicy.CreatedByName = Convert.IsDBNull(reader["CreatedByName"]) ? null : (string)reader["CreatedByName"];
                        }
                    }
                }

                if (insurancePolicy == null)
                    return null;

                if (!string.IsNullOrEmpty(insurancePolicy.PreviousPolicyNumber))
                {
                    string relatedQuery = @"
                        WITH PolicyChain AS (
                            SELECT 
                                IP.PolicyNumber,
                                U.Name AS UserName,
                                IP.PreviousPolicyNumber,
                                IP.Price,
                                IP.StartingDate,
                                IP.DateCreated,
                                IC.Name AS CompanyName,
                                PT.Type AS PolicyType,
                                L.Name AS LocationName
                            FROM InsurancePolicies IP
                            INNER JOIN InsuranceCompanies IC ON IP.InsuranceCompanyId = IC.Id
                            INNER JOIN Clients C ON IP.ClientId = C.Id
                            INNER JOIN Users U ON C.UserId = U.Id
                            INNER JOIN PolicyTypes PT ON IP.PolicyTypeId = PT.Id
                            INNER JOIN Locations L ON IP.LocationId = L.Id
                            WHERE IP.PolicyNumber = (SELECT PreviousPolicyNumber FROM InsurancePolicies WHERE Id = @PolicyId)

                            UNION ALL

                            SELECT 
                                IP.PolicyNumber,
                                U.Name AS UserName,
                                IP.PreviousPolicyNumber,
                                IP.Price,
                                IP.StartingDate,
                                IP.DateCreated,
                                IC.Name AS CompanyName,
                                PT.Type AS PolicyType,
                                L.Name AS LocationName
                            FROM InsurancePolicies IP
                            INNER JOIN InsuranceCompanies IC ON IP.InsuranceCompanyId = IC.Id
                            INNER JOIN PolicyTypes PT ON IP.PolicyTypeId = PT.Id
                            INNER JOIN Clients C ON IP.ClientId = C.Id
                            INNER JOIN Users U ON C.UserId = U.Id
                            INNER JOIN Locations L ON IP.LocationId = L.Id
                            INNER JOIN PolicyChain PC ON IP.PolicyNumber = PC.PreviousPolicyNumber
                        )
                        SELECT * FROM PolicyChain";

                    using (SqlCommand relatedCmd = new SqlCommand(relatedQuery, conn))
                    {
                        relatedCmd.Parameters.AddWithValue("@PolicyId", policyId);

                        using (SqlDataReader reader = await relatedCmd.ExecuteReaderAsync())
                        {
                            while (await reader.ReadAsync())
                            {
                                relatedPolicies.Add(new RelatedPolicyView(
                                    (string)reader["PolicyNumber"],
                                    (string)reader["UserName"],
                                    (string)reader["CompanyName"],
                                    (string)reader["PolicyType"],
                                    (decimal)reader["Price"],
                                    (string)reader["LocationName"],
                                    (DateTime)reader["StartingDate"],
                                    (DateTime)reader["DateCreated"],
                                    Convert.IsDBNull(reader["PreviousPolicyNumber"]) ? string.Empty : (string)reader["PreviousPolicyNumber"]
                                ));
                            }
                        }
                    }
                }

                insurancePolicy.RelatedPolicies = relatedPolicies;
            }

            return insurancePolicy;
        }


        public async Task<int> GetTotalPolicyCountAsync(InsuranceFiltering filter)
        {
            using (SqlConnection conn = new SqlConnection(_connectionString))
            {
                await conn.OpenAsync();

                StringBuilder queryBuilder = new StringBuilder(@"
                    SELECT COUNT(*) AS TotalCount
                    FROM InsurancePolicies 
                    INNER JOIN Clients ON InsurancePolicies.ClientId = Clients.Id 
                    INNER JOIN Users ON Clients.UserId = Users.Id 
                    INNER JOIN Locations ON Locations.Id = InsurancePolicies.LocationId 
                    LEFT JOIN Partners ON Partners.Id = InsurancePolicies.PartnerId 
                    INNER JOIN PolicyTypes ON PolicyTypes.Id = InsurancePolicies.PolicyTypeId 
                    INNER JOIN InsuranceCompanies ON InsurancePolicies.InsuranceCompanyId = InsuranceCompanies.Id 
                    WHERE (InsurancePolicies.IsActive = 1 OR InsurancePolicies.IsActive IS NULL)
                    AND YEAR(InsurancePolicies.StartingDate) = @SelectedYear ");

                await FilteringQuery(filter, queryBuilder);

                using (SqlCommand cmd = new SqlCommand(queryBuilder.ToString(), conn))
                {
                    cmd.Parameters.AddWithValue("@SelectedYear", filter.Year.ToString());

                    return (int)await cmd.ExecuteScalarAsync();
                }
            }
        }

        /// <summary>
        /// Creates a new insurance policy in the database.
        /// </summary>
        /// <param name="clientId"></param>
        /// <param name="insurancePolicy"></param>
        /// <returns></returns>
        public async Task<bool> AddInsurancePolicyAsync(Guid clientId, PolicyRequest insurancePolicy, Guid createdBy)
        {
            using (SqlConnection conn = new SqlConnection(_connectionString))
            {
                string insurancePolicyQuery = "INSERT INTO \"InsurancePolicies\" " +
                    "(Id, PolicyNumber, Price, Remark, ClientId, LocationId, InsuranceCompanyId, PolicyTypeId, PartnerId, StatusId, StartingDate, DateCreated, PreviousPolicyNumber, IsRenewed, CreatedBy) " +
                    "VALUES (@Id, @PolicyNumber, @Price, @Remark, @ClientId, @LocationId, " +
                    "@InsuranceCompanyId, @PolicyTypeId, @PartnerId, @StatusId, @StartingDate, @DateCreated, @PreviousPolicyNumber, @IsRenewed, @CreatedBy)";

                SqlCommand sqlCommand = new SqlCommand(insurancePolicyQuery, conn);
                sqlCommand.Parameters.AddWithValue("@Id", Guid.NewGuid());
                sqlCommand.Parameters.AddWithValue("@PolicyNumber", insurancePolicy.PolicyNumber);
                sqlCommand.Parameters.AddWithValue("@Price", insurancePolicy.Price);
                sqlCommand.Parameters.AddWithValue("@Remark", (object)insurancePolicy.Remark ?? DBNull.Value);
                sqlCommand.Parameters.AddWithValue("@ClientId", clientId);
                sqlCommand.Parameters.AddWithValue("@LocationId", await _locationRepository.GetLocationIdByNameAsync(insurancePolicy.Location));
                sqlCommand.Parameters.AddWithValue("@InsuranceCompanyId", await _insuranceCompanyRepository.GetCompanyIdByName(insurancePolicy.InsuranceCompany));
                sqlCommand.Parameters.AddWithValue("@PolicyTypeId", await _policyTypeRepository.GetPolicyTypeIdByName(insurancePolicy.InsuranceType));
                sqlCommand.Parameters.AddWithValue("@PartnerId", await _partnerRepository.GetPartnerIdByName(insurancePolicy.Partner));
                sqlCommand.Parameters.AddWithValue("@StatusId", await _statusRepository.GetIdByName("Aktivno")); // novo unesena polica mora vrijediti, nigdje se status ne provjerava
                sqlCommand.Parameters.AddWithValue("@StartingDate", insurancePolicy.StartingDate);
                sqlCommand.Parameters.AddWithValue("@DateCreated", DateTime.Now);
                sqlCommand.Parameters.AddWithValue("@PreviousPolicyNumber", DBNull.Value);
                sqlCommand.Parameters.AddWithValue("@IsRenewed", false);
                sqlCommand.Parameters.AddWithValue("@CreatedBy", createdBy);

                await conn.OpenAsync();

                using (SqlTransaction tran = conn.BeginTransaction())
                {
                    sqlCommand.Transaction = tran;

                    try
                    {
                        int rowsAffected = await sqlCommand.ExecuteNonQueryAsync();
                        tran.Commit();

                        return rowsAffected > 0;
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
        /// Renews an existing insurance policy by creating a new policy record in the database with a reference to the previous policy number. 
        /// It also updates the previous policy's "IsRenewed" status to true. This method ensures that both operations are performed within a transaction to maintain data integrity.
        /// </summary>
        /// <param name="insurancePolicy"></param>
        /// <param name="previousPolicyNumber"></param>
        /// <returns></returns>
        public async Task<bool> RenewInsurancePolicyAsync(RenewPolicyRequest insurancePolicy, Guid createdBy)
        {
            using (SqlConnection conn = new SqlConnection(_connectionString))
            {
                await conn.OpenAsync();

                using (SqlTransaction tran = conn.BeginTransaction())
                {
                    try
                    {
                        string insertQuery = "INSERT INTO \"InsurancePolicies\" " +
                            "(Id, PolicyNumber, Price, Remark, ClientId, LocationId, InsuranceCompanyId, PolicyTypeId, PartnerId, StatusId, StartingDate, DateCreated, PreviousPolicyNumber, IsRenewed, CreatedBy) " +
                            "VALUES (@Id, @PolicyNumber, @Price, @Remark, @ClientId, @LocationId, " +
                            "@InsuranceCompanyId, @PolicyTypeId, @PartnerId, @StatusId, @StartingDate, @DateCreated, @PreviousPolicyNumber, @IsRenewed, @CreatedBy)";

                        using SqlCommand insertCmd = new SqlCommand(insertQuery, conn, tran);
                        insertCmd.Parameters.AddWithValue("@Id", Guid.NewGuid());
                        insertCmd.Parameters.AddWithValue("@PolicyNumber", insurancePolicy.Policy.PolicyNumber);
                        insertCmd.Parameters.AddWithValue("@Price", insurancePolicy.Policy.Price);
                        insertCmd.Parameters.AddWithValue("@Remark", (object)insurancePolicy.Policy.Remark ?? DBNull.Value);
                        insertCmd.Parameters.AddWithValue("@ClientId", insurancePolicy.ClientId);
                        insertCmd.Parameters.AddWithValue("@LocationId", await _locationRepository.GetLocationIdByNameAsync(insurancePolicy.Policy.Location));
                        insertCmd.Parameters.AddWithValue("@InsuranceCompanyId", await _insuranceCompanyRepository.GetCompanyIdByName(insurancePolicy.Policy.InsuranceCompany));
                        insertCmd.Parameters.AddWithValue("@PolicyTypeId", await _policyTypeRepository.GetPolicyTypeIdByName(insurancePolicy.Policy.InsuranceType));
                        insertCmd.Parameters.AddWithValue("@PartnerId", await _partnerRepository.GetPartnerIdByName(insurancePolicy.Policy.Partner));
                        insertCmd.Parameters.AddWithValue("@StatusId", await _statusRepository.GetIdByName("Aktivno"));
                        insertCmd.Parameters.AddWithValue("@StartingDate", insurancePolicy.Policy.StartingDate);
                        insertCmd.Parameters.AddWithValue("@DateCreated", DateTime.Now);
                        insertCmd.Parameters.AddWithValue("@PreviousPolicyNumber", insurancePolicy.Policy.PreviousPolicyNumber);
                        // In this case, PreviousPolicyNumber is the current policy number, but that policy is being renewed, not the new one, so it becomes the previous policy number for the new record
                        insertCmd.Parameters.AddWithValue("@IsRenewed", false);
                        insertCmd.Parameters.AddWithValue("@CreatedBy", createdBy);

                        await insertCmd.ExecuteNonQueryAsync();

                        string updateQuery = "UPDATE InsurancePolicies SET IsRenewed = 1 WHERE PolicyNumber = @PreviousPolicyNumber";

                        using SqlCommand updateCmd = new SqlCommand(updateQuery, conn, tran);
                        updateCmd.Parameters.AddWithValue("@PreviousPolicyNumber", insurancePolicy.Policy.PreviousPolicyNumber);

                        await updateCmd.ExecuteNonQueryAsync();

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
        /// Updates the details of an existing insurance policy in the database. This method takes an UpdatePolicyRequest object which contains the updated information for the policy, including its unique identifier (PolicyId).
        /// </summary>
        /// <param name="insurancePolicy"></param>
        /// <returns></returns>
        public async Task<bool> UpdatePolicyAsync(UpdatePolicyRequest insurancePolicy)
        {
            using (SqlConnection conn = new SqlConnection(_connectionString))
            {
                await conn.OpenAsync();

                string query = @"
                    UPDATE InsurancePolicies
                    SET 
                        PolicyNumber = @PolicyNumber,
                        Price = @Price,
                        Remark = @Remark,
                        InsuranceCompanyId = @InsuranceCompanyId,
                        PartnerId = @PartnerId,
                        StartingDate = @StartingDate,
                        LocationId = @LocationId,
                        PolicyTypeId = @PolicyTypeId
                    WHERE ID = @ID";

                using (SqlCommand cmd = new SqlCommand(query, conn))
                {
                    Guid insuranceCompanyId = await _insuranceCompanyRepository.GetCompanyIdByName(insurancePolicy.Policy.InsuranceCompany);
                    Guid partnerId = await _partnerRepository.GetPartnerIdByName(insurancePolicy.Policy.Partner);
                    Guid locationId = await _locationRepository.GetLocationIdByNameAsync(insurancePolicy.Policy.Location);
                    Guid policyTypeId = await _policyTypeRepository.GetPolicyTypeIdByName(insurancePolicy.Policy.InsuranceType);

                    // Add parameters
                    cmd.Parameters.AddWithValue("@PolicyNumber", insurancePolicy.Policy.PolicyNumber);
                    cmd.Parameters.AddWithValue("@Price", insurancePolicy.Policy.Price);
                    cmd.Parameters.AddWithValue("@Remark", insurancePolicy.Policy.Remark ?? string.Empty);
                    cmd.Parameters.AddWithValue("@InsuranceCompanyId", insuranceCompanyId);
                    cmd.Parameters.AddWithValue("@PartnerId", partnerId);
                    cmd.Parameters.AddWithValue("@StartingDate", insurancePolicy.Policy.StartingDate);
                    cmd.Parameters.AddWithValue("@LocationId", locationId);
                    cmd.Parameters.AddWithValue("@PolicyTypeId", policyTypeId);
                    cmd.Parameters.AddWithValue("@ID", insurancePolicy.PolicyId);

                    int rowsAffected = await cmd.ExecuteNonQueryAsync();
                    return rowsAffected > 0;
                }
            }
        }

        /// <summary>
        /// Deletes an insurance policy from the database. 
        /// If the deleted policy has a previous policy number (i.e., it is a renewal of another policy), this method also updates the previous policy's "IsRenewed" status to false, indicating that it is no longer renewed.
        /// </summary>
        /// <param name="policyId"></param>
        /// <returns></returns>
        public async Task<bool> DeleteInsurancePolicyAsync(Guid policyId, Guid deletedBy, string deleteReason, string deleteComment)
        {
            using (SqlConnection conn = new SqlConnection(_connectionString))
            {
                await conn.OpenAsync();

                using (SqlTransaction tran = conn.BeginTransaction())
                {
                    try
                    {
                        string selectQuery = @"
                            SELECT PreviousPolicyNumber
                            FROM InsurancePolicies
                            WHERE Id = @PolicyId";

                        string previousPolicyNumber = null;

                        using (SqlCommand selectCmd = new SqlCommand(selectQuery, conn, tran))
                        {
                            selectCmd.Parameters.AddWithValue("@PolicyId", policyId);
                            object result = await selectCmd.ExecuteScalarAsync();
                            previousPolicyNumber = (result == DBNull.Value || result == null) ? null : result.ToString();
                        }

                        string softDeleteQuery = @"
                            UPDATE InsurancePolicies
                            SET IsActive = 0,
                                DeletedBy = @DeletedBy,
                                DeletedAt = GETDATE(),
                                DeleteReason = @DeleteReason,
                                DeleteComment = @DeleteComment
                            WHERE Id = @PolicyId";

                        using (SqlCommand deleteCmd = new SqlCommand(softDeleteQuery, conn, tran))
                        {
                            deleteCmd.Parameters.AddWithValue("@PolicyId", policyId);
                            deleteCmd.Parameters.AddWithValue("@DeletedBy", deletedBy);
                            deleteCmd.Parameters.AddWithValue("@DeleteReason", (object)deleteReason ?? DBNull.Value);
                            deleteCmd.Parameters.AddWithValue("@DeleteComment", (object)deleteComment ?? DBNull.Value);
                            await deleteCmd.ExecuteNonQueryAsync();
                        }

                        if (!string.IsNullOrEmpty(previousPolicyNumber))
                        {
                            string updateQuery = @"
                                UPDATE InsurancePolicies
                                SET IsRenewed = 0
                                WHERE PolicyNumber = @PreviousPolicyNumber";

                            using (SqlCommand updateCmd = new SqlCommand(updateQuery, conn, tran))
                            {
                                updateCmd.Parameters.AddWithValue("@PreviousPolicyNumber", previousPolicyNumber);
                                await updateCmd.ExecuteNonQueryAsync();
                            }
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

        public async Task<List<DeletedPolicyView>> GetDeletedPoliciesAsync()
        {
            const string query = @"
                SELECT
                    IP.Id,
                    IP.PolicyNumber,
                    IP.StartingDate,
                    IP.Price,
                    IP.DeletedAt,
                    IP.DeleteReason,
                    IP.DeleteComment,
                    DATEDIFF(DAY, IP.DeletedAt, DATEADD(DAY, 30, IP.DeletedAt)) -
                        DATEDIFF(DAY, IP.DeletedAt, GETDATE()) AS DaysUntilPermanentDelete,
                    U.Name AS ClientName,
                    IC.Name AS InsuranceCompany,
                    PT.Type AS PolicyType,
                    L.Name AS Location,
                    DU.Name AS DeletedByName
                FROM InsurancePolicies IP
                INNER JOIN Clients C ON C.Id = IP.ClientId
                INNER JOIN Users U ON U.Id = C.UserId
                INNER JOIN InsuranceCompanies IC ON IC.Id = IP.InsuranceCompanyId
                INNER JOIN PolicyTypes PT ON PT.Id = IP.PolicyTypeId
                INNER JOIN Locations L ON L.Id = IP.LocationId
                LEFT JOIN Agents DA ON DA.Id = IP.DeletedBy
                LEFT JOIN Users DU ON DU.Id = DA.UserId
                WHERE IP.IsActive = 0
                AND IP.DeletedAt >= DATEADD(DAY, -30, GETDATE())
                ORDER BY IP.DeletedAt DESC";

            var result = new List<DeletedPolicyView>();
            using var conn = new SqlConnection(_connectionString);
            await conn.OpenAsync();
            using var cmd = new SqlCommand(query, conn);
            using var reader = await cmd.ExecuteReaderAsync();
            while (await reader.ReadAsync())
            {
                result.Add(new DeletedPolicyView
                {
                    Id = (Guid)reader["Id"],
                    PolicyNumber = reader["PolicyNumber"].ToString(),
                    ClientName = reader["ClientName"].ToString(),
                    InsuranceCompany = reader["InsuranceCompany"].ToString(),
                    PolicyType = reader["PolicyType"].ToString(),
                    StartingDate = (DateTime)reader["StartingDate"],
                    Price = (decimal)reader["Price"],
                    Location = reader["Location"].ToString(),
                    DeletedAt = (DateTime)reader["DeletedAt"],
                    DeletedByName = reader["DeletedByName"] == DBNull.Value ? null : reader["DeletedByName"].ToString(),
                    DeleteReason = reader["DeleteReason"] == DBNull.Value ? null : reader["DeleteReason"].ToString(),
                    DeleteComment = reader["DeleteComment"] == DBNull.Value ? null : reader["DeleteComment"].ToString(),
                    DaysUntilPermanentDelete = (int)reader["DaysUntilPermanentDelete"],
                });
            }
            return result;
        }

        public async Task<DeletedPolicyView> GetDeletedPolicyByIdAsync(Guid policyId)
        {
            const string query = @"
                SELECT
                    IP.Id,
                    IP.PolicyNumber,
                    IP.StartingDate,
                    IP.Price,
                    IP.DeletedAt,
                    IP.DeleteReason,
                    IP.DeleteComment,
                    DATEDIFF(DAY, GETDATE(), DATEADD(DAY, 30, IP.DeletedAt)) AS DaysUntilPermanentDelete,
                    C.OIB AS Oib,
                    C.DateOfBirth,
                    C.PhoneNumber,
                    C.MailAddress,
                    U.Name AS ClientName,
                    IC.Name AS InsuranceCompany,
                    PT.Type AS PolicyType,
                    L.Name AS Location,
                    P.Name AS Partner,
                    DU.Name AS DeletedByName
                FROM InsurancePolicies IP
                INNER JOIN Clients C ON C.Id = IP.ClientId
                INNER JOIN Users U ON U.Id = C.UserId
                INNER JOIN InsuranceCompanies IC ON IC.Id = IP.InsuranceCompanyId
                INNER JOIN PolicyTypes PT ON PT.Id = IP.PolicyTypeId
                INNER JOIN Locations L ON L.Id = IP.LocationId
                LEFT JOIN Partners P ON P.Id = IP.PartnerId
                LEFT JOIN Agents DA ON DA.Id = IP.DeletedBy
                LEFT JOIN Users DU ON DU.Id = DA.UserId
                WHERE IP.Id = @PolicyId AND IP.IsActive = 0";

            using var conn = new SqlConnection(_connectionString);
            await conn.OpenAsync();
            using var cmd = new SqlCommand(query, conn);
            cmd.Parameters.AddWithValue("@PolicyId", policyId);
            using var reader = await cmd.ExecuteReaderAsync();
            if (!await reader.ReadAsync()) return null;
            return new DeletedPolicyView
            {
                Id = (Guid)reader["Id"],
                PolicyNumber = reader["PolicyNumber"].ToString(),
                ClientName = reader["ClientName"].ToString(),
                InsuranceCompany = reader["InsuranceCompany"].ToString(),
                PolicyType = reader["PolicyType"].ToString(),
                StartingDate = (DateTime)reader["StartingDate"],
                Price = (decimal)reader["Price"],
                Location = reader["Location"].ToString(),
                Oib = reader["Oib"] == DBNull.Value ? null : reader["Oib"].ToString(),
                DateOfBirth = reader["DateOfBirth"] == DBNull.Value ? null : (DateTime?)reader["DateOfBirth"],
                PhoneNumber = reader["PhoneNumber"] == DBNull.Value ? null : reader["PhoneNumber"].ToString(),
                MailAddress = reader["MailAddress"] == DBNull.Value ? null : reader["MailAddress"].ToString(),
                Partner = reader["Partner"] == DBNull.Value ? null : reader["Partner"].ToString(),
                DeletedAt = (DateTime)reader["DeletedAt"],
                DeletedByName = reader["DeletedByName"] == DBNull.Value ? null : reader["DeletedByName"].ToString(),
                DeleteReason = reader["DeleteReason"] == DBNull.Value ? null : reader["DeleteReason"].ToString(),
                DeleteComment = reader["DeleteComment"] == DBNull.Value ? null : reader["DeleteComment"].ToString(),
                DaysUntilPermanentDelete = (int)reader["DaysUntilPermanentDelete"],
            };
        }

        public async Task<bool> RestorePolicyAsync(Guid policyId)
        {
            const string query = @"
                UPDATE InsurancePolicies
                SET IsActive = 1,
                    DeletedBy = NULL,
                    DeletedAt = NULL,
                    DeleteReason = NULL,
                    DeleteComment = NULL
                WHERE Id = @PolicyId AND IsActive = 0";

            using var conn = new SqlConnection(_connectionString);
            await conn.OpenAsync();
            using var cmd = new SqlCommand(query, conn);
            cmd.Parameters.AddWithValue("@PolicyId", policyId);
            return await cmd.ExecuteNonQueryAsync() > 0;
        }

        /// <summary>
        /// Compares the number of insurance policies created in a specified year with the previous year and calculates the percentage change.
        /// Does not consider policies that have a starting date in the future, ensuring that only active policies up to the current date are included in the comparison.
        /// </summary>
        /// <param name="year"></param>
        /// <returns></returns>
        public async Task<(int currentYear, double percentageChange)> GetYearlyPolicyCountComparisonAsync(int year)
        {
            using (SqlConnection conn = new SqlConnection(_connectionString))
            {
                await conn.OpenAsync();

                string query = @"
                    SELECT
                        SUM(CASE WHEN YEAR(DateCreated) = @Year 
                            AND DateCreated <= @Today THEN 1 ELSE 0 END) AS CurrentYear,
                        SUM(CASE WHEN YEAR(DateCreated) = @PreviousYear 
                            AND DateCreated <= @TodayLastYear THEN 1 ELSE 0 END) AS PreviousYear
                    FROM InsurancePolicies";

                using (SqlCommand cmd = new SqlCommand(query, conn))
                {
                    cmd.Parameters.AddWithValue("@Year", year);
                    cmd.Parameters.AddWithValue("@PreviousYear", year - 1);
                    cmd.Parameters.AddWithValue("@Today", DateTime.Today);
                    cmd.Parameters.AddWithValue("@TodayLastYear", new DateTime(year - 1, DateTime.Today.Month, DateTime.Today.Day));

                    using (SqlDataReader reader = await cmd.ExecuteReaderAsync())
                    {
                        if (await reader.ReadAsync())
                        {
                            int currentYear = Convert.ToInt32(reader["CurrentYear"]);
                            int previousYear = Convert.ToInt32(reader["PreviousYear"]);

                            double percentageChange = 0;
                            if (previousYear > 0)
                                percentageChange = Math.Round((double)(currentYear - previousYear) / previousYear * 100, 2);

                            return (currentYear, percentageChange);
                        }
                    }
                }
            }

            return (0, 0);
        }

        /// <summary>
        /// Fetches the number of insurance policies entered today and compares it to the average number of policies entered per day, calculating the percentage difference.
        /// </summary>
        /// <returns></returns>
        public async Task<(int todaysPolicies, double dayComparison)> GetTodaysEnteredPoliciesStatisticsAsync()
        {
            using (SqlConnection conn = new SqlConnection(_connectionString))
            {
                await conn.OpenAsync();

                string query = @"
                    SELECT
                        SUM(CASE WHEN CONVERT(DATE, DateCreated) = CONVERT(DATE, GETDATE()) THEN 1 ELSE 0 END) AS TodaysPolicies,
                        COUNT(*) * 1.0 / COUNT(DISTINCT CONVERT(DATE, DateCreated)) AS AvgPoliciesPerDay
                    FROM InsurancePolicies
                    WHERE YEAR(DateCreated) = @Year";

                using (SqlCommand cmd = new SqlCommand(query, conn))
                {
                    cmd.Parameters.AddWithValue("@Year", DateTime.Today.Year);

                    using (SqlDataReader reader = await cmd.ExecuteReaderAsync())
                    {
                        if (await reader.ReadAsync())
                        {
                            int todaysPolicies = Convert.ToInt32(reader["TodaysPolicies"]);
                            double avgPerDay = reader["AvgPoliciesPerDay"] == DBNull.Value ? 0 : Convert.ToDouble(reader["AvgPoliciesPerDay"]);

                            double dayComparison = 0;
                            if (avgPerDay > 0)
                                dayComparison = Math.Round((todaysPolicies - avgPerDay) / avgPerDay * 100, 2);

                            return (todaysPolicies, dayComparison);
                        }
                    }
                }
            }

            return (0, 0);
        }

        /// <summary>
        /// Calculates the total sum of premiums for insurance policies that were created today and this year.
        /// </summary>
        /// <returns></returns>
        public async Task<(decimal TodaysSum, decimal YearlySum)> GetPremiumSumsAsync(int year)
        {
            using (SqlConnection conn = new SqlConnection(_connectionString))
            {
                await conn.OpenAsync();

                string query = @"
                    SELECT
                        SUM(CASE WHEN CONVERT(DATE, DateCreated) = CONVERT(DATE, GETDATE()) THEN Price ELSE 0 END) AS TodaysSum,
                        SUM(CASE WHEN YEAR(DateCreated) = @Year THEN Price ELSE 0 END) AS YearlySum
                    FROM InsurancePolicies";

                using (SqlCommand cmd = new SqlCommand(query, conn))
                {
                    cmd.Parameters.AddWithValue("@Year", year);

                    using (SqlDataReader reader = await cmd.ExecuteReaderAsync())
                    {
                        if (await reader.ReadAsync())
                        {
                            return (
                                reader["TodaysSum"] == DBNull.Value ? 0 : Convert.ToDecimal(reader["TodaysSum"]),
                                reader["YearlySum"] == DBNull.Value ? 0 : Convert.ToDecimal(reader["YearlySum"])
                            );
                        }
                    }
                }
            }

            return (0, 0);
        }

        /// <summary>
        /// Fetches a paginated list of insurance policies that were entered today.
        /// </summary>
        /// <param name="paging"></param>
        /// <param name="filter"></param>
        /// <returns></returns>
        public async Task<List<TodayEnteredPolicies>> GetTodaysInsurancePoliciesAsync(Paging paging, DailyStatisticsFiltering filter)
        {
            List<TodayEnteredPolicies> insurancePolicies = new List<TodayEnteredPolicies>();

            using (SqlConnection conn = new SqlConnection(_connectionString))
            {
                await conn.OpenAsync();

                StringBuilder queryBuilder = new StringBuilder("SELECT InsurancePolicies.IsRenewed, " +
                                "InsuranceCompanies.Name AS InsuranceName, " +
                                "Users.Name AS ClientName, " +
                                "InsurancePolicies.StartingDate, " +
                                "InsurancePolicies.PolicyNumber, " +
                                "InsurancePolicies.Price, " +
                                "Locations.Name AS Location, " +
                                "Partners.Name AS Partner, " +
                                "InsurancePolicies.PreviousPolicyNumber, " +
                                "CreatorUser.Name AS AgentName " +
                                "FROM InsurancePolicies " +
                                "INNER JOIN Locations ON InsurancePolicies.LocationId = Locations.Id " +
                                "INNER JOIN Clients ON InsurancePolicies.ClientId = Clients.Id " +
                                "INNER JOIN Users ON Clients.UserId = Users.Id " +
                                "LEFT JOIN Partners ON Partners.Id = InsurancePolicies.PartnerId " +
                                "INNER JOIN InsuranceCompanies ON InsurancePolicies.InsuranceCompanyId = InsuranceCompanies.Id " +
                                "LEFT JOIN Agents AS CreatorAgent ON CreatorAgent.Id = InsurancePolicies.CreatedBy " +
                                "LEFT JOIN Users AS CreatorUser ON CreatorUser.Id = CreatorAgent.UserId " +
                                "WHERE (InsurancePolicies.IsActive = 1 OR InsurancePolicies.IsActive IS NULL) AND CONVERT(DATE, InsurancePolicies.DateCreated) = @Today ");

                await TodaysInsurancePoliciesFilter(filter, queryBuilder);

                // Ensure there is an ORDER BY clause
                queryBuilder.Append(" ORDER BY InsurancePolicies.DateCreated DESC "); // Order by newest first
                queryBuilder.Append(" OFFSET @Offset ROWS FETCH NEXT @PageSize ROWS ONLY ");

                using (SqlCommand cmd = new SqlCommand(queryBuilder.ToString(), conn))
                {
                    cmd.Parameters.AddWithValue("@Today", DateTime.Today);
                    cmd.Parameters.AddWithValue("@Offset", (paging.PageNumber - 1) * paging.PageSize);
                    cmd.Parameters.AddWithValue("@PageSize", paging.PageSize);

                    using (SqlDataReader reader = await cmd.ExecuteReaderAsync())
                    {
                        while (await reader.ReadAsync())
                        {
                            insurancePolicies.Add(new TodayEnteredPolicies(
                                reader["PolicyNumber"].ToString(),
                                reader["ClientName"].ToString(),
                                reader["InsuranceName"].ToString(),
                                (DateTime)reader["StartingDate"],
                                (decimal)reader["Price"],
                                reader["Location"].ToString(),
                                (bool)reader["IsRenewed"],
                                reader["PreviousPolicyNumber"] == DBNull.Value ? string.Empty : reader["PreviousPolicyNumber"].ToString(),
                                reader["Partner"] == DBNull.Value ? string.Empty : reader["Partner"].ToString()
                            ) { AgentName = reader["AgentName"] == DBNull.Value ? null : reader["AgentName"].ToString() });
                        }
                    }
                }
            }

            return insurancePolicies;
        }

        public async Task<TodayEnteredPolicies> GetLatestEnteredPolicyAsync()
        {
            const string query = @"
                SELECT TOP 1
                    IP.PolicyNumber,
                    IP.IsRenewed,
                    IP.StartingDate,
                    IP.DateCreated,
                    IP.Price,
                    IP.PreviousPolicyNumber,
                    IC.Name AS InsuranceName,
                    PT.Type AS PolicyType,
                    U.Name AS ClientName,
                    L.Name AS Location,
                    P.Name AS Partner,
                    CU.Name AS AgentName
                FROM InsurancePolicies IP
                INNER JOIN Locations L ON L.Id = IP.LocationId
                INNER JOIN Clients C ON C.Id = IP.ClientId
                INNER JOIN Users U ON U.Id = C.UserId
                LEFT JOIN Partners P ON P.Id = IP.PartnerId
                INNER JOIN InsuranceCompanies IC ON IC.Id = IP.InsuranceCompanyId
                INNER JOIN PolicyTypes PT ON PT.Id = IP.PolicyTypeId
                LEFT JOIN Agents CA ON CA.Id = IP.CreatedBy
                LEFT JOIN Users CU ON CU.Id = CA.UserId
                ORDER BY IP.DateCreated DESC";

            using var conn = new SqlConnection(_connectionString);
            await conn.OpenAsync();
            using var cmd = new SqlCommand(query, conn);
            using var reader = await cmd.ExecuteReaderAsync();

            if (!await reader.ReadAsync())
                return null;

            return new TodayEnteredPolicies(
                reader["PolicyNumber"].ToString(),
                reader["ClientName"].ToString(),
                reader["InsuranceName"].ToString(),
                (DateTime)reader["StartingDate"],
                (decimal)reader["Price"],
                reader["Location"].ToString(),
                (bool)reader["IsRenewed"],
                reader["PreviousPolicyNumber"] == DBNull.Value ? string.Empty : reader["PreviousPolicyNumber"].ToString(),
                reader["Partner"] == DBNull.Value ? string.Empty : reader["Partner"].ToString()
            )
            {
                AgentName = reader["AgentName"] == DBNull.Value ? null : reader["AgentName"].ToString(),
                PolicyType = reader["PolicyType"].ToString(),
                DateCreated = (DateTime)reader["DateCreated"],
            };
        }

        public async Task<(List<string> Agents, List<string> Locations)> GetTodaysFilterOptionsAsync()
        {
            var agents = new HashSet<string>(StringComparer.OrdinalIgnoreCase);
            var locations = new HashSet<string>(StringComparer.OrdinalIgnoreCase);

            string query = @"
                SELECT DISTINCT
                    COALESCE(NULLIF(Partners.Name, ''), Users.Name) AS Agent,
                    Locations.Name AS Location
                FROM InsurancePolicies
                INNER JOIN Locations ON InsurancePolicies.LocationId = Locations.Id
                INNER JOIN Clients ON InsurancePolicies.ClientId = Clients.Id
                INNER JOIN Users ON Clients.UserId = Users.Id
                LEFT JOIN Partners ON Partners.Id = InsurancePolicies.PartnerId
                INNER JOIN InsuranceCompanies ON InsurancePolicies.InsuranceCompanyId = InsuranceCompanies.Id
                WHERE CONVERT(DATE, InsurancePolicies.DateCreated) = @Today";

            using (SqlConnection conn = new SqlConnection(_connectionString))
            {
                await conn.OpenAsync();
                using (SqlCommand cmd = new SqlCommand(query, conn))
                {
                    cmd.Parameters.AddWithValue("@Today", DateTime.Today);
                    using (SqlDataReader reader = await cmd.ExecuteReaderAsync())
                    {
                        while (await reader.ReadAsync())
                        {
                            var agent = reader["Agent"]?.ToString();
                            var location = reader["Location"]?.ToString();
                            if (!string.IsNullOrWhiteSpace(agent)) agents.Add(agent);
                            if (!string.IsNullOrWhiteSpace(location)) locations.Add(location);
                        }
                    }
                }
            }

            return (agents.OrderBy(a => a).ToList(), locations.OrderBy(l => l).ToList());
        }

        /// <summary>
        /// Fetches the total count of insurance policies that were entered today and match the specified filtering criteria.
        /// This method is used in conjunction with the GetTodaysInsurancePoliciesAsync method to provide pagination information for the filtered list of today's policies.
        /// </summary>
        /// <param name="filter"></param>
        /// <returns></returns>
        public async Task<int> GetTotalFilteredPoliciesCountAsync(DailyStatisticsFiltering filter)
        {
            int totalCount = 0;

            using (SqlConnection conn = new SqlConnection(_connectionString))
            {
                await conn.OpenAsync();

                StringBuilder queryBuilder = new StringBuilder(@"
                    SELECT COUNT(*) AS NumberOfFilteredPolicies
                    FROM InsurancePolicies
                    INNER JOIN Locations ON InsurancePolicies.LocationId = Locations.Id
                    INNER JOIN Clients ON InsurancePolicies.ClientId = Clients.Id
                    INNER JOIN Users ON Clients.UserId = Users.Id
                    LEFT JOIN Partners ON Partners.Id = InsurancePolicies.PartnerId
                    INNER JOIN InsuranceCompanies ON InsurancePolicies.InsuranceCompanyId = InsuranceCompanies.Id
                    WHERE (InsurancePolicies.IsActive = 1 OR InsurancePolicies.IsActive IS NULL)
                    AND CONVERT(DATE, InsurancePolicies.DateCreated) = @Today
                ");

                await TodaysInsurancePoliciesFilter(filter, queryBuilder);

                using (SqlCommand cmd = new SqlCommand(queryBuilder.ToString(), conn))
                {
                    cmd.Parameters.AddWithValue("@Today", DateTime.Today);
                    totalCount = (int)await cmd.ExecuteScalarAsync();
                }
            }

            return totalCount;
        }

        /// <summary>
        /// Appends filtering conditions to the provided SQL query builder based on the properties of the DailyStatisticsFiltering object.
        /// </summary>
        /// <param name="filter"></param>
        /// <param name="queryBuilder"></param>
        /// <returns></returns>
        private async Task TodaysInsurancePoliciesFilter(DailyStatisticsFiltering filter, StringBuilder queryBuilder)
        {
            if (!string.IsNullOrEmpty(filter.Search))
            {
                queryBuilder.Append(" AND (InsurancePolicies.PolicyNumber LIKE '%" + filter.Search + "%' OR Users.Name LIKE '%" + filter.Search + "%') ");
            }

            if (!string.IsNullOrWhiteSpace(filter.AgentName))
            {
                queryBuilder.Append(" AND (Users.Name = N'" + filter.AgentName + "' OR Partners.Name = N'" + filter.AgentName + "') ");
            }

            if (!string.IsNullOrWhiteSpace(filter.Location))
            {
                queryBuilder.Append(" AND Locations.Name = N'" + filter.Location + "' ");
            }

            await Task.CompletedTask;
        }

        /// <summary>
        /// Fetches a list of the top 6 partners based on the number of insurance policies they have sold in the current year.
        /// </summary>
        /// <returns></returns>
        public async Task<List<PartnerPolicyCount>> GetTopPartnersByPolicyCountAsync(int year)
        {
            var results = new List<PartnerPolicyCount>();

            using (SqlConnection conn = new SqlConnection(_connectionString))
            {
                await conn.OpenAsync();

                string query = @"
                    SELECT TOP 6
                        Partners.Name AS PartnerName,
                        COUNT(InsurancePolicies.Id) AS PolicyCount
                    FROM InsurancePolicies
                    INNER JOIN Partners ON Partners.Id = InsurancePolicies.PartnerId
                    WHERE YEAR(InsurancePolicies.DateCreated) = @Year
                    GROUP BY Partners.Name
                    ORDER BY PolicyCount DESC";

                using (SqlCommand cmd = new SqlCommand(query, conn))
                {
                    cmd.Parameters.AddWithValue("@Year", year);
                    using (SqlDataReader reader = await cmd.ExecuteReaderAsync())
                    {
                        while (await reader.ReadAsync())
                        {
                            results.Add((new PartnerPolicyCount{
                                 PartnerName = reader["PartnerName"].ToString(),
                                 PolicyCount = Convert.ToInt32(reader["PolicyCount"])
                            }));
                        }
                    }
                }
            }

            return results;
        }

        /// <summary>
        /// Checks if an insurance policy with the specified policy number already exists in the database. 
        /// This method is used to prevent duplicate entries of insurance policies based on their unique policy numbers.
        /// </summary>
        /// <param name="policyNumber"></param>
        /// <returns></returns>
        public async Task<bool> InsurancePolicyExistsAsync(string policyNumber)
        {
            using (SqlConnection conn = new SqlConnection(_connectionString))
            {
                await conn.OpenAsync();

                string query = "SELECT TOP 1 1 FROM InsurancePolicies WHERE PolicyNumber = @PolicyNumber AND (IsActive = 1 OR IsActive IS NULL)";
                using (SqlCommand cmd = new SqlCommand(query, conn))
                {
                    cmd.Parameters.AddWithValue("@PolicyNumber", policyNumber);

                    object result = await cmd.ExecuteScalarAsync();

                    int count = result != null ? Convert.ToInt32(result) : 0;

                    return count > 0;
                }
            }
        }

        #region Statistics Helper Dropdown Methods

        /// <summary>
        /// Fetches the data needed to populate the insurance policies chart based on the specified period (e.g., daily, monthly, yearly) and year.
        /// </summary>
        /// <param name="period"></param>
        /// <param name="year"></param>
        /// <returns></returns>
        /// <exception cref="ArgumentException"></exception>
        public async Task<List<ChartDataItem>> GetPoliciesChartDataAsync(string period)
        {
            var (from, to) = GetStatisticsPeriod(period, DateTime.Today.AddDays(1));

            string groupBy = period switch
            {
                "month" => "WEEK",
                "ytd" or "year" => "MONTH",
                _ => "DAY"
            };

            string query = groupBy switch
            {
                "DAY" => @"
                    SELECT
                        CONVERT(VARCHAR, CONVERT(DATE, DateCreated), 105) AS Label,
                        COUNT(*) AS PolicyCount,
                        SUM(CASE WHEN PreviousPolicyNumber IS NULL OR PreviousPolicyNumber = '' THEN 1 ELSE 0 END) AS NewPoliciesCount,
                        SUM(CASE WHEN PreviousPolicyNumber IS NOT NULL AND PreviousPolicyNumber <> '' THEN 1 ELSE 0 END) AS RenewedPoliciesCount
                    FROM InsurancePolicies
                    WHERE DateCreated >= @From - 1 AND DateCreated < @To
                    GROUP BY CONVERT(DATE, DateCreated)
                    ORDER BY CONVERT(DATE, DateCreated)",

                "WEEK" => @"
                    SELECT
                        CONCAT('Tjedan ', DATEPART(WEEK, DateCreated) - DATEPART(WEEK, @From) + 1) AS Label,
                        COUNT(*) AS PolicyCount,
                        SUM(CASE WHEN PreviousPolicyNumber IS NULL OR PreviousPolicyNumber = '' THEN 1 ELSE 0 END) AS NewPoliciesCount,
                        SUM(CASE WHEN PreviousPolicyNumber IS NOT NULL AND PreviousPolicyNumber <> '' THEN 1 ELSE 0 END) AS RenewedPoliciesCount
                    FROM InsurancePolicies
                    WHERE DateCreated >= @From AND DateCreated < @To
                    GROUP BY DATEPART(WEEK, DateCreated)
                    ORDER BY DATEPART(WEEK, DateCreated)",

                "MONTH" => @"
                    SELECT
                        RIGHT('0' + CAST(MONTH(DateCreated) AS VARCHAR(2)), 2)
                        + '/' +
                        CAST(YEAR(DateCreated) AS VARCHAR(4)) AS Label,
                        COUNT(*) AS PolicyCount,
                        SUM(CASE WHEN PreviousPolicyNumber IS NULL OR PreviousPolicyNumber = '' THEN 1 ELSE 0 END) AS NewPoliciesCount,
                        SUM(CASE WHEN PreviousPolicyNumber IS NOT NULL AND PreviousPolicyNumber <> '' THEN 1 ELSE 0 END) AS RenewedPoliciesCount
                    FROM InsurancePolicies
                    WHERE DateCreated >= @From AND DateCreated < @To
                    GROUP BY YEAR(DateCreated), MONTH(DateCreated)
                    ORDER BY YEAR(DateCreated), MONTH(DateCreated)",

                _ => throw new ArgumentException("Nepoznati period: " + period)
            };

            var results = new List<ChartDataItem>();

            using (SqlConnection conn = new SqlConnection(_connectionString))
            {
                await conn.OpenAsync();

                using (SqlCommand cmd = new SqlCommand(query, conn))
                {
                    cmd.Parameters.AddWithValue("@From", from);
                    cmd.Parameters.AddWithValue("@To", to);

                    using (SqlDataReader reader = await cmd.ExecuteReaderAsync())
                    {
                        while (await reader.ReadAsync())
                        {
                            results.Add(new ChartDataItem
                            {
                                Label = (string)reader["Label"],
                                PolicyCount = Convert.ToInt32(reader["PolicyCount"]),
                                NewPoliciesCount = Convert.ToInt32(reader["NewPoliciesCount"]),
                                RenewedPoliciesCount = Convert.ToInt32(reader["RenewedPoliciesCount"]),
                            });
                        }
                    }
                }
            }

            return results;
        }

        /// <summary>
        /// Determines the date range for statistics based on the specified period (e.g., month, year-to-date, year) and year.
        /// </summary>
        /// <param name="period"></param>
        /// <param name="year"></param>
        /// <returns></returns>
        private static (DateTime From, DateTime To) GetStatisticsPeriod(string period, DateTime today)
        {
            return period switch
            {
                "month" => (
                    today.AddMonths(-1),
                    today
                ),

                "year" => (
                    today.AddYears(-1),
                    today
                ),

                "ytd" => (
                    new DateTime(today.Year, 1, 1),
                    today
                ),

                _ => (
                    today.AddDays(-7),
                    today.AddDays(1)
                )
            };
        }

        /// <summary>
        /// Fetches statistics about unrenewed insurance policies based on the specified period and year. 
        /// ?????? It retrieves the count of policies that were created within the defined date range and have not been renewed, as well as the total count of policies created in the same period, allowing for analysis of renewal rates and trends over time.
        /// </summary>
        /// <param name="period"></param>
        /// <param name="year"></param>
        /// <returns></returns>
        public async Task<ExpiringPolicyStats> GetUnrenewedPoliciesAsync(string period)
        {
            var (from, to) = GetStatisticsPeriod(period, DateTime.Today.AddYears(-1));

            return await GetPolicyStatsAsync(@"
                WHERE InsurancePolicies.IsRenewed = 0
                  AND InsurancePolicies.StartingDate >= @From
                  AND InsurancePolicies.StartingDate < @To", from, to);
        }

        /// <summary>
        /// Fetches statistics about insurance policies that are set to expire within the next 14 days.
        /// </summary>
        /// <returns></returns>
        public async Task<List<ExpiringPolicyStats>> GetExpiringPoliciesAsync()
        {
            List<ExpiringPolicyStats> results = new List<ExpiringPolicyStats>();

            using (SqlConnection conn = new SqlConnection(_connectionString))
            {
                await conn.OpenAsync();

                string query = "SELECT " +
                            "PolicyTypes.[Type] AS InsuranceType, " +
                            "COUNT(*) AS PolicyCount, " +
                            "COALESCE(SUM(Price), 0) AS TotalAmount " +
                                "FROM InsurancePolicies " +
                                "INNER JOIN PolicyTypes ON InsurancePolicies.PolicyTypeId = PolicyTypes.ID " +
                                "WHERE InsurancePolicies.StartingDate BETWEEN " +
                                    "CAST(DATEADD(YEAR, -1, CAST(GETDATE() AS DATE)) AS DATETIME) " +
                                "AND " +
                                    "CAST(DATEADD(DAY, 14, DATEADD(YEAR, -1, CAST(GETDATE() AS DATE))) AS DATETIME) " +
                                "AND ISNULL(IsRenewed, 0) <> 1 " +
                            "GROUP BY PolicyTypes.[Type] " +
                            "ORDER BY PolicyCount DESC";


                using (SqlCommand cmd = new SqlCommand(query, conn))
                {
                    using (SqlDataReader reader = await cmd.ExecuteReaderAsync())
                    {
                        while (await reader.ReadAsync())
                        {
                            results.Add(new ExpiringPolicyStats
                            {
                                Count = Convert.ToInt32(reader["PolicyCount"]),
                                PriceSum = Convert.ToDecimal(reader["TotalAmount"]),
                                PolicyType = reader["InsuranceType"].ToString()
                            });
                        }
                    }
                }
            }

            return results;
        }

        #endregion

        #region Webforms
        // ------------------- INSURANCE POLICY METHODS FROM WEBFORMS ------------------

        public async Task<bool> UpdateInsurancePolicyAsync(InsurancePolicyModelView insurancePolicy)
        {
            using (SqlConnection conn = new SqlConnection(_connectionString))
            {
                await conn.OpenAsync();

                string query = @"
                    UPDATE InsurancePolicies
                    SET 
                        Price = @Price,
                        Remark = @Remark,
                        InsuranceCompanyId = @InsuranceCompanyId,
                        PartnerId = @PartnerId,
                        StartingDate = @StartingDate,
                        LocationId = @LocationId,
                        PolicyTypeId = @PolicyTypeId,
                        PolicyNumber = @PolicyNumber
                    WHERE ID = @ID";

                using (SqlCommand cmd = new SqlCommand(query, conn))
                {
                    Guid insuranceCompanyId = await _insuranceCompanyRepository.GetCompanyIdByName(insurancePolicy.InsuranceCompany);
                    Guid partnerId = await _partnerRepository.GetPartnerIdByName(insurancePolicy.Partner);
                    Guid locationId = await _locationRepository.GetLocationIdByNameAsync(insurancePolicy.Location);
                    Guid policyTypeId = await _policyTypeRepository.GetPolicyTypeIdByName(insurancePolicy.InsuranceType);

                    // Add parameters
                    cmd.Parameters.AddWithValue("@PolicyNumber", insurancePolicy.PolicyNumber);
                    cmd.Parameters.AddWithValue("@Price", insurancePolicy.Price);
                    cmd.Parameters.AddWithValue("@InsuranceCompanyId", insuranceCompanyId);
                    cmd.Parameters.AddWithValue("@PartnerId", partnerId);
                    cmd.Parameters.AddWithValue("@StartingDate", insurancePolicy.StartingDate);
                    //cmd.Parameters.AddWithValue("@DateCreated", insurancePolicy.DateCreated);
                    cmd.Parameters.AddWithValue("@LocationId", locationId);
                    cmd.Parameters.AddWithValue("@PolicyTypeId", policyTypeId);
                    cmd.Parameters.AddWithValue("@ID", insurancePolicy.Id);

                    // Execute the query
                    int rowsAffected = await cmd.ExecuteNonQueryAsync();
                    return rowsAffected > 0;
                }
            }
        }

        public async Task<Guid> GetInsurancePolicyIdByPolicyNumberAsync(string policyNumber)
        {
            Guid returnValue = Guid.Empty;

            using (var conn = new SqlConnection(_connectionString))
            {
                await conn.OpenAsync();

                string queryString = "SELECT \"Id\" FROM \"InsurancePolicies\" WHERE PolicyNumber = @PolicyNumber";
                SqlCommand sqlCommand = new SqlCommand(queryString, conn);
                sqlCommand.Parameters.AddWithValue("@PolicyNumber", policyNumber);

                SqlDataReader reader = await sqlCommand.ExecuteReaderAsync();

                while (await reader.ReadAsync())
                {
                    returnValue = (Guid)reader["ID"];
                }
            }

            return returnValue;
        }

        public async Task<int> GetTodaysNumberOfPoliciesAsync()
        {
            using (SqlConnection conn = new SqlConnection(_connectionString))
            {
                await conn.OpenAsync();

                string query = "SELECT COUNT(*) AS PoliciesEnteredToday" +
                    " FROM InsurancePolicies" +
                    " WHERE CONVERT(DATE, DateCreated) = @Today;";

                using (SqlCommand cmd = new SqlCommand(query, conn))
                {
                    cmd.Parameters.AddWithValue("@Today", DateTime.Today);
                    return (int)await cmd.ExecuteScalarAsync();
                }
            }
        }

        public async Task<AgentStatsSummary> GetAgentSummaryAsync(Guid agentId)
        {
            const string query = @"
                DECLARE @AgentLocationId UNIQUEIDENTIFIER = (SELECT LocationId FROM Agents WHERE Id = @AgentId);
                DECLARE @AgentUserName NVARCHAR(200) = (SELECT U.Name FROM Agents A INNER JOIN Users U ON U.Id = A.UserId WHERE A.Id = @AgentId);

                SELECT
                    (SELECT COUNT(*)
                     FROM InsurancePolicies IP
                     INNER JOIN Partners P ON P.Id = IP.PartnerId
                     WHERE P.Name = @AgentUserName
                       AND YEAR(IP.DateCreated) = YEAR(GETDATE())
                       AND (IP.IsActive = 1 OR IP.IsActive IS NULL)) AS PartnerPoliciesYTD,

                    (SELECT COUNT(*)
                     FROM InsurancePolicies IP
                     WHERE IP.CreatedBy = @AgentId
                       AND CONVERT(DATE, IP.DateCreated) = CONVERT(DATE, GETDATE())
                       AND (IP.IsActive = 1 OR IP.IsActive IS NULL)) AS MyPoliciesToday,

                    (SELECT COUNT(*)
                     FROM InsurancePolicies IP
                     WHERE CONVERT(DATE, IP.DateCreated) = CONVERT(DATE, GETDATE())
                       AND (IP.IsActive = 1 OR IP.IsActive IS NULL)) AS AllPoliciesToday,

                    (SELECT COUNT(*)
                     FROM InsurancePolicies IP
                     WHERE IP.LocationId = @AgentLocationId
                       AND CONVERT(DATE, IP.DateCreated) = CONVERT(DATE, GETDATE())
                       AND (IP.IsActive = 1 OR IP.IsActive IS NULL)) AS LocationPoliciesToday";

            using var conn = new SqlConnection(_connectionString);
            await conn.OpenAsync();
            using var cmd = new SqlCommand(query, conn);
            cmd.Parameters.AddWithValue("@AgentId", agentId);
            using var reader = await cmd.ExecuteReaderAsync();
            if (!await reader.ReadAsync()) return new AgentStatsSummary();
            return new AgentStatsSummary
            {
                PartnerPoliciesYTD    = reader["PartnerPoliciesYTD"] == DBNull.Value ? 0 : (int)reader["PartnerPoliciesYTD"],
                MyPoliciesToday       = reader["MyPoliciesToday"] == DBNull.Value ? 0 : (int)reader["MyPoliciesToday"],
                AllPoliciesToday      = reader["AllPoliciesToday"] == DBNull.Value ? 0 : (int)reader["AllPoliciesToday"],
                LocationPoliciesToday = reader["LocationPoliciesToday"] == DBNull.Value ? 0 : (int)reader["LocationPoliciesToday"],
            };
        }

        public async Task<double> GetAverageNumberOfPoliciesPerDayAsync()
        {
            using (SqlConnection conn = new SqlConnection(_connectionString))
            {
                await conn.OpenAsync();

                string query = @"
                    SELECT 
                        COUNT(*) * 1.0 / COUNT(DISTINCT CONVERT(DATE, DateCreated)) AS AvgPoliciesPerDay
                    FROM InsurancePolicies
                    WHERE DateCreated >= DATEFROMPARTS(YEAR(GETDATE()), 1, 1);";

                using (SqlCommand cmd = new SqlCommand(query, conn))
                {
                    object result = await cmd.ExecuteScalarAsync();
                    if (result == DBNull.Value || result == null)
                        return 0;

                    return Math.Round(Convert.ToDouble(result), 2);
                }
            }
        }

        public async Task<Dictionary<string, int>> GetTodaysPoliciesForLocationsAsync(List<string> locationNames)
        {
            var results = locationNames.ToDictionary(name => name, _ => 0); // Ensure all locations are in the dictionary

            using (SqlConnection conn = new SqlConnection(_connectionString))
            {
                await conn.OpenAsync();

                string query = @"
                    SELECT L.Name AS LocationName, COUNT(IP.Id) AS PoliciesCount
                    FROM Locations L
                    LEFT JOIN InsurancePolicies IP ON L.Id = IP.LocationId 
                        AND CONVERT(DATE, IP.DateCreated) = @Today
                    WHERE L.Name IN (" + string.Join(",", locationNames.Select((_, i) => $"@Location{i}")) + @")
                    GROUP BY L.Name;";

                using (SqlCommand cmd = new SqlCommand(query, conn))
                {
                    cmd.Parameters.AddWithValue("@Today", DateTime.Today);
                    for (int i = 0; i < locationNames.Count; i++)
                    {
                        cmd.Parameters.AddWithValue($"@Location{i}", locationNames[i]);
                    }

                    using (SqlDataReader reader = await cmd.ExecuteReaderAsync())
                    {
                        while (await reader.ReadAsync())
                        {
                            string locationName = reader["LocationName"].ToString();
                            int count = reader.IsDBNull(1) ? 0 : Convert.ToInt32(reader["PoliciesCount"]);
                            results[locationName] = count;
                        }
                    }
                }
            }

            return results;
        }

        public async Task<List<LocationPolicyChartItem>> GetPolicyCountsByLocationAsync(string period, int year)
        {
            var results = new List<LocationPolicyChartItem>();

            using (SqlConnection conn = new SqlConnection(_connectionString))
            {
                await conn.OpenAsync();

                string query = @"
                    SELECT 
                        Locations.Name AS LocationName,
                        SUM(CASE WHEN InsurancePolicies.PreviousPolicyNumber IS NULL OR InsurancePolicies.PreviousPolicyNumber = '' THEN 1 ELSE 0 END) AS NewPoliciesCount,
                        SUM(CASE WHEN InsurancePolicies.PreviousPolicyNumber IS NOT NULL AND InsurancePolicies.PreviousPolicyNumber <> '' THEN 1 ELSE 0 END) AS RenewedPoliciesCount
                    FROM InsurancePolicies
                    INNER JOIN Locations ON InsurancePolicies.LocationId = Locations.Id
                    WHERE InsurancePolicies.DateCreated >= @From AND InsurancePolicies.DateCreated < @To
                    GROUP BY Locations.Name
                    ORDER BY Locations.Name";

                var (from, to) = GetStatisticsPeriod(period, DateTime.Today.AddYears(-1));

                using (SqlCommand cmd = new SqlCommand(query, conn))
                {
                    cmd.Parameters.AddWithValue("@From", from);
                    cmd.Parameters.AddWithValue("@To", to);

                    using (SqlDataReader reader = await cmd.ExecuteReaderAsync())
                    {
                        while (await reader.ReadAsync())
                        {
                            results.Add(new LocationPolicyChartItem
                            {
                                LocationName = reader["LocationName"].ToString(),
                                NewPoliciesCount = Convert.ToInt32(reader["NewPoliciesCount"]),
                                RenewedPoliciesCount = Convert.ToInt32(reader["RenewedPoliciesCount"])
                            });
                        }
                    }
                }
            }

            return results;
        }

        private async Task<ExpiringPolicyStats> GetPolicyStatsAsync(string whereClause, DateTime from, DateTime to)
        {
            using (SqlConnection conn = new SqlConnection(_connectionString))
            {
                await conn.OpenAsync();

                string query = @"
                    SELECT COUNT(*) AS PolicyCount, COALESCE(SUM(InsurancePolicies.Price), 0) AS PriceSum
                    FROM InsurancePolicies " + whereClause;

                using (SqlCommand cmd = new SqlCommand(query, conn))
                {
                    cmd.Parameters.AddWithValue("@From", from.ToString("yyyy/MM/dd"));
                    cmd.Parameters.AddWithValue("@To", to.ToString("yyyy/MM/dd"));

                    using (SqlDataReader reader = await cmd.ExecuteReaderAsync())
                    {
                        if (await reader.ReadAsync())
                        {
                            return new ExpiringPolicyStats
                            {
                                Count = Convert.ToInt32(reader["PolicyCount"]),
                                PriceSum = Convert.ToDecimal(reader["PriceSum"])
                            };
                        }
                    }
                }
            }

            return new ExpiringPolicyStats();
        }

        public async Task<bool> IsPolicyAlreadyExtendedAsync(string policyNumber)
        {
            using (var conn = new SqlConnection(_connectionString))
            {
                await conn.OpenAsync();

                string queryString = @"
                    SELECT InsurancePolicies.IsRenewed 
                    FROM InsurancePolicies 
                    WHERE PolicyNumber = @PolicyNumber;";

                using (var sqlCommand = new SqlCommand(queryString, conn))
                {
                    sqlCommand.Parameters.AddWithValue("@PolicyNumber", policyNumber);

                    // Execute the query and get the result
                    var result = await sqlCommand.ExecuteScalarAsync();

                    // Handle NULL values
                    if (result == null || result == DBNull.Value)
                    {
                        return false; // If the result is NULL, the policy is not extended
                    }

                    // Cast the result to bool
                    bool isExtended = (bool)result;
                    return isExtended;
                }
            }
        }

        public async Task<decimal> GetTotalPolicyPriceSumAsync(InsuranceFiltering filter)
        {
            using (SqlConnection conn = new SqlConnection(_connectionString))
            {
                await conn.OpenAsync();

                StringBuilder queryBuilder = new StringBuilder(@"
                    SELECT SUM(InsurancePolicies.Price) AS TotalPriceSum
                    FROM InsurancePolicies 
                    INNER JOIN Clients ON InsurancePolicies.ClientId = Clients.Id 
                    INNER JOIN Users ON Clients.UserId = Users.Id 
                    INNER JOIN Locations ON Locations.Id = InsurancePolicies.LocationId 
                    LEFT JOIN Partners ON Partners.Id = InsurancePolicies.PartnerId 
                    INNER JOIN PolicyTypes ON PolicyTypes.Id = InsurancePolicies.PolicyTypeId 
                    INNER JOIN InsuranceCompanies ON InsurancePolicies.InsuranceCompanyId = InsuranceCompanies.Id 
                    WHERE YEAR(InsurancePolicies.StartingDate) = @SelectedYear ");

                await FilteringQuery(filter, queryBuilder);

                using (SqlCommand cmd = new SqlCommand(queryBuilder.ToString(), conn))
                {
                    cmd.Parameters.AddWithValue("@SelectedYear", filter.Year);

                    var result = await cmd.ExecuteScalarAsync();
                    return result == DBNull.Value ? 0m : Convert.ToDecimal(result);
                }
            }
        }

        public async Task<int> GetYearsInsurancePoliciesAsync()
        {
            using (SqlConnection conn = new SqlConnection(_connectionString))
            {
                await conn.OpenAsync();

                string query = "SELECT COUNT(*) AS PoliciesEnteredThisYear " +
                                    "FROM InsurancePolicies " +
                                    "WHERE StartingDate >= DATEFROMPARTS(YEAR(GETDATE()), 1, 1); ";

                using (SqlCommand cmd = new SqlCommand(query, conn))
                {
                    return (int)await cmd.ExecuteScalarAsync();
                }
            }
        }

        public async Task<float> GetTodaysPolicySum()
        {
            using (SqlConnection conn = new SqlConnection(_connectionString))
            {
                await conn.OpenAsync();

                string query = @"
                        SELECT SUM(Price)
                        FROM InsurancePolicies
                        WHERE DateCreated >= @Today
                          AND DateCreated < DATEADD(DAY, 1, @Today)";

                using (SqlCommand cmd = new SqlCommand(query, conn))
                {
                    cmd.Parameters.AddWithValue("@Today", DateTime.Today);
                    var result = await cmd.ExecuteScalarAsync();

                    // Handle NULL and convert safely to float
                    if (result == DBNull.Value || result == null)
                        return 0f;

                    return Convert.ToSingle(result);
                }
            }
        }


        public async Task<decimal> GetThisYearsPolicySum()
        {
            using (SqlConnection conn = new SqlConnection(_connectionString))
            {
                await conn.OpenAsync();

                string query = "SELECT SUM(InsurancePolicies.Price) " +
                               "FROM InsurancePolicies " +
                               "WHERE InsurancePolicies.StartingDate >= DATEFROMPARTS(YEAR(GETDATE()), 1, 1)";

                using (SqlCommand cmd = new SqlCommand(query, conn))
                {
                    var result = await cmd.ExecuteScalarAsync();

                    if (result == DBNull.Value || result == null)
                        return 0;

                    return (decimal)result;
                }
            }
        }

        #region Sales Statistics Methods

        private const string SalesBaseJoins = @"
            FROM InsurancePolicies
            INNER JOIN Clients ON InsurancePolicies.ClientId = Clients.Id
            INNER JOIN Users ON Clients.UserId = Users.Id
            INNER JOIN Locations ON Locations.Id = InsurancePolicies.LocationId
            LEFT JOIN Partners ON Partners.Id = InsurancePolicies.PartnerId
            INNER JOIN PolicyTypes ON PolicyTypes.Id = InsurancePolicies.PolicyTypeId
            INNER JOIN InsuranceCompanies ON InsurancePolicies.InsuranceCompanyId = InsuranceCompanies.Id";

        private static string BuildSalesFilterClause(StatisticsFiltering filter, List<(string Name, object Value)> parameters, bool includeDateRange = true)
        {
            var sb = new StringBuilder();

            if (includeDateRange && filter.DateFrom.HasValue && filter.DateTo.HasValue)
            {
                sb.Append(" AND InsurancePolicies.DateCreated >= @DateFrom AND InsurancePolicies.DateCreated < @DateTo ");
                parameters.Add(("@DateFrom", filter.DateFrom.Value.Date));
                parameters.Add(("@DateTo", filter.DateTo.Value.Date.AddDays(1)));
            }
            else if (!string.IsNullOrWhiteSpace(filter.Year) && int.TryParse(filter.Year, out int yr))
            {
                sb.Append(" AND YEAR(InsurancePolicies.DateCreated) = @FilterYear ");
                parameters.Add(("@FilterYear", yr));
            }

            if (!string.IsNullOrWhiteSpace(filter.InsuranceCompany) && filter.InsuranceCompany != "Osiguravajuća kuća")
            {
                sb.Append(" AND InsuranceCompanies.Name = @InsuranceCompany ");
                parameters.Add(("@InsuranceCompany", filter.InsuranceCompany));
            }

            if (!string.IsNullOrWhiteSpace(filter.InsuranceType) && filter.InsuranceType != "Vrsta osiguranja")
            {
                sb.Append(" AND PolicyTypes.Type = @InsuranceType ");
                parameters.Add(("@InsuranceType", filter.InsuranceType));
            }

            if (!string.IsNullOrWhiteSpace(filter.Partner) && filter.Partner != "Partneri")
            {
                sb.Append(" AND Partners.Name = @Partner ");
                parameters.Add(("@Partner", filter.Partner));
            }

            if (!string.IsNullOrWhiteSpace(filter.Location) && filter.Location != "Prodajno mjesto")
            {
                sb.Append(" AND Locations.Name = @Location ");
                parameters.Add(("@Location", filter.Location));
            }

            return sb.ToString();
        }

        private static void ApplyParameters(SqlCommand cmd, List<(string Name, object Value)> parameters)
        {
            foreach (var (name, value) in parameters)
                cmd.Parameters.AddWithValue(name, value);
        }

        public async Task<SalesChartResponse> GetFilteredPoliciesChartDataAsync(string period, StatisticsFiltering filter)
        {
            var today = DateTime.Today;
            DateTime from;
            DateTime to = today.AddDays(1);
            string groupBy;

            if (filter.DateFrom.HasValue && filter.DateTo.HasValue)
            {
                from = filter.DateFrom.Value.Date;
                to = filter.DateTo.Value.Date.AddDays(1);
                int daySpan = (int)(to - from).TotalDays;
                groupBy = daySpan <= 32 ? "DAY" : "WEEK";
            }
            else
            {
                switch (period?.ToLower())
                {
                    case "1m":
                        from = today.AddDays(-30);
                        groupBy = "DAY";
                        break;
                    case "3m":
                        from = today.AddMonths(-3);
                        groupBy = "DAY";
                        break;
                    case "ytd":
                        from = new DateTime(today.Year, 1, 1);
                        groupBy = today.Month <= 2 ? "WEEK" : "MONTH";
                        break;
                    case "1g":
                        from = today.AddYears(-1);
                        groupBy = "WEEK";
                        break;
                    case "max":
                        from = new DateTime(2023, 1, 1);
                        groupBy = "MONTH";
                        break;
                    default: // "1t"
                        from = today.AddDays(-7);
                        groupBy = "DAY";
                        break;
                }
            }

            var parameters = new List<(string, object)>
            {
                ("@From", from),
                ("@To", to)
            };

            // Date range is already applied via @From/@To — only apply entity filters, no year/date from filter
            var entityOnlyFilter = new StatisticsFiltering(
                filter.Location, null, null,
                filter.InsuranceCompany, filter.InsuranceType,
                filter.Partner, null);

            string filterClause = BuildSalesFilterClause(entityOnlyFilter, parameters, includeDateRange: false);

            string selectAndGroup = groupBy switch
            {
                "DAY" => @"
                    SELECT
                        CONVERT(VARCHAR, CONVERT(DATE, InsurancePolicies.DateCreated), 105) AS Label,
                        COUNT(*) AS PolicyCount,
                        COALESCE(SUM(InsurancePolicies.Price), 0) AS PriceSum
                    " + SalesBaseJoins + @"
                    WHERE InsurancePolicies.DateCreated >= @From AND InsurancePolicies.DateCreated < @To"
                    + filterClause + @"
                    GROUP BY CONVERT(DATE, InsurancePolicies.DateCreated)
                    ORDER BY CONVERT(DATE, InsurancePolicies.DateCreated)",

                "WEEK" => @"
                    SELECT
                        CONVERT(VARCHAR,
                            CASE
                                WHEN DATEADD(DAY, 1 - ((DATEPART(WEEKDAY, InsurancePolicies.DateCreated) + 5) % 7 + 1), CAST(InsurancePolicies.DateCreated AS DATE)) < CAST(@From AS DATE)
                                THEN CAST(@From AS DATE)
                                ELSE DATEADD(DAY, 1 - ((DATEPART(WEEKDAY, InsurancePolicies.DateCreated) + 5) % 7 + 1), CAST(InsurancePolicies.DateCreated AS DATE))
                            END, 105) AS Label,
                        COUNT(*) AS PolicyCount,
                        COALESCE(SUM(InsurancePolicies.Price), 0) AS PriceSum
                    " + SalesBaseJoins + @"
                    WHERE InsurancePolicies.DateCreated >= @From AND InsurancePolicies.DateCreated < @To"
                    + filterClause + @"
                    GROUP BY DATEADD(DAY, 1 - ((DATEPART(WEEKDAY, InsurancePolicies.DateCreated) + 5) % 7 + 1), CAST(InsurancePolicies.DateCreated AS DATE))
                    ORDER BY DATEADD(DAY, 1 - ((DATEPART(WEEKDAY, InsurancePolicies.DateCreated) + 5) % 7 + 1), CAST(InsurancePolicies.DateCreated AS DATE))",

                _ => @"
                    SELECT
                        RIGHT('0' + CAST(MONTH(InsurancePolicies.DateCreated) AS VARCHAR(2)), 2) + '/' + CAST(YEAR(InsurancePolicies.DateCreated) AS VARCHAR(4)) AS Label,
                        COUNT(*) AS PolicyCount,
                        COALESCE(SUM(InsurancePolicies.Price), 0) AS PriceSum
                    " + SalesBaseJoins + @"
                    WHERE InsurancePolicies.DateCreated >= @From AND InsurancePolicies.DateCreated < @To"
                    + filterClause + @"
                    GROUP BY YEAR(InsurancePolicies.DateCreated), MONTH(InsurancePolicies.DateCreated)
                    ORDER BY YEAR(InsurancePolicies.DateCreated), MONTH(InsurancePolicies.DateCreated)"
            };

            var dataPoints = new List<SalesChartDataPoint>();

            using (SqlConnection conn = new SqlConnection(_connectionString))
            {
                await conn.OpenAsync();

                using (SqlCommand cmd = new SqlCommand(selectAndGroup, conn))
                {
                    ApplyParameters(cmd, parameters);

                    using (SqlDataReader reader = await cmd.ExecuteReaderAsync())
                    {
                        while (await reader.ReadAsync())
                        {
                            dataPoints.Add(new SalesChartDataPoint
                            {
                                Label = reader["Label"].ToString(),
                                PolicyCount = Convert.ToInt32(reader["PolicyCount"]),
                                PriceSum = Convert.ToDecimal(reader["PriceSum"])
                            });
                        }
                    }
                }
            }

            return new SalesChartResponse
            {
                TotalCount = dataPoints.Sum(d => d.PolicyCount),
                TotalSum = dataPoints.Sum(d => d.PriceSum),
                DataPoints = dataPoints
            };
        }

        public async Task<PolicyCreationStats> GetPolicyCreationStatsAsync(StatisticsFiltering filter)
        {
            var parameters = new List<(string, object)>();
            string filterClause = BuildSalesFilterClause(filter, parameters);

            string query = @"
                SELECT
                    COALESCE(SUM(CASE WHEN InsurancePolicies.PreviousPolicyNumber IS NULL OR InsurancePolicies.PreviousPolicyNumber = '' THEN 1 ELSE 0 END), 0) AS NewCount,
                    COALESCE(SUM(CASE WHEN InsurancePolicies.PreviousPolicyNumber IS NOT NULL AND InsurancePolicies.PreviousPolicyNumber <> '' THEN 1 ELSE 0 END), 0) AS RenewedCount
                " + SalesBaseJoins + @"
                WHERE 1=1" + filterClause;

            using (SqlConnection conn = new SqlConnection(_connectionString))
            {
                await conn.OpenAsync();

                using (SqlCommand cmd = new SqlCommand(query, conn))
                {
                    ApplyParameters(cmd, parameters);

                    using (SqlDataReader reader = await cmd.ExecuteReaderAsync())
                    {
                        if (await reader.ReadAsync())
                        {
                            int newCount = Convert.ToInt32(reader["NewCount"]);
                            int renewedCount = Convert.ToInt32(reader["RenewedCount"]);
                            int total = newCount + renewedCount;

                            return new PolicyCreationStats
                            {
                                NewCount = newCount,
                                RenewedCount = renewedCount,
                                NewPercentage = total > 0 ? Math.Round((double)newCount / total * 100, 1) : 0,
                                RenewedPercentage = total > 0 ? Math.Round((double)renewedCount / total * 100, 1) : 0
                            };
                        }
                    }
                }
            }

            return new PolicyCreationStats();
        }

        public async Task<List<LocationPolicyStats>> GetPolicyLocationStatsAsync(StatisticsFiltering filter)
        {
            var parameters = new List<(string, object)>();
            string filterClause = BuildSalesFilterClause(filter, parameters);

            string query = @"
                SELECT
                    Locations.Name AS LocationName,
                    COUNT(*) AS PolicyCount,
                    COALESCE(SUM(InsurancePolicies.Price), 0) AS PolicySum
                " + SalesBaseJoins + @"
                WHERE 1=1" + filterClause + @"
                GROUP BY Locations.Name
                ORDER BY PolicyCount DESC";

            var raw = new List<(string Name, int Count, decimal Sum)>();

            using (SqlConnection conn = new SqlConnection(_connectionString))
            {
                await conn.OpenAsync();

                using (SqlCommand cmd = new SqlCommand(query, conn))
                {
                    ApplyParameters(cmd, parameters);

                    using (SqlDataReader reader = await cmd.ExecuteReaderAsync())
                    {
                        while (await reader.ReadAsync())
                        {
                            raw.Add((
                                reader["LocationName"].ToString(),
                                Convert.ToInt32(reader["PolicyCount"]),
                                Convert.ToDecimal(reader["PolicySum"])
                            ));
                        }
                    }
                }
            }

            int totalCount = raw.Sum(r => r.Count);

            return raw.Select(r => new LocationPolicyStats
            {
                LocationName = r.Name,
                PolicyCount = r.Count,
                PolicySum = r.Sum,
                Percentage = totalCount > 0 ? Math.Round((double)r.Count / totalCount * 100, 1) : 0
            }).ToList();
        }

        public async Task<List<InsuranceCompanyYearlyStats>> GetInsuranceCompanyYearlyStatsAsync(StatisticsFiltering filter)
        {
            // Query 1: filtered totals per company (respects date range) → for bar chart
            var filteredParams = new List<(string, object)>();
            string filteredClause = BuildSalesFilterClause(filter, filteredParams);

            string filteredQuery = @"
                SELECT
                    InsuranceCompanies.Name AS CompanyName,
                    COUNT(*) AS PolicyCount,
                    COALESCE(SUM(InsurancePolicies.Price), 0) AS PolicySum
                " + SalesBaseJoins + @"
                WHERE 1=1" + filteredClause + @"
                GROUP BY InsuranceCompanies.Name
                ORDER BY PolicySum DESC";

            var filteredTotals = new Dictionary<string, (int Count, decimal Sum)>();

            // Query 2: per-company per-year data — year range is fixed (2023-current), only entity filters apply
            var yearlyEntityFilter = new StatisticsFiltering(
                filter.Location, null, null,
                filter.InsuranceCompany, filter.InsuranceType,
                filter.Partner, null);
            var yearlyParams = new List<(string, object)>();
            string yearlyClause = BuildSalesFilterClause(yearlyEntityFilter, yearlyParams, includeDateRange: false);

            int currentYear = DateTime.Today.Year;

            string yearlyQuery = @"
                SELECT
                    InsuranceCompanies.Name AS CompanyName,
                    YEAR(InsurancePolicies.DateCreated) AS Year,
                    COUNT(*) AS PolicyCount,
                    COALESCE(SUM(InsurancePolicies.Price), 0) AS PolicySum
                " + SalesBaseJoins + $@"
                WHERE YEAR(InsurancePolicies.DateCreated) >= 2023
                  AND YEAR(InsurancePolicies.DateCreated) <= {currentYear}"
                + yearlyClause + @"
                GROUP BY InsuranceCompanies.Name, YEAR(InsurancePolicies.DateCreated)
                ORDER BY InsuranceCompanies.Name, YEAR(InsurancePolicies.DateCreated)";

            var yearlyRaw = new List<(string Company, int Year, int Count, decimal Sum)>();

            using (SqlConnection conn = new SqlConnection(_connectionString))
            {
                await conn.OpenAsync();

                using (SqlCommand cmd = new SqlCommand(filteredQuery, conn))
                {
                    ApplyParameters(cmd, filteredParams);

                    using (SqlDataReader reader = await cmd.ExecuteReaderAsync())
                    {
                        while (await reader.ReadAsync())
                        {
                            string name = reader["CompanyName"].ToString();
                            filteredTotals[name] = (
                                Convert.ToInt32(reader["PolicyCount"]),
                                Convert.ToDecimal(reader["PolicySum"])
                            );
                        }
                    }
                }

                using (SqlCommand cmd = new SqlCommand(yearlyQuery, conn))
                {
                    ApplyParameters(cmd, yearlyParams);

                    using (SqlDataReader reader = await cmd.ExecuteReaderAsync())
                    {
                        while (await reader.ReadAsync())
                        {
                            yearlyRaw.Add((
                                reader["CompanyName"].ToString(),
                                Convert.ToInt32(reader["Year"]),
                                Convert.ToInt32(reader["PolicyCount"]),
                                Convert.ToDecimal(reader["PolicySum"])
                            ));
                        }
                    }
                }
            }

            int totalFilteredCount = filteredTotals.Values.Sum(v => v.Count);

            var result = new List<InsuranceCompanyYearlyStats>();

            // Build the result using filtered totals as the primary source
            foreach (var (company, (count, sum)) in filteredTotals)
            {
                var companyYearlyRows = yearlyRaw
                    .Where(r => r.Company == company)
                    .OrderByDescending(r => r.Year)
                    .ToList();

                var breakdown = new List<YearlyBreakdownItem>();
                for (int i = 0; i < companyYearlyRows.Count; i++)
                {
                    var row = companyYearlyRows[i];
                    decimal prevSum = i + 1 < companyYearlyRows.Count ? companyYearlyRows[i + 1].Sum : 0;
                    double growth = prevSum > 0
                        ? Math.Round((double)((row.Sum - prevSum) / prevSum * 100), 1)
                        : 0;

                    breakdown.Add(new YearlyBreakdownItem
                    {
                        Year = row.Year,
                        PolicyCount = row.Count,
                        PolicySum = row.Sum,
                        GrowthPercentage = growth
                    });
                }

                result.Add(new InsuranceCompanyYearlyStats
                {
                    CompanyName = company,
                    PolicyCount = count,
                    PolicySum = sum,
                    Percentage = totalFilteredCount > 0 ? Math.Round((double)count / totalFilteredCount * 100, 1) : 0,
                    YearlyBreakdown = breakdown
                });
            }

            return result;
        }

        public async Task<List<PartnerStats>> GetPartnerStatsAsync(StatisticsFiltering filter)
        {
            var parameters = new List<(string, object)>();
            string filterClause = BuildSalesFilterClause(filter, parameters);

            string query = @"
                SELECT
                    COALESCE(Partners.Name, 'Nema partnera') AS PartnerName,
                    COUNT(*) AS PolicyCount,
                    COALESCE(SUM(InsurancePolicies.Price), 0) AS PolicySum
                " + SalesBaseJoins + @"
                WHERE 1=1" + filterClause + @"
                GROUP BY Partners.Name
                ORDER BY PolicyCount DESC";

            var raw = new List<(string Name, int Count, decimal Sum)>();

            using (SqlConnection conn = new SqlConnection(_connectionString))
            {
                await conn.OpenAsync();

                using (SqlCommand cmd = new SqlCommand(query, conn))
                {
                    ApplyParameters(cmd, parameters);

                    using (SqlDataReader reader = await cmd.ExecuteReaderAsync())
                    {
                        while (await reader.ReadAsync())
                        {
                            raw.Add((
                                reader["PartnerName"].ToString(),
                                Convert.ToInt32(reader["PolicyCount"]),
                                Convert.ToDecimal(reader["PolicySum"])
                            ));
                        }
                    }
                }
            }

            int totalCount = raw.Sum(r => r.Count);

            return raw.Select(r => new PartnerStats
            {
                PartnerName = r.Name,
                PolicyCount = r.Count,
                PolicySum = r.Sum,
                Percentage = totalCount > 0 ? Math.Round((double)r.Count / totalCount * 100, 1) : 0
            }).ToList();
        }

        public async Task<PremiumComparisonData> GetPremiumComparisonDataAsync(List<int> years, StatisticsFiltering filter)
        {
            if (years == null || years.Count == 0)
                return new PremiumComparisonData();

            // Years are handled explicitly via IN clause — only apply entity filters, no date/year from filter
            var entityOnlyFilter = new StatisticsFiltering(
                filter.Location, null, null,
                filter.InsuranceCompany, filter.InsuranceType,
                filter.Partner, null);
            var parameters = new List<(string, object)>();
            string filterClause = BuildSalesFilterClause(entityOnlyFilter, parameters, includeDateRange: false);

            string yearsParam = string.Join(",", years);

            string query = @"
                SELECT
                    YEAR(InsurancePolicies.DateCreated) AS Year,
                    MONTH(InsurancePolicies.DateCreated) AS Month,
                    SUM(InsurancePolicies.Price) AS MonthlySum
                " + SalesBaseJoins + $@"
                WHERE YEAR(InsurancePolicies.DateCreated) IN ({yearsParam})"
                + filterClause + @"
                GROUP BY YEAR(InsurancePolicies.DateCreated), MONTH(InsurancePolicies.DateCreated)
                ORDER BY YEAR(InsurancePolicies.DateCreated), MONTH(InsurancePolicies.DateCreated)";

            // Map: Year -> (Month → Sum)
            var monthlyData = new Dictionary<int, Dictionary<int, decimal>>();
            foreach (int y in years)
                monthlyData[y] = new Dictionary<int, decimal>();

            using (SqlConnection conn = new SqlConnection(_connectionString))
            {
                await conn.OpenAsync();

                using (SqlCommand cmd = new SqlCommand(query, conn))
                {
                    ApplyParameters(cmd, parameters);

                    using (SqlDataReader reader = await cmd.ExecuteReaderAsync())
                    {
                        while (await reader.ReadAsync())
                        {
                            int year = Convert.ToInt32(reader["Year"]);
                            int month = Convert.ToInt32(reader["Month"]);
                            decimal sum = Convert.ToDecimal(reader["MonthlySum"]);

                            if (monthlyData.ContainsKey(year))
                                monthlyData[year][month] = sum;
                        }
                    }
                }
            }

            int currentYear = DateTime.Today.Year;
            int currentMonth = DateTime.Today.Month;

            var dataPoints = new List<PremiumMonthlyPoint>();

            // X-axis always spans 12 months; current year stops at currentMonth, previous years go to December
            for (int m = 1; m <= 12; m++)
            {
                var point = new PremiumMonthlyPoint
                {
                    MonthNumber = m,
                    MonthLabel = $"{m:D2}",
                    CumulativeValueByYear = new Dictionary<int, decimal>()
                };

                foreach (int y in years)
                {
                    int lastMonthForYear = y == currentYear ? currentMonth : 12;

                    // Don't include future months for the current year
                    if (m > lastMonthForYear)
                        continue;

                    decimal cumulative = 0;
                    for (int mm = 1; mm <= m; mm++)
                    {
                        if (monthlyData[y].TryGetValue(mm, out decimal val))
                            cumulative += val;
                    }

                    point.CumulativeValueByYear[y] = cumulative;
                }

                dataPoints.Add(point);
            }

            return new PremiumComparisonData { DataPoints = dataPoints };
        }

        #endregion

        public async Task<object> GetBSkadencaDataAsync(int year, int comparisonYear, StatisticsFiltering filter)
        {
            string filterJoin = @"
                INNER JOIN InsuranceCompanies IC ON IP.InsuranceCompanyId = IC.Id
                INNER JOIN PolicyTypes PT ON IP.PolicyTypeId = PT.Id
                INNER JOIN Locations L ON IP.LocationId = L.Id";

            bool hasDateRange = filter?.DateFrom.HasValue == true && filter?.DateTo.HasValue == true;
            var today = DateTime.Today;

            string filterWhere(int y)
            {
                string dateCond;
                if (hasDateRange)
                {
                    dateCond = y == year
                        ? "IP.DateCreated BETWEEN @DateFrom AND @DateTo"
                        : $"IP.DateCreated BETWEEN DATEADD(YEAR, {y - year}, @DateFrom) AND DATEADD(YEAR, {y - year}, @DateTo)";
                }
                else
                {
                    // Limit both years to the same day-of-year as today for a fair YTD comparison
                    int cutoffDay = Math.Min(today.Day, DateTime.DaysInMonth(y, today.Month));
                    var cutoff = new DateTime(y, today.Month, cutoffDay);
                    dateCond = $"IP.DateCreated BETWEEN '{y}-01-01' AND '{cutoff:yyyy-MM-dd}'";
                }
                return $@"{dateCond}
                   AND (@InsuranceCompany IS NULL OR IC.Name = @InsuranceCompany)
                   AND (@InsuranceType IS NULL OR PT.Type = @InsuranceType)
                   AND (@Location IS NULL OR L.Name = @Location)";
            }

            string query = $@"
                -- Weekly data for selected year
                SELECT 'weekly' AS ResultSet,
                       DATEPART(ISO_WEEK, IP.DateCreated) AS WeekNumber,
                       COUNT(*) AS PolicyCount,
                       ISNULL(SUM(IP.Price), 0) AS PolicySum,
                       NULL AS [Type], NULL AS IsRenewed, NULL AS [Year]
                FROM InsurancePolicies IP {filterJoin}
                WHERE {filterWhere(year)}
                GROUP BY DATEPART(ISO_WEEK, IP.DateCreated)

                UNION ALL

                -- Weekly data for comparison year
                SELECT 'weekly_prev' AS ResultSet,
                       DATEPART(ISO_WEEK, IP.DateCreated) AS WeekNumber,
                       COUNT(*) AS PolicyCount,
                       ISNULL(SUM(IP.Price), 0) AS PolicySum,
                       NULL AS [Type], NULL AS IsRenewed, NULL AS [Year]
                FROM InsurancePolicies IP {filterJoin}
                WHERE {filterWhere(comparisonYear)}
                GROUP BY DATEPART(ISO_WEEK, IP.DateCreated)

                UNION ALL

                -- Summary for selected year
                SELECT 'summary', NULL, COUNT(*), ISNULL(SUM(IP.Price), 0), NULL, NULL, CAST({year} AS NVARCHAR)
                FROM InsurancePolicies IP {filterJoin}
                WHERE {filterWhere(year)}

                UNION ALL

                -- Summary for comparison year
                SELECT 'comparison', NULL, COUNT(*), ISNULL(SUM(IP.Price), 0), NULL, NULL, CAST({comparisonYear} AS NVARCHAR)
                FROM InsurancePolicies IP {filterJoin}
                WHERE {filterWhere(comparisonYear)}

                UNION ALL

                -- Type stats for selected year
                SELECT 'type_current', NULL, COUNT(*), ISNULL(SUM(IP.Price), 0), PT.Type, NULL, CAST({year} AS NVARCHAR)
                FROM InsurancePolicies IP {filterJoin}
                WHERE {filterWhere(year)}
                GROUP BY PT.Type

                UNION ALL

                -- Type stats for comparison year
                SELECT 'type_prev', NULL, COUNT(*), ISNULL(SUM(IP.Price), 0), PT.Type, NULL, CAST({comparisonYear} AS NVARCHAR)
                FROM InsurancePolicies IP {filterJoin}
                WHERE {filterWhere(comparisonYear)}
                GROUP BY PT.Type

                UNION ALL

                -- Renewal status for comparison year
                SELECT 'status', NULL, COUNT(*), ISNULL(SUM(IP.Price), 0), NULL, CAST(IP.IsRenewed AS NVARCHAR), NULL
                FROM InsurancePolicies IP {filterJoin}
                WHERE {filterWhere(comparisonYear)}
                GROUP BY IP.IsRenewed

                ORDER BY 1, 2";

            var weeklyData = new List<object>();
            var weeklyDataComparison = new List<object>();
            int yearCount = 0; decimal yearSum = 0;
            int prevCount = 0; decimal prevSum = 0;
            var typeCurrentMap = new Dictionary<string, (int count, decimal sum)>();
            var typePrevMap = new Dictionary<string, (int count, decimal sum)>();
            int renewedCount = 0, notRenewedCount = 0;

            using (var conn = new SqlConnection(_connectionString))
            {
                await conn.OpenAsync();
                using (var cmd = new SqlCommand(query, conn))
                {
                    cmd.Parameters.AddWithValue("@InsuranceCompany", string.IsNullOrWhiteSpace(filter?.InsuranceCompany) ? (object)DBNull.Value : filter.InsuranceCompany);
                    cmd.Parameters.AddWithValue("@InsuranceType", string.IsNullOrWhiteSpace(filter?.InsuranceType) ? (object)DBNull.Value : filter.InsuranceType);
                    cmd.Parameters.AddWithValue("@Location", string.IsNullOrWhiteSpace(filter?.Location) ? (object)DBNull.Value : filter.Location);
                    if (hasDateRange)
                    {
                        cmd.Parameters.AddWithValue("@DateFrom", filter.DateFrom.Value);
                        cmd.Parameters.AddWithValue("@DateTo", filter.DateTo.Value);
                    }

                    using (var reader = await cmd.ExecuteReaderAsync())
                    {
                        while (await reader.ReadAsync())
                        {
                            var rs = reader["ResultSet"].ToString();
                            var count = Convert.ToInt32(reader["PolicyCount"]);
                            var sum = Convert.ToDecimal(reader["PolicySum"]);

                            if (rs == "weekly")
                            {
                                weeklyData.Add(new { weekNumber = Convert.ToInt32(reader["WeekNumber"]), policyCount = count, policySum = sum });
                            }
                            else if (rs == "weekly_prev")
                            {
                                weeklyDataComparison.Add(new { weekNumber = Convert.ToInt32(reader["WeekNumber"]), policyCount = count, policySum = sum });
                            }
                            else if (rs == "summary") { yearCount = count; yearSum = sum; }
                            else if (rs == "comparison") { prevCount = count; prevSum = sum; }
                            else if (rs == "type_current")
                            {
                                typeCurrentMap[reader["Type"].ToString()] = (count, sum);
                            }
                            else if (rs == "type_prev")
                            {
                                typePrevMap[reader["Type"].ToString()] = (count, sum);
                            }
                            else if (rs == "status")
                            {
                                bool isRenewed = reader["IsRenewed"].ToString() == "1";
                                if (isRenewed) renewedCount = count; else notRenewedCount = count;
                            }
                        }
                    }
                }
            }

            var allTypes = typeCurrentMap.Keys.Union(typePrevMap.Keys).OrderBy(t => t);
            var typeStats = allTypes.Select(t =>
            {
                var cur = typeCurrentMap.TryGetValue(t, out var c) ? c : (0, 0m);
                var prv = typePrevMap.TryGetValue(t, out var p) ? p : (0, 0m);
                return new { type = t, currentCount = cur.Item1, currentSum = cur.Item2, previousCount = prv.Item1, previousSum = prv.Item2 };
            }).ToList<object>();

            double pctChange = prevCount > 0 ? Math.Round((double)(yearCount - prevCount) / prevCount * 100, 1) : 0;

            return new
            {
                weeklyData,
                weeklyDataComparison,
                yearSummary = new { year, policyCount = yearCount, policySum = yearSum },
                comparisonYearSummary = new { year = comparisonYear, policyCount = prevCount, policySum = prevSum },
                percentChange = pctChange,
                typeStats,
                renewedCount,
                notRenewedCount
            };
        }

        public async Task<(List<string> Companies, List<string> PolicyTypes, List<string> Locations, List<string> Partners)> GetDashboardFilterOptionsAsync()
        {
            const string query = @"
                SELECT DISTINCT InsuranceCompanies.Name AS Company
                FROM InsuranceCompanies
                ORDER BY InsuranceCompanies.Name;

                SELECT DISTINCT PolicyTypes.Type AS PolicyType
                FROM PolicyTypes
                ORDER BY PolicyTypes.Type;

                SELECT DISTINCT Locations.Name AS Location
                FROM Locations
                ORDER BY Locations.Name;

                SELECT DISTINCT Partners.Name AS Partner
                FROM Partners
                ORDER BY Partners.Name;";

            var companies = new List<string>();
            var policyTypes = new List<string>();
            var locations = new List<string>();
            var partners = new List<string>();

            using (var conn = new SqlConnection(_connectionString))
            {
                await conn.OpenAsync();
                using (var cmd = new SqlCommand(query, conn))
                using (var reader = await cmd.ExecuteReaderAsync())
                {
                    while (await reader.ReadAsync())
                        companies.Add(reader["Company"].ToString());

                    await reader.NextResultAsync();
                    while (await reader.ReadAsync())
                        policyTypes.Add(reader["PolicyType"].ToString());

                    await reader.NextResultAsync();
                    while (await reader.ReadAsync())
                        locations.Add(reader["Location"].ToString());

                    await reader.NextResultAsync();
                    while (await reader.ReadAsync())
                        partners.Add(reader["Partner"].ToString());
                }
            }

            return (companies, policyTypes, locations, partners);
        }

        #endregion

    }
}



