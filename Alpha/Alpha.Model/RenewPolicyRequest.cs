using System;
using System.Collections.Generic;
using System.Linq;
using System.Text;
using System.Threading.Tasks;

namespace Alpha.Model
{
    public class RenewPolicyRequest
    {
        public Guid ClientId { get; set; }
        public PolicyRequest Policy { get; set; }
    }
}