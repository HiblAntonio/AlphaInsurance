using System;

namespace Alpha.Model
{
    public class DeletedPolicyView
    {
        public Guid Id { get; set; }
        public string PolicyNumber { get; set; }
        public string ClientName { get; set; }
        public string InsuranceCompany { get; set; }
        public string PolicyType { get; set; }
        public DateTime StartingDate { get; set; }
        public decimal Price { get; set; }
        public string Location { get; set; }
        public string Oib { get; set; }
        public DateTime? DateOfBirth { get; set; }
        public string PhoneNumber { get; set; }
        public string MailAddress { get; set; }
        public string Partner { get; set; }
        public DateTime DeletedAt { get; set; }
        public string DeletedByName { get; set; }
        public string DeleteReason { get; set; }
        public string DeleteComment { get; set; }
        public int DaysUntilPermanentDelete { get; set; }
    }
}
