using System;

namespace Alpha.Model
{
    public class RefreshToken
    {
        public Guid Id { get; set; }
        public Guid AgentId { get; set; }
        public string Token { get; set; }
        public DateTime ExpiresAt { get; set; }
        public bool IsRevoked { get; set; }
        public DateTime CreatedAt { get; set; }
    }
}
