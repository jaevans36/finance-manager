namespace FinanceApi.Features.Settings.Models;

public class UserFinanceSettings
{
    public Guid UserId { get; set; }
    public decimal? ManualMonthlyIncome { get; set; }
    public decimal EmergencyBuffer { get; set; } = 200m;
}
