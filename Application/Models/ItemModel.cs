namespace Application.Models
{
    public class ItemModel
    {
        public int Id { get; set; }
        public string? Icon { get; set; }
        public string? Name { get; set; }
        public string? Examine { get; set; }
        public int High { get; set; }
        public int Low { get; set; }
        public long HighTime { get; set; }
        public long LowTime { get; set; }
        public int Limit { get; set; }
        public int Value { get; set; }
        public int HighAlch { get; set; }
        public int LowAlch { get; set; }
        public bool Members { get; set; }
        public int Margin { get; set; }
    }
}
