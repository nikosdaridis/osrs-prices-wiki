namespace Application.Models
{
    public class ItemModel
    {
        public int Id { get; set; }
        public string? Icon { get; set; }
        public string? Name { get; set; }
        public string? Examine { get; set; }
        public int InstaBuy { get; set; }
        public int InstaSell { get; set; }
        public long InstaBuyTime { get; set; }
        public long InstaSellTime { get; set; }
        public int Limit { get; set; }
        public int Value { get; set; }
        public int HighAlch { get; set; }
        public int LowAlch { get; set; }
        public bool Members { get; set; }
        public double RoiPercentage { get; set; }
        public int Margin { get; set; }
        public long MarginXVolume { get; set; }
        public int Volume { get; set; }
        public int Tax { get; set; }
    }
}
