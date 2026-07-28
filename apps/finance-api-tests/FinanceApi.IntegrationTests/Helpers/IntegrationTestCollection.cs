namespace FinanceApi.IntegrationTests.Helpers;

/// <summary>
/// Groups both integration test classes into a single xUnit collection so they
/// share one FinanceWebApplicationFactory instance and run sequentially.
/// This avoids Serilog static-logger conflicts that arise when two TestServers
/// start in parallel.
/// </summary>
[CollectionDefinition("Finance Integration")]
public class IntegrationTestCollection : ICollectionFixture<FinanceWebApplicationFactory> { }
