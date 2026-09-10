namespace Backend.Models
{
    /// <summary>Senha do dia compartilhada pela equipe com os clientes da mesa.</summary>
    public class DayPasscode
    {
        public int Id { get; set; }
        public DateOnly Day { get; set; }
        public string Code { get; set; } = string.Empty;
        public DateTime CreatedAt { get; set; }
        public DateTime? RotatedAt { get; set; }
    }
}
