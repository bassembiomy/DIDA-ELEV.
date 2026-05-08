using DidaElev.Engine.Core;
using DidaElev.Engine.Models;
using Microsoft.AspNetCore.Mvc;

var builder = WebApplication.CreateBuilder(args);

// Add services to the container.
builder.Services.AddEndpointsApiExplorer();
builder.Services.AddSwaggerGen();
builder.Services.AddSingleton<ParametricSolver>();
builder.Services.AddSingleton<GeometryEngine>();
builder.Services.AddSingleton<DrawingEngine>();
builder.Services.AddSingleton<SimulationController>();

// Enable CORS for local Electron development
builder.Services.AddCors(options =>
{
    options.AddPolicy("AllowElectron",
        policy => policy.AllowAnyOrigin().AllowAnyMethod().AllowAnyHeader());
});

var app = builder.Build();

app.UseCors("AllowElectron");

// API Endpoints
app.MapPost("/api/solver/calculate", ([FromBody] ElevatorConfig config, ParametricSolver solver) =>
{
    try 
    {
        var result = solver.Solve(config);
        return Results.Ok(result);
    }
    catch (Exception ex)
    {
        return Results.Problem(ex.Message);
    }
})
.WithName("CalculateEngineering")
.WithOpenApi();

app.MapPost("/api/geometry/assembly", ([FromBody] ElevatorConfig config, GeometryEngine engine) =>
{
    try 
    {
        var assembly = engine.GenerateAssembly(config);
        return Results.Ok(assembly);
    }
    catch (Exception ex)
    {
        return Results.Problem(ex.Message);
    }
})
.WithName("GetGeometry")
.WithOpenApi();

app.MapPost("/api/geometry/drawings", ([FromBody] ElevatorConfig config, DrawingEngine engine, ParametricSolver solver) =>
{
    try 
    {
        var eng = solver.Solve(config);
        var drawing = engine.GenerateDrawings(config, eng);
        return Results.Ok(drawing);
    }
    catch (Exception ex)
    {
        return Results.Problem(ex.Message);
    }
})
.WithName("GetDrawings")
.WithOpenApi();

app.MapPost("/api/simulation/tick", ([FromBody] ElevatorConfig config, SimulationController sim) =>
{
    var updated = sim.Tick(config, 0.016); // 16ms approx for 60fps
    return Results.Ok(updated);
})
.WithName("SimTick")
.WithOpenApi();

app.MapGet("/api/health", () => Results.Ok(new { status = "Engine Running", timestamp = DateTime.Now }))
.WithName("HealthCheck")
.WithOpenApi();

app.Run();
