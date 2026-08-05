using Alpha.Repository;
using Alpha.Repository.Common;
using Alpha.Service;
using Alpha.Service.Common;

// JWT token authentication
using Microsoft.AspNetCore.Authentication.JwtBearer;
using Microsoft.IdentityModel.Tokens;
using System.Text;

var builder = WebApplication.CreateBuilder(args);

builder.Services.AddAuthentication(JwtBearerDefaults.AuthenticationScheme)
    .AddJwtBearer(options =>
    {
        options.TokenValidationParameters = new TokenValidationParameters
        {
            ValidateIssuer = true,
            ValidateAudience = true,
            ValidateLifetime = true,
            ValidateIssuerSigningKey = true,
            ValidIssuer = builder.Configuration["Jwt:Issuer"],
            ValidAudience = builder.Configuration["Jwt:Audience"],
            IssuerSigningKey = new SymmetricSecurityKey(
                Encoding.UTF8.GetBytes(builder.Configuration["Jwt:Key"]))
        };
    });

builder.Services.AddCors(options =>
{
    var allowedOrigins = new[]
    {
        "http://localhost:3000",
        "http://127.0.0.1:3000",
        "http://localhost:5000",
        "http://127.0.0.1:5000",
        "http://localhost:5055",
        "http://127.0.0.1:5055"
    };

    options.AddPolicy("AllowReact",
        policy => policy.WithOrigins(allowedOrigins)
                        .AllowAnyMethod()
                        .AllowAnyHeader());
});

builder.Services.AddAuthorization();
builder.Services.AddControllers();
builder.Services.AddEndpointsApiExplorer();
builder.Services.AddSwaggerGen();

string connectionString = builder.Configuration.GetConnectionString("DefaultConnection")
                          ?? throw new InvalidOperationException("Connection string NOT found!");

// repositories
builder.Services.AddScoped<IClientRepository>(sp => new ClientRepository(connectionString));
builder.Services.AddScoped<IAgentRepository>(sp => new AgentRepository(connectionString));
builder.Services.AddScoped<IInsurancePolicyRepository>(sp => new InsurancePolicyRepository(connectionString));
builder.Services.AddScoped<ILocationRepository>(sp => new LocationRepository(connectionString));
builder.Services.AddScoped<IInsuranceCompanyRepository>(sp => new InsuranceCompanyRepository(connectionString));
builder.Services.AddScoped<IPartnerRepository>(sp => new PartnerRepository(connectionString));
builder.Services.AddScoped<IPolicyTypeRepository>(sp => new PolicyTypeRepository(connectionString));

// services
builder.Services.AddScoped<IClientService, ClientService>();
builder.Services.AddScoped<IAgentService, AgentService>();
builder.Services.AddScoped<IInsurancePolicyService, InsurancePolicyService>();
builder.Services.AddScoped<ILocationService, LocationService>();
builder.Services.AddScoped<IInsuranceCompanyService, InsuranceCompanyService>();
builder.Services.AddScoped<IPartnerService, PartnerService>();
builder.Services.AddScoped<IPolicyTypeService, PolicyTypeService>();
builder.Services.AddScoped<JwtService>();

builder.Services.AddSwaggerGen();

var app = builder.Build();
app.UseSwagger();
app.UseSwaggerUI();

app.UseCors("AllowReact");

if (app.Environment.IsDevelopment())
{
    app.UseSwagger();
    app.UseSwaggerUI();
}

app.UseAuthentication();
app.UseAuthorization();

app.UseAuthorization();
app.MapControllers();

app.Run();
