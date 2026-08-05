namespace Alpha.Model
{
    public class AddAgentRequest
    {
        public string Name { get; set; }
        public string RoleName { get; set; }
        public string MailAddress { get; set; }
        public string Password { get; set; }
        public string Location { get; set; }
        //public string Oib { get; set; }
        //public DateTime? DateOfBirth { get; set; }
        //public string PhoneNumber { get; set; }
    }
}