CREATE TABLE AuditLogs (
    Id        INT IDENTITY(1,1) PRIMARY KEY,
    TableName NVARCHAR(128) NOT NULL,
    RecordId  NVARCHAR(128) NOT NULL,
    Operation NVARCHAR(20)  NOT NULL,
    ChangedBy NVARCHAR(256) NOT NULL,
    ChangedAt DATETIME2    NOT NULL,
    Changes   NVARCHAR(MAX) NOT NULL DEFAULT '{}'
);

CREATE INDEX IX_AuditLogs_Table_Record
    ON AuditLogs (TableName, RecordId, ChangedAt DESC);

CREATE TABLE AuditFieldConfigs (
    Id          INT IDENTITY(1,1) PRIMARY KEY,
    TableName   NVARCHAR(128) NOT NULL,
    FieldName   NVARCHAR(128) NOT NULL,
    IsEnabled   BIT           NOT NULL DEFAULT 0,
    DisplayName NVARCHAR(256) NULL,
    CONSTRAINT UQ_AuditFieldConfigs_Table_Field UNIQUE (TableName, FieldName)
);

CREATE TABLE AuditRouteConfigs (
    Id        INT IDENTITY(1,1) PRIMARY KEY,
    Route     NVARCHAR(128) NOT NULL,
    TableName NVARCHAR(256) NOT NULL,
    CONSTRAINT UQ_AuditRouteConfigs_Route UNIQUE (Route)
);