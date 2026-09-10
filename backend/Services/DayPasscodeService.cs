using System.Security.Cryptography;
using Backend.Data;
using Backend.Models;
using Microsoft.EntityFrameworkCore;

namespace Backend.Services
{
    public interface IDayPasscodeService
    {
        Task<DayPasscode> GetOrCreateTodayAsync();
        Task<DayPasscode> RotateTodayAsync();
        Task<bool> ValidateAsync(string code);
        DateOnly TodayInRestaurant();
    }

    public class DayPasscodeService : IDayPasscodeService
    {
        private readonly ApplicationDbContext _db;

        public DayPasscodeService(ApplicationDbContext db)
        {
            _db = db;
        }

        /// <summary>Dia civil em UTC−3 (aproximação SP) para a senha do expediente.</summary>
        public DateOnly TodayInRestaurant() =>
            DateOnly.FromDateTime(DateTime.UtcNow.AddHours(-3));

        public async Task<DayPasscode> GetOrCreateTodayAsync()
        {
            var day = TodayInRestaurant();
            var existing = await _db.DayPasscodes.FirstOrDefaultAsync(d => d.Day == day);
            if (existing is not null) return existing;

            var created = new DayPasscode
            {
                Day = day,
                Code = GenerateCode(),
                CreatedAt = DateTime.UtcNow
            };
            _db.DayPasscodes.Add(created);
            await _db.SaveChangesAsync();
            return created;
        }

        public async Task<DayPasscode> RotateTodayAsync()
        {
            var day = TodayInRestaurant();
            var existing = await _db.DayPasscodes.FirstOrDefaultAsync(d => d.Day == day);
            if (existing is null)
                return await GetOrCreateTodayAsync();

            existing.Code = GenerateCode();
            existing.RotatedAt = DateTime.UtcNow;
            await _db.SaveChangesAsync();
            return existing;
        }

        public async Task<bool> ValidateAsync(string code)
        {
            if (string.IsNullOrWhiteSpace(code)) return false;
            var today = await GetOrCreateTodayAsync();
            return string.Equals(today.Code.Trim(), code.Trim(), StringComparison.OrdinalIgnoreCase);
        }

        private static string GenerateCode()
        {
            // 6 dígitos fáceis de ditar no salão
            var n = RandomNumberGenerator.GetInt32(100000, 1000000);
            return n.ToString();
        }
    }
}
