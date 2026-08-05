namespace Alpha.Model
{
    public class ClientModelView
    {
        public Guid Id { get; set; }
        public string Oib { get; set; }
        public string ClientName { get; set; }
        //string LegalStatus { get; set; }
        public string ClientEmailAddress { get; set; }
        public DateTime Dob { get; set; }
        public string PhoneNumber { get; set; }
        public bool IsActive { get; set; }
        public bool IsBirthday { get; set; }

        public ClientModelView(Guid id, string oib, string clientName, /* string legalStatus, */ string clientEmailAddress, DateTime dob, string phoneNumber, bool isActive, bool isBirthday)
        {
            Id = id;
            Oib = oib;
            ClientName = clientName;
            //LegalStatus = legalStatus;
            ClientEmailAddress = clientEmailAddress;
            Dob = dob;
            PhoneNumber = phoneNumber;
            IsActive = isActive;
            IsBirthday = isBirthday;
        }

        public ClientModelView(){}
    }
} 
