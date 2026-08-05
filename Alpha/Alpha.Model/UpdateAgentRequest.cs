namespace Alpha.Model
{
    public class UpdateAgentRequest
    {
        public string? Name { get; set; }
        public string? MailAddress { get; set; }
        public string? IdentificationNumber { get; set; }
        public string? LocationName { get; set; }
        public string? RoleName { get; set; }
        public string? Oib { get; set; }
        public DateTime? DateOfBirth { get; set; }
        public string? PhoneNumber { get; set; }
    }
}
