namespace Alpha.Model
{
    public class AgentFiltering
    {
        public string? Search { get; set; }
        public string? Role { get; set; }

        public AgentFiltering() {}
        public AgentFiltering(string search, string role)
        {
            Search = search;
            Role = role;
        }
    }
}