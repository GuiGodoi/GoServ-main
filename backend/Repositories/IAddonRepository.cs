using Backend.Models;

namespace Backend.Repositories
{
    /// <summary>Acesso a dados dos adicionais (addons) dos produtos do cardápio.</summary>
    public interface IAddonRepository
    {
        Task<List<Addon>> GetByMenuItemIdsAsync(IEnumerable<int> menuItemIds, bool onlyAvailable = true);
        Task<List<Addon>> GetByMenuItemIdAsync(int menuItemId, bool onlyAvailable = true);
    }
}
