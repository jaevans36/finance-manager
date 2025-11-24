using Microsoft.EntityFrameworkCore;
using FinanceApi.Features.Auth.Models;
using FinanceApi.Features.Tasks.Models;
using FinanceApi.Features.Finance.Models;
using FinanceApi.Features.Common.Sessions.Models;
using FinanceApi.Features.Common.ActivityLogs.Models;
using FinanceApi.Features.Common.EmailVerification.Models;

namespace FinanceApi.Data;

public class FinanceDbContext : DbContext
{
    public FinanceDbContext(DbContextOptions<FinanceDbContext> options) : base(options)
    {
    }

    // Finance domain
    public DbSet<Account> Accounts { get; set; }
    public DbSet<Transaction> Transactions { get; set; }
    public DbSet<Category> Categories { get; set; }
    public DbSet<Budget> Budgets { get; set; }
    
    // Todo/Auth domain
    public DbSet<User> Users { get; set; }
    public DbSet<FinanceApi.Features.Tasks.Models.Task> Tasks { get; set; }
    public DbSet<Session> Sessions { get; set; }
    public DbSet<EmailToken> EmailTokens { get; set; }
    public DbSet<ActivityLog> ActivityLogs { get; set; }

    protected override void OnModelCreating(ModelBuilder modelBuilder)
    {
        base.OnModelCreating(modelBuilder);

        // Account configuration
        modelBuilder.Entity<Account>(entity =>
        {
            entity.ToTable("accounts");
            entity.HasKey(e => e.Id);
            entity.Property(e => e.Id).HasColumnName("id");
            entity.Property(e => e.UserId).HasColumnName("user_id").IsRequired();
            entity.Property(e => e.Name).HasColumnName("name").IsRequired().HasMaxLength(100);
            entity.Property(e => e.Type).HasColumnName("type").IsRequired().HasMaxLength(20);
            entity.Property(e => e.Institution).HasColumnName("institution");
            entity.Property(e => e.AccountNumber).HasColumnName("account_number");
            entity.Property(e => e.Balance).HasColumnName("balance").HasColumnType("decimal(18,2)");
            entity.Property(e => e.Currency).HasColumnName("currency").HasMaxLength(3);
            entity.Property(e => e.IsActive).HasColumnName("is_active");
            entity.Property(e => e.CreatedAt).HasColumnName("created_at");
            entity.Property(e => e.UpdatedAt).HasColumnName("updated_at");

            entity.HasIndex(e => e.UserId);
        });

        // Transaction configuration
        modelBuilder.Entity<Transaction>(entity =>
        {
            entity.ToTable("transactions");
            entity.HasKey(e => e.Id);
            entity.Property(e => e.Id).HasColumnName("id");
            entity.Property(e => e.AccountId).HasColumnName("account_id").IsRequired();
            entity.Property(e => e.Date).HasColumnName("date").IsRequired();
            entity.Property(e => e.Description).HasColumnName("description").IsRequired().HasMaxLength(200);
            entity.Property(e => e.Amount).HasColumnName("amount").HasColumnType("decimal(18,2)").IsRequired();
            entity.Property(e => e.Type).HasColumnName("type").HasMaxLength(50);
            entity.Property(e => e.CategoryId).HasColumnName("category_id");
            entity.Property(e => e.Notes).HasColumnName("notes");
            entity.Property(e => e.Merchant).HasColumnName("merchant");
            entity.Property(e => e.ReferenceNumber).HasColumnName("reference_number");
            entity.Property(e => e.IsReconciled).HasColumnName("is_reconciled");
            entity.Property(e => e.CreatedAt).HasColumnName("created_at");
            entity.Property(e => e.UpdatedAt).HasColumnName("updated_at");

            entity.HasOne(t => t.Account)
                  .WithMany(a => a.Transactions)
                  .HasForeignKey(t => t.AccountId)
                  .OnDelete(DeleteBehavior.Cascade);

            entity.HasOne(t => t.Category)
                  .WithMany(c => c.Transactions)
                  .HasForeignKey(t => t.CategoryId)
                  .OnDelete(DeleteBehavior.SetNull);

            entity.HasIndex(e => e.AccountId);
            entity.HasIndex(e => e.Date);
            entity.HasIndex(e => e.CategoryId);
        });

        // Category configuration
        modelBuilder.Entity<Category>(entity =>
        {
            entity.ToTable("categories");
            entity.HasKey(e => e.Id);
            entity.Property(e => e.Id).HasColumnName("id");
            entity.Property(e => e.UserId).HasColumnName("user_id").IsRequired();
            entity.Property(e => e.Name).HasColumnName("name").IsRequired().HasMaxLength(100);
            entity.Property(e => e.Type).HasColumnName("type").HasMaxLength(50);
            entity.Property(e => e.Color).HasColumnName("color");
            entity.Property(e => e.Icon).HasColumnName("icon");
            entity.Property(e => e.ParentCategoryId).HasColumnName("parent_category_id");
            entity.Property(e => e.CreatedAt).HasColumnName("created_at");
            entity.Property(e => e.UpdatedAt).HasColumnName("updated_at");

            entity.HasOne(c => c.ParentCategory)
                  .WithMany(c => c.SubCategories)
                  .HasForeignKey(c => c.ParentCategoryId)
                  .OnDelete(DeleteBehavior.Restrict);

            entity.HasIndex(e => e.UserId);
            entity.HasIndex(e => e.ParentCategoryId);
        });

        // Budget configuration
        modelBuilder.Entity<Budget>(entity =>
        {
            entity.ToTable("budgets");
            entity.HasKey(e => e.Id);
            entity.Property(e => e.Id).HasColumnName("id");
            entity.Property(e => e.UserId).HasColumnName("user_id").IsRequired();
            entity.Property(e => e.Name).HasColumnName("name").IsRequired().HasMaxLength(100);
            entity.Property(e => e.CategoryId).HasColumnName("category_id");
            entity.Property(e => e.Amount).HasColumnName("amount").HasColumnType("decimal(18,2)").IsRequired();
            entity.Property(e => e.Period).HasColumnName("period").HasMaxLength(20);
            entity.Property(e => e.StartDate).HasColumnName("start_date");
            entity.Property(e => e.EndDate).HasColumnName("end_date");
            entity.Property(e => e.IsActive).HasColumnName("is_active");
            entity.Property(e => e.CreatedAt).HasColumnName("created_at");
            entity.Property(e => e.UpdatedAt).HasColumnName("updated_at");

            entity.HasOne(b => b.Category)
                  .WithMany()
                  .HasForeignKey(b => b.CategoryId)
                  .OnDelete(DeleteBehavior.SetNull);

            entity.HasIndex(e => e.UserId);
            entity.HasIndex(e => e.CategoryId);
        });

        // User configuration
        modelBuilder.Entity<User>(entity =>
        {
            entity.ToTable("users");
            entity.HasKey(e => e.Id);
            entity.HasIndex(e => e.Email).IsUnique();
        });

        // Task configuration
        modelBuilder.Entity<FinanceApi.Features.Tasks.Models.Task>(entity =>
        {
            entity.ToTable("tasks");
            entity.HasKey(e => e.Id);
            
            entity.HasOne(t => t.User)
                  .WithMany(u => u.Tasks)
                  .HasForeignKey(t => t.UserId)
                  .OnDelete(DeleteBehavior.Cascade);

            entity.HasIndex(e => e.UserId);
            entity.HasIndex(e => new { e.UserId, e.DueDate });
            entity.HasIndex(e => new { e.UserId, e.Priority });
            entity.HasIndex(e => new { e.UserId, e.Completed, e.CreatedAt });
        });

        // EmailToken configuration
        modelBuilder.Entity<EmailToken>(entity =>
        {
            entity.ToTable("email_tokens");
            entity.HasKey(e => e.Id);
            entity.HasIndex(e => e.Token).IsUnique();
            
            entity.HasOne(et => et.User)
                  .WithMany(u => u.EmailTokens)
                  .HasForeignKey(et => et.UserId)
                  .OnDelete(DeleteBehavior.Cascade);

            entity.HasIndex(e => e.UserId);
            entity.HasIndex(e => e.ExpiresAt);
        });

        // Session configuration
        modelBuilder.Entity<Session>(entity =>
        {
            entity.ToTable("sessions");
            entity.HasKey(e => e.Id);
            entity.HasIndex(e => e.Token).IsUnique();
            
            entity.HasOne(s => s.User)
                  .WithMany(u => u.Sessions)
                  .HasForeignKey(s => s.UserId)
                  .OnDelete(DeleteBehavior.Cascade);

            entity.HasIndex(e => e.UserId);
            entity.HasIndex(e => e.ExpiresAt);
        });

        // ActivityLog configuration
        modelBuilder.Entity<ActivityLog>(entity =>
        {
            entity.ToTable("activity_logs");
            entity.HasKey(e => e.Id);
            
            entity.HasOne(al => al.User)
                  .WithMany(u => u.ActivityLogs)
                  .HasForeignKey(al => al.UserId)
                  .OnDelete(DeleteBehavior.Cascade);

            entity.HasIndex(e => e.UserId);
            entity.HasIndex(e => e.CreatedAt);
        });
    }
}
