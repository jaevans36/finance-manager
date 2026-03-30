# Finance API Testing Guide

A comprehensive guide to testing in C# with .NET 8, xUnit, Moq, and FluentAssertions

## 📚 Table of Contents

- [Overview](#overview)
- [Testing Stack](#testing-stack)
- [Project Structure](#project-structure)
- [Running Tests](#running-tests)
- [Unit Testing](#unit-testing)
- [Integration Testing](#integration-testing)
- [Best Practices](#best-practices)
- [Learning Resources](#learning-resources)

## Overview

This project demonstrates professional testing practices in C# .NET applications. We use two types of tests:

- **Unit Tests**: Test individual components (services, models) in isolation
- **Integration Tests**: Test complete HTTP request/response cycles through the API

## Testing Stack

| Package | Version | Purpose |
|---------|---------|---------|
| xUnit | Latest | Test framework - industry standard for .NET |
| Moq | 4.20.72 | Mocking framework - create fake dependencies |
| FluentAssertions | 8.8.0 | Readable assertions - makes tests easier to understand |
| Microsoft.EntityFrameworkCore.InMemory | 8.0.11 | In-memory database for testing |
| Microsoft.AspNetCore.Mvc.Testing | 8.0.11 | Test server for integration tests |
| coverlet.collector | 6.0.4 | Code coverage collection |

## Project Structure

```
apps/finance-api-tests/
├── FinanceApi.UnitTests/              # Unit tests project
│   ├── Features/
│   │   ├── Auth/
│   │   │   └── Services/
│   │   │       └── AuthServiceTests.cs          # Tests for AuthService
│   │   └── Tasks/
│   │       └── Services/
│   │           └── TaskServiceTests.cs          # Tests for TaskService
│   └── Helpers/                        # Test utility classes
│
├── FinanceApi.IntegrationTests/        # Integration tests project
│   ├── Features/
│   │   ├── Auth/
│   │   │   └── AuthControllerTests.cs           # API endpoint tests
│   │   └── Tasks/
│   │       └── TasksControllerTests.cs          # API endpoint tests
│   └── Helpers/
│       └── CustomWebApplicationFactory.cs       # Test server setup
```

## Running Tests

### Run All Tests

```powershell
# From repository root
cd apps/finance-api-tests

# Run unit tests
cd FinanceApi.UnitTests
dotnet test

# Run integration tests
cd ../FinanceApi.IntegrationTests
dotnet test

# Run all tests in solution
cd ..
dotnet test
```

### Run Specific Tests

```powershell
# Run a specific test class
dotnet test --filter "FullyQualifiedName~AuthServiceTests"

# Run a specific test method
dotnet test --filter "FullyQualifiedName~LoginAsync_WithValidCredentials"

# Run tests by category/trait
dotnet test --filter "Category=Unit"
```

### Run with Coverage

```powershell
# Run tests with coverage using the configuration file
cd apps/finance-api-tests
dotnet test --collect:"XPlat Code Coverage" --settings coverlet.runsettings

# Generate HTML coverage report (requires ReportGenerator tool)
# Install ReportGenerator globally (one-time setup):
dotnet tool install -g dotnet-reportgenerator-globaltool

# Generate the report:
reportgenerator -reports:**/coverage.cobertura.xml -targetdir:./CoverageReport -reporttypes:Html

# Open the report in browser:
start ./CoverageReport/index.html
```

**Coverage Goals:**
- **Line Coverage**: Aim for 80%+ (measures which lines of code are executed)
- **Branch Coverage**: Aim for 70%+ (measures which conditional paths are tested)

**Excluded from Coverage:**
- Test projects themselves
- Migration files
- Program.cs (startup configuration)
- Generated code

### Watch Mode (Re-run on changes)

```powershell
dotnet watch test
```

## Unit Testing

### What are Unit Tests?

Unit tests verify individual components (classes, methods) work correctly **in isolation**. They:
- Test ONE thing at a time
- Run FAST (milliseconds)
- Use MOCKS for dependencies
- Don't touch external systems (database, network, file system)

### Anatomy of a Unit Test (AAA Pattern)

```csharp
[Fact] // xUnit attribute marking this as a test
public async Task RegisterAsync_WithValidData_ShouldCreateUserAndSession()
{
    // ARRANGE - Setup test data and configure mocks
    var request = new RegisterRequest
    {
        Email = "test@example.com",
        Password = "Password123!"
    };
    
    _mockPasswordHasher
        .Setup(x => x.HashPassword(request.Password))
        .Returns("hashed_password");
    
    // ACT - Execute the method being tested
    var result = await _authService.RegisterAsync(request, "127.0.0.1", "TestAgent");
    
    // ASSERT - Verify expected outcomes
    result.Should().NotBeNull();
    result.Token.Should().NotBeNullOrEmpty();
    result.User.Email.Should().Be(request.Email);
    
    // Verify mock was called
    _mockPasswordHasher.Verify(x => x.HashPassword(request.Password), Times.Once);
}
```

### Key Concepts

#### 1. Test Attributes

```csharp
[Fact]  // Single test case
public async Task MyTest() { }

[Theory]  // Test with multiple input values
[InlineData("Low")]
[InlineData("Medium")]
[InlineData("High")]
public async Task TestWithMultipleInputs(string priority) { }
```

#### 2. Mocking with Moq

```csharp
// Create a mock
var mockService = new Mock<IMyService>();

// Setup return value
mockService.Setup(x => x.GetData()).Returns("test data");

// Setup async method
mockService.Setup(x => x.GetDataAsync()).ReturnsAsync("test data");

// Setup with parameter matching
mockService.Setup(x => x.Process(It.IsAny<string>())).Returns(true);

// Verify method was called
mockService.Verify(x => x.GetData(), Times.Once);
mockService.Verify(x => x.Process("specific value"), Times.Exactly(2));
```

#### 3. FluentAssertions

```csharp
// Much more readable than Assert.Equal!
result.Should().NotBeNull();
result.Should().Be(expectedValue);
result.Should().BeGreaterThan(5);
result.Should().BeCloseTo(DateTime.Now, TimeSpan.FromSeconds(5));

// Collections
list.Should().HaveCount(3);
list.Should().Contain(x => x.Name == "Test");
list.Should().BeInAscendingOrder(x => x.CreatedAt);

// Exceptions
var act = () => DoSomething();
act.Should().Throw<ArgumentException>()
   .WithMessage("Invalid input");

// Async exceptions
var act = async () => await DoSomethingAsync();
await act.Should().ThrowAsync<InvalidOperationException>();
```

#### 4. In-Memory Database

```csharp
public class MyTests : IDisposable
{
    private readonly DbContext _context;
    
    public MyTests()
    {
        // Create unique database per test (isolation!)
        var options = new DbContextOptionsBuilder<MyDbContext>()
            .UseInMemoryDatabase(databaseName: Guid.NewGuid().ToString())
            .Options;
            
        _context = new MyDbContext(options);
    }
    
    public void Dispose()
    {
        // Clean up after each test
        _context.Database.EnsureDeleted();
        _context.Dispose();
    }
}
```

### Example: Testing a Service Method

```csharp
[Fact]
public async Task CreateTaskAsync_WithValidData_ShouldCreateTask()
{
    // Arrange
    var request = new CreateTaskRequest
    {
        Title = "Test Task",
        Priority = "High"
    };
    
    // Act
    var result = await _taskService.CreateTaskAsync(userId, request);
    
    // Assert
    result.Should().NotBeNull();
    result.Title.Should().Be("Test Task");
    result.Priority.Should().Be("High");
    result.Completed.Should().BeFalse();
    
    // Verify database persistence
    var savedTask = await _context.Tasks.FindAsync(result.Id);
    savedTask.Should().NotBeNull();
    savedTask!.Title.Should().Be("Test Task");
}
```

## Integration Testing

### What are Integration Tests?

Integration tests verify multiple components work together correctly, including:
- HTTP request/response cycle
- Routing
- Authentication/Authorization
- Serialization/Deserialization
- Database interactions

### WebApplicationFactory

Integration tests use `WebApplicationFactory` to create a test server:

```csharp
public class CustomWebApplicationFactory : WebApplicationFactory<Program>
{
    protected override void ConfigureWebHost(IWebHostBuilder builder)
    {
        builder.ConfigureServices(services =>
        {
            // Replace real database with in-memory database
            services.AddDbContext<FinanceDbContext>(options =>
                options.UseInMemoryDatabase("InMemoryTestDb"));
        });
    }
}
```

### Example: Testing an API Endpoint

```csharp
public class AuthControllerTests : IClassFixture<CustomWebApplicationFactory>
{
    private readonly HttpClient _client;
    
    public AuthControllerTests(CustomWebApplicationFactory factory)
    {
        _client = factory.CreateClient();
    }
    
    [Fact]
    public async Task Register_WithValidData_ShouldReturnToken()
    {
        // Arrange
        var request = new RegisterRequest
        {
            Email = "test@example.com",
            Password = "Password123!"
        };
        
        // Act - Make real HTTP request to test server
        var response = await _client.PostAsJsonAsync("/api/v1/auth/register", request);
        
        // Assert HTTP response
        response.StatusCode.Should().Be(HttpStatusCode.OK);
        
        // Assert response body
        var result = await response.Content.ReadFromJsonAsync<AuthResponse>();
        result.Should().NotBeNull();
        result!.Token.Should().NotBeNullOrEmpty();
        result.User.Email.Should().Be("test@example.com");
    }
}
```

### Testing Authenticated Endpoints

```csharp
[Fact]
public async Task GetTasks_WithAuth_ShouldReturnTasks()
{
    // 1. Get auth token
    var registerResponse = await _client.PostAsJsonAsync("/api/v1/auth/register", registerRequest);
    var authResponse = await registerResponse.Content.ReadFromJsonAsync<AuthResponse>();
    
    // 2. Add token to requests
    _client.DefaultRequestHeaders.Authorization = 
        new AuthenticationHeaderValue("Bearer", authResponse!.Token);
    
    // 3. Make authenticated request
    var response = await _client.GetAsync("/api/v1/tasks");
    
    // 4. Assert
    response.StatusCode.Should().Be(HttpStatusCode.OK);
}
```

## Best Practices

### 1. Test Naming

Use descriptive names that explain what is being tested:

```csharp
// ❌ Bad
[Fact]
public async Task Test1() { }

// ✅ Good
[Fact]
public async Task LoginAsync_WithInvalidPassword_ShouldReturnUnauthorized() { }
```

**Format**: `MethodName_Scenario_ExpectedBehavior`

### 2. One Assert Per Concept

```csharp
// ❌ Bad - Testing multiple unrelated things
[Fact]
public async Task TestEverything()
{
    // Tests registration, login, task creation, deletion...
}

// ✅ Good - Each test focuses on one behavior
[Fact]
public async Task RegisterAsync_WithValidData_ShouldCreateUser() { }

[Fact]
public async Task RegisterAsync_WithExistingEmail_ShouldThrowException() { }
```

### 3. Test Independence

Each test should be completely independent:

```csharp
// ❌ Bad - Tests depend on execution order
[Fact]
public void Test1_CreateUser() { /* creates user */ }

[Fact]
public void Test2_LoginUser() { /* assumes user from Test1 exists */ }

// ✅ Good - Each test sets up its own data
[Fact]
public void LoginAsync_ShouldSucceed()
{
    // Arrange - Create test user in THIS test
    var user = CreateTestUser();
    // ... rest of test
}
```

### 4. Use Test Helpers

Extract common setup logic:

```csharp
private async Task<string> GetAuthTokenAsync()
{
    var request = new RegisterRequest
    {
        Email = $"test{Guid.NewGuid()}@example.com",
        Password = "Password123!"
    };
    
    var response = await _client.PostAsJsonAsync("/api/v1/auth/register", request);
    var authResponse = await response.Content.ReadFromJsonAsync<AuthResponse>();
    return authResponse!.Token;
}

// Use in tests
[Fact]
public async Task CreateTask_WithAuth_ShouldSucceed()
{
    var token = await GetAuthTokenAsync(); // Reusable!
    _client.DefaultRequestHeaders.Authorization = 
        new AuthenticationHeaderValue("Bearer", token);
    // ... rest of test
}
```

### 5. Test Both Success and Failure Cases

```csharp
// Success case
[Fact]
public async Task UpdateTask_WithValidData_ShouldUpdateTask() { }

// Failure cases
[Fact]
public async Task UpdateTask_WithNonExistentTask_ShouldReturnNotFound() { }

[Fact]
public async Task UpdateTask_WithoutAuth_ShouldReturnUnauthorized() { }

[Fact]
public async Task UpdateTask_WithDifferentUser_ShouldReturnForbidden() { }
```

### 6. Use Theory for Similar Tests

```csharp
// Instead of multiple similar tests
[Theory]
[InlineData("Low")]
[InlineData("Medium")]
[InlineData("High")]
public async Task CreateTask_WithValidPriority_ShouldSucceed(string priority)
{
    var request = new CreateTaskRequest { Title = "Test", Priority = priority };
    var result = await _taskService.CreateTaskAsync(userId, request);
    result.Priority.Should().Be(priority);
}
```

## Learning Resources

### C# Testing Fundamentals

1. **xUnit Documentation**: https://xunit.net/
2. **Moq Quickstart**: https://github.com/moq/moq4/wiki/Quickstart
3. **FluentAssertions**: https://fluentassertions.com/introduction

### Advanced Topics

- **Test-Driven Development (TDD)**: Write tests before code
- **Behavior-Driven Development (BDD)**: SpecFlow for human-readable tests
- **Mutation Testing**: Stryker.NET for testing your tests
- **Property-Based Testing**: FsCheck for discovering edge cases

### Recommended Reading

- "The Art of Unit Testing" by Roy Osherove
- "xUnit Test Patterns" by Gerard Meszaros
- "Working Effectively with Legacy Code" by Michael Feathers

## Common Pitfalls and Solutions

### Problem: Tests are slow

**Cause**: Touching external systems (database, network)

**Solution**: Use in-memory database, mock external dependencies

### Problem: Tests fail randomly

**Cause**: Tests depend on shared state or execution order

**Solution**: Ensure test independence, use unique data per test

### Problem: Hard to understand test failures

**Cause**: Poor assertions, unclear test names

**Solution**: Use FluentAssertions, descriptive test names

### Problem: Tests are brittle (break on small changes)

**Cause**: Testing implementation details instead of behavior

**Solution**: Test public API, focus on outcomes not internals

## Next Steps

1. **Run the existing tests** and observe the output
2. **Read through the test code** - it's heavily commented for learning
3. **Try writing your own test** for a new feature
4. **Practice TDD** - write a failing test, make it pass, refactor
5. **Add tests for edge cases** you discover

## Questions?

The test files (`AuthServiceTests.cs`, `TaskServiceTests.cs`, etc.) contain extensive comments explaining each concept. Read through them to understand testing patterns!

---

**Happy Testing! 🧪**
