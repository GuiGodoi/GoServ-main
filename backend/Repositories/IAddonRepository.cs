using Backend.Models;

namespace Backend.Repositories
{
    public interface IAddonRepository
    {
        Task<List<Addon>> GetByMenuItemIdsAsync(IEnumerable<int> menuItemIds, bool onlyAvailable = true);
        Task<List<Addon>> GetByMenuItemIdAsync(int menuItemId, bool onlyAvailable = true);
    }
}
