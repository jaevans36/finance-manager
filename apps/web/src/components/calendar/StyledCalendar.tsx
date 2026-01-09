import styled from 'styled-components';
import Calendar from 'react-calendar';
import 'react-calendar/dist/Calendar.css';

export const StyledCalendar = styled(Calendar)`
  width: 100% !important;
  max-width: 100% !important;
  height: 100%;
  min-height: 600px;
  border: 1px solid ${({ theme }) => theme.colors.border};
  border-radius: 8px;
  background: ${({ theme }) => theme.colors.background};
  font-family: ${({ theme }) => theme.fonts.body};
  padding: 16px;
  box-sizing: border-box;

  /* Navigation */
  .react-calendar__navigation {
    display: flex;
    height: 44px;
    margin-bottom: 16px;

    button {
      background: transparent;
      border: none;
      color: ${({ theme }) => theme.colors.text};
      font-size: 16px;
      font-weight: 600;
      cursor: pointer;
      padding: 8px 12px;
      border-radius: 6px;
      transition: all 0.2s ease;

      &:hover:not(:disabled) {
        background: ${({ theme }) => theme.colors.backgroundSecondary};
      }

      &:disabled {
        opacity: 0.3;
        cursor: not-allowed;
      }

      &.react-calendar__navigation__label {
        flex-grow: 1;
        font-size: 18px;
      }
    }
  }

  /* Weekday labels */
  .react-calendar__month-view__weekdays {
    text-align: center;
    text-transform: uppercase;
    font-size: 12px;
    font-weight: 600;
    color: ${({ theme }) => theme.colors.textSecondary};
    margin-bottom: 8px;

    abbr {
      text-decoration: none;
    }
  }

  /* Day tiles */
  .react-calendar__tile {
    aspect-ratio: 1;
    display: flex;
    flex-direction: column;
    align-items: center;
    justify-content: flex-start;
    padding: 8px 4px;
    background: ${({ theme }) => theme.colors.background};
    border: 1px solid ${({ theme }) => theme.colors.border};
    border-radius: 6px;
    cursor: pointer;
    transition: all 0.2s ease;
    position: relative;
    min-height: 100px;

    @media (max-width: 768px) {
      min-height: 70px;
      padding: 6px 2px;
    }

    &:hover:not(:disabled) {
      background: ${({ theme }) => theme.colors.backgroundSecondary};
      border-color: ${({ theme }) => theme.colors.primary};
    }

    &:disabled {
      opacity: 0.4;
      cursor: not-allowed;
    }

    abbr {
      font-size: 14px;
      font-weight: 500;
      color: ${({ theme }) => theme.colors.text};
    }
  }

  /* Today's date */
  .react-calendar__tile--now {
    background: ${({ theme }) => theme.colors.primaryLight};
    border: 2px solid ${({ theme }) => theme.colors.primary};
    font-weight: 700;

    abbr {
      color: ${({ theme }) => theme.colors.primary};
    }
  }

  /* Selected date */
  .react-calendar__tile--active {
    background: ${({ theme }) => theme.colors.primary};
    border-color: ${({ theme }) => theme.colors.primary};

    abbr {
      color: white;
    }
  }

  /* Weekend days */
  .react-calendar__month-view__days__day--weekend {
    background: ${({ theme }) => theme.colors.backgroundSecondary};
  }

  /* Neighboring month days */
  .react-calendar__month-view__days__day--neighboringMonth {
    opacity: 0.3;
  }

  /* Month view grid */
  .react-calendar__month-view__days {
    display: grid !important;
    grid-template-columns: repeat(7, 1fr);
    gap: 8px;
  }

  /* Responsive design */
  @media (max-width: 768px) {
    padding: 12px;
    min-height: 500px;

    .react-calendar__tile {
      min-height: 70px;
      padding: 6px 2px;

      abbr {
        font-size: 12px;
      }
    }

    .react-calendar__navigation button {
      padding: 6px 8px;
      font-size: 14px;

      &.react-calendar__navigation__label {
        font-size: 16px;
      }
    }
  }

  @media (max-width: 480px) {
    min-height: 400px;

    .react-calendar__tile {
      min-height: 50px;
      padding: 4px 2px;

      abbr {
        font-size: 11px;
      }
    }
  }
`;

export const TaskBadge = styled.div<{ priority: string }>`
  display: flex;
  align-items: center;
  justify-content: center;
  min-width: 24px;
  height: 20px;
  padding: 0 6px;
  margin-top: 4px;
  border-radius: 10px;
  font-size: 11px;
  font-weight: 600;
  background: ${({ priority, theme }) => {
    switch (priority) {
      case 'Critical':
        return theme.colors.error;
      case 'High':
        return theme.colors.warning;
      case 'Medium':
        return theme.colors.info;
      default:
        return theme.colors.textSecondary;
    }
  }};
  color: white;
  cursor: pointer;
  transition: transform 0.2s ease;

  &:hover {
    transform: scale(1.1);
  }
`;
