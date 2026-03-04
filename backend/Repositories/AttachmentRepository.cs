using CommonFields.API.Data;
using CommonFields.API.Models;
using Microsoft.EntityFrameworkCore;

namespace CommonFields.API.Repositories;

public class AttachmentRepository(AppDbContext db) : IAttachmentRepository
{
    public Task<IEnumerable<Attachment>> GetByProductIdAsync(int productId) =>
        Task.FromResult<IEnumerable<Attachment>>(
            db.Attachments.Where(a => a.ProductId == productId).AsEnumerable());

    public Task<Attachment?> GetByIdAsync(Guid id) =>
        db.Attachments.FirstOrDefaultAsync(a => a.Id == id);

    public async Task<Attachment> CreateAsync(Attachment attachment)
    {
        db.Attachments.Add(attachment);
        await db.SaveChangesAsync();
        return attachment;
    }

    public async Task DeleteAsync(Attachment attachment)
    {
        db.Attachments.Remove(attachment);
        await db.SaveChangesAsync();
    }
}
