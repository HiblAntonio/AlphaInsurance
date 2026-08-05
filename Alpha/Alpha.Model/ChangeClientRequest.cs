using System;
using System.Collections.Generic;
using System.Linq;
using System.Text;
using System.Threading.Tasks;

namespace Alpha.Model
{
    public class ChangeClientRequest
    {
        public Guid PolicyId { get; set; }
        public ClientRequest Client { get; set; }
    }
}