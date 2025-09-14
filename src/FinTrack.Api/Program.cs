var builder = WebApplication.CreateBuilder(args);

// Controllers + Swagger services
builder.Services.AddControllers();              // MVC controllers
builder.Services.AddEndpointsApiExplorer();     // describes endpoints for OpenAPI
builder.Services.AddSwaggerGen();               // Swagger generator

var app = builder.Build();

// Swagger middleware in Dev
if (app.Environment.IsDevelopment())
{
    app.UseSwagger();                           // exposes /swagger/v1/swagger.json
    app.UseSwaggerUI();                         // serves the Swagger UI at /swagger
}

app.UseHttpsRedirection();                      // 301s http->https if https is available
app.MapControllers();                           // connects controller routes into the pipeline

app.Run();
