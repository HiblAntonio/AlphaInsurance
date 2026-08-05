namespace Alpha.Model
{
    public class AgentDetailsView
{
    public Guid Id { get; set; }
    public string Name { get; set; } = string.Empty;
    public string Oib { get; set; } = string.Empty;
    public DateTime? DateOfBirth { get; set; }
    public string PhoneNumber { get; set; } = string.Empty;
    public string MailAddress { get; set; } = string.Empty;
    public string IdentificationNumber { get; set; } = string.Empty;
    public DateTime? LastLogin { get; set; }
    public DateTime? LastActivity { get; set; }
    public string RoleName { get; set; } = string.Empty;
    public string LocationName { get; set; } = string.Empty;
    public bool IsActive { get; set; } = true;
    public int TotalPoliciesCount { get; set; }
    public decimal TotalPremiumSum { get; set; }
    public int MonthlyPoliciesCount { get; set; }
    public decimal MonthlyPremiumSum { get; set; }
}
}