using CommonFields.API.Models;

namespace CommonFields.API.Repositories;

public interface IAttachmentRepository
{
    Task<IEnumerable<Attachment>> GetByProductIdAsync(int productId);
    Task<Attachment?> GetByIdAsync(Guid id);
    Task<Attachment> CreateAsync(Attachment attachment);
    Task DeleteAsync(Attachment attachment);
}
