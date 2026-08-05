namespace Alpha.Model
{
    public class ClientDetailsView
    {
        public Guid Id { get; set; }
        public string Name { get; set; } = string.Empty;
        public string Oib { get; set; } = string.Empty;
        public string PhoneNumber { get; set; } = string.Empty;
        public string EmailAddress { get; set; } = string.Empty;
        public DateTime Dob { get; set; }
        //public string LegalStatus { get; set; } = string.Empty;
        public decimal TotalPremiumSum { get; set; }
        public decimal ActivePremiumSum { get; set; }
        public List<ClientPolicyView> Policies { get; set; } = new List<ClientPolicyView>();
    }
}