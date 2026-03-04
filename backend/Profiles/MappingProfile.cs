using System.Text.Json;
using AutoMapper;
using CommonFields.API.DTOs;
using CommonFields.API.Models;

namespace CommonFields.API.Profiles;

public class MappingProfile : Profile
{
    private static readonly JsonSerializerOptions _json = new()
    {
        PropertyNameCaseInsensitive = true,
    };

    public MappingProfile()
    {
        // Product → ProductDto
        // Map AuditableEntity.CreatedAt → CreatedAt, ModifiedAt → UpdatedAt
        CreateMap<Product, ProductDto>()
            .ForMember(d => d.CreatedAt, opt => opt.MapFrom(s => s.CreatedAt))
            .ForMember(d => d.UpdatedAt, opt => opt.MapFrom(s => s.ModifiedAt ?? s.CreatedAt));

        // Attachment → AttachmentDto  (Url populated in service after mapping)
        CreateMap<Attachment, AttachmentDto>()
            .ForMember(d => d.Url, opt => opt.Ignore());

        // AuditLog → AuditLogDto
        CreateMap<AuditLog, AuditLogDto>()
            .ForMember(d => d.ModifiedBy,   opt => opt.MapFrom(s => s.ChangedBy))
            .ForMember(d => d.ModifiedDate, opt => opt.MapFrom(s => s.ChangedAt))
            .ForMember(d => d.Changes,      opt => opt.MapFrom(s =>
                JsonSerializer.Deserialize<Dictionary<string, AuditChangeDto>>(s.Changes, _json)
                ?? new Dictionary<string, AuditChangeDto>()));
    }
}
