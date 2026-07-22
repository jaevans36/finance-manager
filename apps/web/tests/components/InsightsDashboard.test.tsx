import React from 'react';
import { screen, waitFor } from '@testing-library/react';
import { renderWithProviders } from '../utils/test-utils';
import { InsightsDashboard } from '../../src/components/finance/InsightsDashboard';
import type {
  AnomalyAlert,
  InsightsSummaryResponse,
  SpendingVelocityResponse,
  SubscriptionAuditResponse,
} from '../../src/types/finance';

jest.mock('../../src/services/insights-service', () => ({
  insightsService: {
    getSummary: jest.fn(),
    getVelocity: jest.fn(),
    getAnomalies: jest.fn(),
    getSubscriptions: jest.fn(),
    getNegotiationScript: jest.fn(),
  },
}));

const { insightsService } = jest.requireMock('../../src/services/insights-service');

const emptyVelocity: SpendingVelocityResponse = {
  daysElapsed: 10,
  daysInMonth: 30,
  totalSpentSoFar: 0,
  dailyAverage: 0,
  projectedMonthEndTotal: 0,
  budgetTotal: null,
  projectedOverspend: null,
  categories: [],
};

const emptySubscriptions: SubscriptionAuditResponse = {
  subscriptions: [],
  totalMonthlyCost: 0,
  totalAnnualCost: 0,
  possiblyUnusedCount: 0,
};

const emptySummary: InsightsSummaryResponse = { cards: [] };
const emptyAnomalies: AnomalyAlert[] = [];

describe('InsightsDashboard', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  it('shows loading state initially', () => {
    insightsService.getSummary.mockReturnValue(new Promise(() => {}));
    insightsService.getVelocity.mockReturnValue(new Promise(() => {}));
    insightsService.getAnomalies.mockReturnValue(new Promise(() => {}));
    insightsService.getSubscriptions.mockReturnValue(new Promise(() => {}));

    renderWithProviders(<InsightsDashboard />);

    expect(screen.getByText(/loading insights/i)).toBeInTheDocument();
  });

  it('shows empty state when there are no insight cards', async () => {
    insightsService.getSummary.mockResolvedValue(emptySummary);
    insightsService.getVelocity.mockResolvedValue(emptyVelocity);
    insightsService.getAnomalies.mockResolvedValue(emptyAnomalies);
    insightsService.getSubscriptions.mockResolvedValue(emptySubscriptions);

    renderWithProviders(<InsightsDashboard />);

    await waitFor(() => {
      expect(screen.getByText(/no insights yet/i)).toBeInTheDocument();
    });
  });

  it('shows insight cards from the summary', async () => {
    insightsService.getSummary.mockResolvedValue({
      cards: [
        {
          id: 'velocity',
          type: 'SpendingVelocity',
          severity: 'Warning',
          title: 'Overspend warning',
          summary: 'Careful now',
          actionLabel: null,
        },
      ],
    });
    insightsService.getVelocity.mockResolvedValue(emptyVelocity);
    insightsService.getAnomalies.mockResolvedValue(emptyAnomalies);
    insightsService.getSubscriptions.mockResolvedValue(emptySubscriptions);

    renderWithProviders(<InsightsDashboard />);

    await waitFor(() => {
      expect(screen.getByText('Overspend warning')).toBeInTheDocument();
    });
  });

  it('shows an error state when loading fails', async () => {
    insightsService.getSummary.mockRejectedValue(new Error('boom'));
    insightsService.getVelocity.mockResolvedValue(emptyVelocity);
    insightsService.getAnomalies.mockResolvedValue(emptyAnomalies);
    insightsService.getSubscriptions.mockResolvedValue(emptySubscriptions);

    renderWithProviders(<InsightsDashboard />);

    await waitFor(() => {
      expect(screen.getByText(/failed to load insights/i)).toBeInTheDocument();
    });
  });

  it('renders the subscription auditor and negotiation helper once loaded', async () => {
    insightsService.getSummary.mockResolvedValue(emptySummary);
    insightsService.getVelocity.mockResolvedValue(emptyVelocity);
    insightsService.getAnomalies.mockResolvedValue(emptyAnomalies);
    insightsService.getSubscriptions.mockResolvedValue(emptySubscriptions);

    renderWithProviders(<InsightsDashboard />);

    await waitFor(() => {
      expect(screen.getByText('No recurring subscriptions detected yet.')).toBeInTheDocument();
    });
    expect(screen.getByText('Negotiation helper')).toBeInTheDocument();
  });
});
