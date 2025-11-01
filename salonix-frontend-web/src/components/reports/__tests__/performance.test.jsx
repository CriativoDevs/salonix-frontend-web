import React from 'react';
import { render } from '@testing-library/react';
import TopServices from '../TopServices';
import RevenueChart from '../RevenueChart';
import DateFilters from '../DateFilters';

// Mock do react-i18next
jest.mock('react-i18next', () => ({
  useTranslation: () => ({
    t: (key, defaultValue) => defaultValue || key,
  }),
}));

describe('Performance Tests', () => {
  describe('TopServices Performance', () => {
    it('renderiza rapidamente com poucos dados', () => {
      const smallData = {
        top_services: [
          { id: 1, name: 'Corte', count: 10, revenue: 500 },
          { id: 2, name: 'Barba', count: 5, revenue: 250 }
        ]
      };

      const startTime = performance.now();
      render(<TopServices data={smallData} loading={false} />);
      const endTime = performance.now();

      expect(endTime - startTime).toBeLessThan(100); // menos de 100ms
    });

    it('renderiza com dados grandes em tempo aceitável', () => {
      const largeData = {
        top_services: Array.from({ length: 100 }, (_, i) => ({
          id: i + 1,
          name: `Serviço ${i + 1}`,
          count: Math.floor(Math.random() * 50),
          revenue: Math.floor(Math.random() * 1000)
        }))
      };

      const startTime = performance.now();
      render(<TopServices data={largeData} loading={false} />);
      const endTime = performance.now();

      expect(endTime - startTime).toBeLessThan(500); // menos de 500ms
    });

    it('renderiza estado de loading rapidamente', () => {
      const startTime = performance.now();
      render(<TopServices data={null} loading={true} />);
      const endTime = performance.now();

      expect(endTime - startTime).toBeLessThan(50); // menos de 50ms
    });
  });

  describe('RevenueChart Performance', () => {
    it('renderiza rapidamente com dados simples', () => {
      const simpleData = {
        revenue: {
          series: [
            { period_start: '2024-01-01', revenue: 1000, appointment_count: 5 },
            { period_start: '2024-01-02', revenue: 1500, appointment_count: 8 },
            { period_start: '2024-01-03', revenue: 1200, appointment_count: 6 }
          ]
        }
      };

      const startTime = performance.now();
      render(<RevenueChart data={simpleData} loading={false} />);
      const endTime = performance.now();

      expect(endTime - startTime).toBeLessThan(100); // menos de 100ms
    });

    it('renderiza estado de loading rapidamente', () => {
      const startTime = performance.now();
      render(<RevenueChart data={null} loading={true} />);
      const endTime = performance.now();

      expect(endTime - startTime).toBeLessThan(50); // menos de 50ms
    });
  });

  describe('DateFilters Performance', () => {
    it('renderiza rapidamente', () => {
      const startTime = performance.now();
      render(
        <DateFilters 
          fromDate="2024-01-01"
          toDate="2024-01-31"
          onFromDateChange={() => {}}
          onToDateChange={() => {}}
          onApplyFilters={() => {}}
          loading={false}
        />
      );
      const endTime = performance.now();

      expect(endTime - startTime).toBeLessThan(50); // menos de 50ms
    });

    it('renderiza estado de loading rapidamente', () => {
      const startTime = performance.now();
      render(
        <DateFilters 
          fromDate="2024-01-01"
          toDate="2024-01-31"
          onFromDateChange={() => {}}
          onToDateChange={() => {}}
          onApplyFilters={() => {}}
          loading={true}
        />
      );
      const endTime = performance.now();

      expect(endTime - startTime).toBeLessThan(50); // menos de 50ms
    });
  });
});