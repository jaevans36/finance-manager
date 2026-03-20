using Microsoft.EntityFrameworkCore;
using FinanceApi.Features.Auth.Models;
using FinanceApi.Features.Tasks.Models;
using FinanceApi.Features.Events.Models;
using FinanceApi.Features.Finance.Models;
using FinanceApi.Features.Common.Sessions.Models;
using FinanceApi.Features.Common.ActivityLogs.Models;
using FinanceApi.Features.Common.EmailVerification.Models;
using FinanceApi.Features.Settings.Models;
using FinanceApi.Features.Notifications.Models;
using FinanceApi.Features.Labels.Models;

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
    public DbSet<TaskGroup> TaskGroups { get; set; }
    public DbSet<Event> Events { get; set; }
    public DbSet<Session> Sessions { get; set; }
    public DbSet<EmailToken> EmailTokens { get; set; }
    public DbSet<ActivityLog> ActivityLogs { get; set; }
    public DbSet<UserSettings> UserSettings { get; set; }
    public DbSet<TaskGroupShare> TaskGroupShares { get; set; }
    public DbSet<EventShare> EventShares { get; set; }
    public DbSet<Notification> Notifications { get; set; }
    public DbSet<Label> Labels { get; set; }
    public DbSet<TaskLabel> TaskLabels { get; set; }

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
            entity.HasIndex(e => e.Username).IsUnique();
        });

        // TaskGroup configuration
        modelBuilder.Entity<TaskGroup>(entity =>
        {
            entity.ToTable("task_groups");
            entity.HasKey(e => e.Id);

            entity.HasOne(tg => tg.User)
                  .WithMany(u => u.TaskGroups)
                  .HasForeignKey(tg => tg.UserId)
                  .OnDelete(DeleteBehavior.Cascade);

            entity.HasIndex(e => e.UserId);
            entity.HasIndex(e => new { e.UserId, e.Name }).IsUnique();
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

            entity.HasOne(t => t.Group)
                  .WithMany(tg => tg.Tasks)
                  .HasForeignKey(t => t.GroupId)
                  .OnDelete(DeleteBehavior.SetNull);

            entity.HasOne(t => t.ParentTask)
                  .WithMany(t => t.Subtasks)
                  .HasForeignKey(t => t.ParentTaskId)
                  .OnDelete(DeleteBehavior.Restrict);

            entity.HasIndex(e => e.UserId);
            entity.HasIndex(e => e.GroupId);
            entity.HasIndex(e => e.ParentTaskId);
            entity.HasIndex(e => new { e.ParentTaskId, e.SortOrder });
            entity.HasIndex(e => new { e.ParentTaskId, e.Completed });
            entity.HasIndex(e => new { e.UserId, e.GroupId, e.Completed });
            entity.HasIndex(e => new { e.UserId, e.DueDate });
            entity.HasIndex(e => new { e.UserId, e.Priority });
            entity.HasIndex(e => new { e.UserId, e.Completed, e.CreatedAt });
            entity.HasIndex(e => new { e.UserId, e.Status });
            entity.HasIndex(e => new { e.UserId, e.Urgency, e.Importance });
            entity.HasIndex(e => new { e.UserId, e.EnergyLevel });
            entity.HasIndex(e => new { e.UserId, e.EnergyLevel, e.EstimatedMinutes });

            // Assignment FK - SET NULL when assignee user is deleted (task is preserved)
            entity.HasOne(t => t.AssignedTo)
                .WithMany()
                .HasForeignKey(t => t.AssignedToUserId)
                .OnDelete(DeleteBehavior.SetNull);

            entity.HasIndex(t => t.AssignedToUserId)
                .HasDatabaseName("IX_tasks_assigned_to_user_id");
        });

        // UserSettings configuration
        modelBuilder.Entity<UserSettings>(entity =>
        {
            entity.ToTable("user_settings");
            entity.HasKey(e => e.Id);

            entity.HasOne(s => s.User)
                  .WithOne(u => u.Settings)
                  .HasForeignKey<UserSettings>(s => s.UserId)
                  .OnDelete(DeleteBehavior.Cascade);

            entity.HasIndex(e => e.UserId).IsUnique();
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

        // TaskGroupShare configuration
        modelBuilder.Entity<TaskGroupShare>(entity =>
        {
            entity.ToTable("task_group_shares");
            entity.HasKey(e => e.Id);

            entity.HasOne(s => s.TaskGroup)
                  .WithMany(tg => tg.Shares)
                  .HasForeignKey(s => s.TaskGroupId)
                  .OnDelete(DeleteBehavior.Cascade);

            entity.HasOne(s => s.SharedWithUser)
                  .WithMany()
                  .HasForeignKey(s => s.SharedWithUserId)
                  .OnDelete(DeleteBehavior.Cascade);

            entity.Property(e => e.Permission)
                  .HasConversion<string>();

            entity.HasIndex(e => new { e.TaskGroupId, e.SharedWithUserId }).IsUnique();
            entity.HasIndex(e => e.SharedWithUserId);
        });

        // Event configuration
        modelBuilder.Entity<Event>(entity =>
        {
            entity.ToTable("events");
            entity.HasKey(e => e.Id);
            
            entity.HasOne(e => e.User)
                  .WithMany()
                  .HasForeignKey(e => e.UserId)
                  .OnDelete(DeleteBehavior.Cascade);

            entity.HasOne(e => e.Group)
                  .WithMany()
                  .HasForeignKey(e => e.GroupId)
                  .OnDelete(DeleteBehavior.SetNull);

            // Indexes for query performance
            entity.HasIndex(e => e.UserId);
            entity.HasIndex(e => e.StartDate);
            entity.HasIndex(e => new { e.UserId, e.StartDate });
            
            // Check constraint: EndDate >= StartDate (PostgreSQL syntax)
            entity.ToTable(t => t.HasCheckConstraint("CK_Events_EndDate_After_StartDate", "end_date >= start_date"));
        });

        // EventShare configuration
        modelBuilder.Entity<EventShare>(entity =>
        {
            entity.ToTable("event_shares");
            entity.HasKey(e => e.Id);

            entity.HasOne(es => es.Event)
                  .WithMany()
                  .HasForeignKey(es => es.EventId)
                  .OnDelete(DeleteBehavior.Cascade);

            entity.HasOne(es => es.SharedBy)
                  .WithMany()
                  .HasForeignKey(es => es.SharedByUserId)
                  .OnDelete(DeleteBehavior.Restrict);

            entity.HasOne(es => es.SharedWith)
                  .WithMany()
                  .HasForeignKey(es => es.SharedWithUserId)
                  .OnDelete(DeleteBehavior.Cascade);

            entity.Property(e => e.Permission)
                  .HasConversion<string>();

            entity.Property(e => e.Status)
                  .HasConversion<string>();

            // One share record per event/recipient pair
            entity.HasIndex(e => new { e.EventId, e.SharedWithUserId }).IsUnique();
            // Query indexes
            entity.HasIndex(e => e.SharedWithUserId);
            entity.HasIndex(e => e.SharedByUserId);
            entity.HasIndex(e => e.Status);
        });

        modelBuilder.Entity<Notification>(entity =>
        {
            entity.ToTable("notifications");
            entity.HasKey(e => e.Id);

            entity.Property(e => e.Id).HasColumnName("id");
            entity.Property(e => e.UserId).HasColumnName("user_id").IsRequired();
            entity.Property(e => e.Type).HasColumnName("type").IsRequired();
            entity.Property(e => e.EntityType).HasColumnName("entity_type").IsRequired();
            entity.Property(e => e.EntityId).HasColumnName("entity_id").IsRequired();
            entity.Property(e => e.EntityTitle).HasColumnName("entity_title").HasMaxLength(500).IsRequired();
            entity.Property(e => e.FromUserId).HasColumnName("from_user_id").IsRequired();
            entity.Property(e => e.IsRead).HasColumnName("is_read");
            entity.Property(e => e.CreatedAt).HasColumnName("created_at");

            entity.HasOne(n => n.User)
                .WithMany()
                .HasForeignKey(n => n.UserId)
                .OnDelete(DeleteBehavior.Cascade);

            entity.HasOne(n => n.FromUser)
                .WithMany()
                .HasForeignKey(n => n.FromUserId)
                .OnDelete(DeleteBehavior.Restrict);

            // Optimise for "get my unread notifications" query
            entity.HasIndex(n => new { n.UserId, n.IsRead, n.CreatedAt })
                .HasDatabaseName("IX_notifications_user_read_created");
        });

        modelBuilder.Entity<TaskLabel>(entity =>
        {
            entity.HasKey(tl => new { tl.TaskId, tl.LabelId });
            entity.HasOne(tl => tl.Task).WithMany(t => t.Labels).HasForeignKey(tl => tl.TaskId).OnDelete(DeleteBehavior.Cascade);
            entity.HasOne(tl => tl.Label).WithMany(l => l.TaskLabels).HasForeignKey(tl => tl.LabelId).OnDelete(DeleteBehavior.Cascade);
        });

        modelBuilder.Entity<Label>(entity =>
        {
            entity.HasIndex(l => new { l.UserId, l.Name }).IsUnique();
        });
    }
}
