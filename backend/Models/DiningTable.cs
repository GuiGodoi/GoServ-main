namespace Backend.Models
{
    public class DiningTable
    {
        public int Id { get; set; }
        public string Label { get; set; } = string.Empty;
        public bool Active { get; set; } = true;
        public ICollection<TableSession>? Sessions { get; set; }
    }
}
