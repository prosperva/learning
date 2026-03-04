using CommonFields.API.Services;
using Microsoft.AspNetCore.Mvc;

namespace CommonFields.API.Controllers;

[ApiController]
[Route("api/products/{productId:int}/attachments")]
public class AttachmentsController(IAttachmentService service) : ControllerBase
{
    // GET /api/products/{productId}/attachments
    [HttpGet]
    public async Task<IActionResult> GetByProduct(int productId)
    {
        var result = await service.GetByProductIdAsync(productId);
        if (result is null) return NotFound(new { message = "Product not found" });
        return Ok(result);
    }

    // POST /api/products/{productId}/attachments  (multipart/form-data)
    [HttpPost]
    [RequestSizeLimit(50 * 1024 * 1024)] // 50 MB
    public async Task<IActionResult> Upload(int productId, IFormFile? file)
    {
        if (file is null || file.Length == 0)
            return BadRequest(new { message = "No file provided" });

        var result = await service.UploadAsync(productId, file, Request);
        if (result is null) return NotFound(new { message = "Product not found" });
        return StatusCode(201, new { attachment = result });
    }

    // DELETE /api/products/{productId}/attachments/{attachmentId}
    [HttpDelete("{attachmentId:guid}")]
    public async Task<IActionResult> Delete(int productId, Guid attachmentId)
    {
        var deleted = await service.DeleteAsync(productId, attachmentId);
        if (!deleted) return NotFound(new { message = "Attachment not found" });
        return NoContent();
    }

    // GET /api/products/{productId}/attachments/{attachmentId}/download
    [HttpGet("{attachmentId:guid}/download")]
    public async Task<IActionResult> Download(int productId, Guid attachmentId)
    {
        var result = await service.DownloadAsync(productId, attachmentId);
        if (result is null) return NotFound(new { message = "Attachment not found" });
        return File(result.Value.Stream, result.Value.MimeType, result.Value.FileName);
    }
}
