namespace Alpha.Model
{
    public class ClientPolicyView
    {
        public string PolicyNumber { get; set; } = string.Empty;
        public string InsuranceCompany { get; set; } = string.Empty;
        public string PolicyType { get; set; } = string.Empty;
        public decimal Price { get; set; }
        public string Location { get; set; }
        public DateTime StartingDate { get; set; }
        public bool IsActive { get; set; }
        public bool IsRenewed { get; set; }
    }
}