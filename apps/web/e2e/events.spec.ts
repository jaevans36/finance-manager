import { test, expect } from '@playwright/test';

test.describe('Events Feature', () => {
  const testUser = {
    email: `events-test-${Date.now()}@example.com`,
    password: 'Password123!',
  };

  test.beforeEach(async ({ page }) => {
    // Register and login
    await page.goto('http://localhost:5173/register');
    await page.fill('input[type="email"]', testUser.email);
    await page.fill('input[type="password"]', testUser.password);
    await page.click('button[type="submit"]');
    
    // Wait for redirect to dashboard
    await page.waitForURL('**/dashboard');
    
    // Navigate to calendar
    await page.click('text=Task Calendar');
    await page.waitForURL('**/calendar');
  });

  test('should create a new event', async ({ page }) => {
    // Click on tomorrow's date
    const tomorrow = new Date();
    tomorrow.setDate(tomorrow.getDate() + 1);
    const dayButton = page.locator('.react-calendar__tile').filter({ hasText: tomorrow.getDate().toString() }).first();
    await dayButton.click();

    // Quick add modal should appear
    await expect(page.locator('text=Add Task or Event')).toBeVisible();
    
    // Switch to event tab
    await page.click('button:has-text("Event")');
    
    // Fill event form
    await page.fill('input[name="title"]', 'Team Meeting');
    await page.fill('textarea[name="description"]', 'Weekly sync-up meeting');
    await page.fill('input[name="location"]', 'Conference Room A');
    
    // Set start time
    await page.fill('input[name="startTime"]', '10:00');
    
    // Set end time
    await page.fill('input[name="endTime"]', '11:00');
    
    // Set reminder
    await page.selectOption('select[name="reminderMinutes"]', '15');
    
    // Submit
    await page.click('button:has-text("Create Event")');
    
    // Wait for success toast
    await expect(page.locator('text=Event created successfully')).toBeVisible();
    
    // Event badge should appear on the date
    await expect(dayButton.locator('[title*="Team Meeting"]')).toBeVisible();
  });

  test('should create an all-day event', async ({ page }) => {
    const tomorrow = new Date();
    tomorrow.setDate(tomorrow.getDate() + 1);
    const dayButton = page.locator('.react-calendar__tile').filter({ hasText: tomorrow.getDate().toString() }).first();
    await dayButton.click();

    // Switch to event tab
    await page.click('button:has-text("Event")');
    
    // Fill event form
    await page.fill('input[name="title"]', 'Company Holiday');
    
    // Toggle all-day
    await page.click('input[type="checkbox"][name="isAllDay"]');
    
    // Time inputs should be disabled/hidden
    await expect(page.locator('input[name="startTime"]')).not.toBeVisible();
    
    // Submit
    await page.click('button:has-text("Create Event")');
    
    await expect(page.locator('text=Event created successfully')).toBeVisible();
  });

  test('should view event details', async ({ page }) => {
    // Create an event first
    const tomorrow = new Date();
    tomorrow.setDate(tomorrow.getDate() + 1);
    const dayButton = page.locator('.react-calendar__tile').filter({ hasText: tomorrow.getDate().toString() }).first();
    await dayButton.click();

    await page.click('button:has-text("Event")');
    await page.fill('input[name="title"]', 'Doctor Appointment');
    await page.fill('input[name="location"]', 'City Hospital');
    await page.fill('input[name="startTime"]', '14:00');
    await page.fill('input[name="endTime"]', '15:00');
    await page.click('button:has-text("Create Event")');
    
    await expect(page.locator('text=Event created successfully')).toBeVisible();
    await page.waitForTimeout(500);
    
    // Click on the date badge to see event list
    await dayButton.click();
    
    // Event should be visible in day list modal
    await expect(page.locator('text=Doctor Appointment')).toBeVisible();
    await expect(page.locator('text=City Hospital')).toBeVisible();
    await expect(page.locator('text=14:00')).toBeVisible();
  });

  test('should edit an event', async ({ page }) => {
    // Create an event
    const tomorrow = new Date();
    tomorrow.setDate(tomorrow.getDate() + 1);
    const dayButton = page.locator('.react-calendar__tile').filter({ hasText: tomorrow.getDate().toString() }).first();
    await dayButton.click();

    await page.click('button:has-text("Event")');
    await page.fill('input[name="title"]', 'Original Event');
    await page.fill('input[name="startTime"]', '09:00');
    await page.fill('input[name="endTime"]', '10:00');
    await page.click('button:has-text("Create Event")');
    
    await expect(page.locator('text=Event created successfully')).toBeVisible();
    await page.waitForTimeout(500);
    
    // Click to view events
    await dayButton.click();
    
    // Click edit button
    await page.click('button[title="Edit event"]');
    
    // Update event title
    await page.fill('input[name="title"]', 'Updated Event');
    await page.fill('input[name="location"]', 'New Location');
    
    // Save changes
    await page.click('button:has-text("Save Changes")');
    
    await expect(page.locator('text=Event updated successfully')).toBeVisible();
    
    // Verify changes
    await dayButton.click();
    await expect(page.locator('text=Updated Event')).toBeVisible();
    await expect(page.locator('text=New Location')).toBeVisible();
  });

  test('should delete an event', async ({ page }) => {
    // Create an event
    const tomorrow = new Date();
    tomorrow.setDate(tomorrow.getDate() + 1);
    const dayButton = page.locator('.react-calendar__tile').filter({ hasText: tomorrow.getDate().toString() }).first();
    await dayButton.click();

    await page.click('button:has-text("Event")');
    await page.fill('input[name="title"]', 'Event to Delete');
    await page.fill('input[name="startTime"]', '12:00');
    await page.fill('input[name="endTime"]', '13:00');
    await page.click('button:has-text("Create Event")');
    
    await expect(page.locator('text=Event created successfully')).toBeVisible();
    await page.waitForTimeout(500);
    
    // Click to view events
    await dayButton.click();
    
    // Click delete button
    await page.click('button[title="Delete event"]');
    
    // Confirm deletion
    await page.click('button:has-text("Delete")');
    
    await expect(page.locator('text=Event deleted successfully')).toBeVisible();
    
    // Event should no longer be visible
    await expect(page.locator('text=Event to Delete')).not.toBeVisible();
  });

  test('should filter events on calendar', async ({ page }) => {
    // Create an event
    const tomorrow = new Date();
    tomorrow.setDate(tomorrow.getDate() + 1);
    const dayButton = page.locator('.react-calendar__tile').filter({ hasText: tomorrow.getDate().toString() }).first();
    await dayButton.click();

    await page.click('button:has-text("Event")');
    await page.fill('input[name="title"]', 'Filterable Event');
    await page.fill('input[name="startTime"]', '15:00');
    await page.fill('input[name="endTime"]', '16:00');
    await page.click('button:has-text("Create Event")');
    
    await expect(page.locator('text=Event created successfully')).toBeVisible();
    await page.waitForTimeout(500);
    
    // Event badge should be visible
    await expect(dayButton.locator('[title*="Filterable Event"]')).toBeVisible();
    
    // Toggle off events filter
    await page.click('input[type="checkbox"][aria-label="Show events"]');
    
    // Event badge should be hidden
    await expect(dayButton.locator('[title*="Filterable Event"]')).not.toBeVisible();
    
    // Toggle events back on
    await page.click('input[type="checkbox"][aria-label="Show events"]');
    
    // Event badge should be visible again
    await expect(dayButton.locator('[title*="Filterable Event"]')).toBeVisible();
  });

  test('should validate event dates', async ({ page }) => {
    const tomorrow = new Date();
    tomorrow.setDate(tomorrow.getDate() + 1);
    const dayButton = page.locator('.react-calendar__tile').filter({ hasText: tomorrow.getDate().toString() }).first();
    await dayButton.click();

    await page.click('button:has-text("Event")');
    await page.fill('input[name="title"]', 'Invalid Event');
    
    // Set end time before start time
    await page.fill('input[name="startTime"]', '15:00');
    await page.fill('input[name="endTime"]', '10:00');
    
    await page.click('button:has-text("Create Event")');
    
    // Should show validation error
    await expect(page.locator('text=/end.*must be after.*start|start.*must be before.*end/i')).toBeVisible();
  });

  test('should show event count badge', async ({ page }) => {
    // Create multiple events on the same day
    const tomorrow = new Date();
    tomorrow.setDate(tomorrow.getDate() + 1);
    const dayButton = page.locator('.react-calendar__tile').filter({ hasText: tomorrow.getDate().toString() }).first();
    
    for (let i = 1; i <= 3; i++) {
      await dayButton.click();
      await page.click('button:has-text("Event")');
      await page.fill('input[name="title"]', `Event ${i}`);
      await page.fill('input[name="startTime"]', `${9 + i}:00`);
      await page.fill('input[name="endTime"]', `${10 + i}:00`);
      await page.click('button:has-text("Create Event")');
      await expect(page.locator('text=Event created successfully')).toBeVisible();
      await page.waitForTimeout(300);
    }
    
    // Badge should show count of 3
    await expect(dayButton.locator('text=3')).toBeVisible();
  });
});
