using Common;

namespace Application.Models.API
{
    public class ItemModel
    {
        public int Id { get; set; }
        public string? Icon { get; set; }
        public string? Name { get; set; }
        public string? Examine { get; set; }
        public long InstaBuy { get; set; }
        public long InstaSell { get; set; }
        public long HighTime { get; set; }
        public long LowTime { get; set; }
        public long Margin { get; set; }
        public double RoiPercentage { get; set; }
        public long MarginXLimit { get; set; }
        public long MarginXVolume { get; set; }
        public long Volume { get; set; }
        public int Limit { get; set; }
        public long InstaBuyTime { get; set; }
        public long InstaSellTime { get; set; }
        public int Value { get; set; }
        public int HighAlch { get; set; }
        public int LowAlch { get; set; }
        public Accessibility Accessibility { get; set; }
        public int Tax { get; set; }
    }
}
