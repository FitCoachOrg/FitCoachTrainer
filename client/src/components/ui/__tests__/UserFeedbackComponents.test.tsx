/**
 * Tests for User Feedback Components
 * 
 * Verifies that all user feedback components work correctly
 * and provide proper accessibility and visual feedback.
 */

import React from 'react';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import { LoadingSpinner } from '../LoadingSpinner';
import { ProgressBar } from '../ProgressBar';
import { StatusIndicator } from '../StatusIndicator';
import { EnhancedToast } from '../EnhancedToast';
import { SuccessAnimation } from '../SuccessAnimation';

describe('LoadingSpinner', () => {
  it('renders with default props', () => {
    render(<LoadingSpinner />);
    
    const spinner = screen.getByRole('status');
    expect(spinner).toBeInTheDocument();
    expect(spinner).toHaveAttribute('aria-label', 'Loading...');
  });
  
  it('renders with custom size and variant', () => {
    render(<LoadingSpinner size="lg" variant="primary" label="Custom loading" />);
    
    const spinner = screen.getByRole('status');
    expect(spinner).toHaveAttribute('aria-label', 'Custom loading');
  });
  
  it('applies correct size classes', () => {
    const { rerender } = render(<LoadingSpinner size="sm" />);
    expect(screen.getByRole('status').querySelector('svg')).toHaveClass('h-3 w-3');
    
    rerender(<LoadingSpinner size="lg" />);
    expect(screen.getByRole('status').querySelector('svg')).toHaveClass('h-6 w-6');
  });
});

describe('ProgressBar', () => {
  it('renders with correct progress value', () => {
    render(<ProgressBar progress={50} />);
    
    const progressBar = screen.getByRole('progressbar');
    expect(progressBar).toHaveAttribute('aria-valuenow', '50');
    expect(progressBar).toHaveAttribute('aria-valuemin', '0');
    expect(progressBar).toHaveAttribute('aria-valuemax', '100');
  });
  
  it('shows percentage when enabled', () => {
    render(<ProgressBar progress={75} showPercentage={true} label="Test Progress" />);
    
    expect(screen.getByText('75%')).toBeInTheDocument();
    expect(screen.getByText('Test Progress')).toBeInTheDocument();
  });
  
  it('clamps progress value to 0-100 range', () => {
    const { rerender } = render(<ProgressBar progress={-10} />);
    expect(screen.getByRole('progressbar')).toHaveAttribute('aria-valuenow', '0');
    
    rerender(<ProgressBar progress={150} />);
    expect(screen.getByRole('progressbar')).toHaveAttribute('aria-valuenow', '100');
  });
  
  it('applies correct variant classes', () => {
    const { rerender } = render(<ProgressBar progress={50} variant="success" />);
    expect(screen.getByRole('progressbar').parentElement).toHaveClass('bg-green-200');
    
    rerender(<ProgressBar progress={50} variant="error" />);
    expect(screen.getByRole('progressbar').parentElement).toHaveClass('bg-red-200');
  });
});

describe('StatusIndicator', () => {
  it('renders with correct status type', () => {
    render(<StatusIndicator status="success" message="Operation completed" />);
    
    expect(screen.getByText('Operation completed')).toBeInTheDocument();
    expect(screen.getByRole('img', { hidden: true })).toHaveClass('text-green-500');
  });
  
  it('shows loading animation for loading status', () => {
    render(<StatusIndicator status="loading" message="Processing..." />);
    
    const icon = screen.getByRole('img', { hidden: true });
    expect(icon).toHaveClass('animate-spin');
  });
  
  it('hides icon when showIcon is false', () => {
    render(<StatusIndicator status="success" message="Done" showIcon={false} />);
    
    expect(screen.queryByRole('img', { hidden: true })).not.toBeInTheDocument();
  });
  
  it('applies correct size classes', () => {
    const { rerender } = render(<StatusIndicator status="info" size="sm" />);
    expect(screen.getByText('')).toHaveClass('text-xs');
    
    rerender(<StatusIndicator status="info" size="lg" />);
    expect(screen.getByText('')).toHaveClass('text-base');
  });
});

describe('EnhancedToast', () => {
  it('renders with correct type and content', () => {
    render(
      <EnhancedToast
        type="success"
        title="Success!"
        message="Operation completed successfully"
        onClose={jest.fn()}
      />
    );
    
    expect(screen.getByText('Success!')).toBeInTheDocument();
    expect(screen.getByText('Operation completed successfully')).toBeInTheDocument();
  });
  
  it('shows progress bar for timed toasts', () => {
    render(
      <EnhancedToast
        type="info"
        title="Info"
        duration={5000}
        showProgress={true}
        onClose={jest.fn()}
      />
    );
    
    expect(screen.getByRole('progressbar')).toBeInTheDocument();
  });
  
  it('shows retry button for error toasts with onRetry', () => {
    const mockRetry = jest.fn();
    render(
      <EnhancedToast
        type="error"
        title="Error"
        onRetry={mockRetry}
        onClose={jest.fn()}
      />
    );
    
    const retryButton = screen.getByTitle('Retry');
    expect(retryButton).toBeInTheDocument();
    
    fireEvent.click(retryButton);
    expect(mockRetry).toHaveBeenCalled();
  });
  
  it('calls onClose when close button is clicked', () => {
    const mockClose = jest.fn();
    render(
      <EnhancedToast
        type="warning"
        title="Warning"
        onClose={mockClose}
      />
    );
    
    const closeButton = screen.getByTitle('Close');
    fireEvent.click(closeButton);
    expect(mockClose).toHaveBeenCalled();
  });
  
  it('auto-closes after duration', async () => {
    const mockClose = jest.fn();
    render(
      <EnhancedToast
        type="info"
        title="Auto close"
        duration={100}
        onClose={mockClose}
      />
    );
    
    await waitFor(() => {
      expect(mockClose).toHaveBeenCalled();
    }, { timeout: 200 });
  });
});

describe('SuccessAnimation', () => {
  it('renders when show is true', () => {
    render(<SuccessAnimation show={true} message="Success!" />);
    
    expect(screen.getByRole('img', { hidden: true })).toBeInTheDocument();
  });
  
  it('does not render when show is false', () => {
    render(<SuccessAnimation show={false} />);
    
    expect(screen.queryByRole('img', { hidden: true })).not.toBeInTheDocument();
  });
  
  it('shows message after animation starts', async () => {
    render(<SuccessAnimation show={true} message="Operation completed!" />);
    
    await waitFor(() => {
      expect(screen.getByText('Operation completed!')).toBeInTheDocument();
    }, { timeout: 400 });
  });
  
  it('calls onComplete after animation duration', async () => {
    const mockComplete = jest.fn();
    render(<SuccessAnimation show={true} onComplete={mockComplete} />);
    
    await waitFor(() => {
      expect(mockComplete).toHaveBeenCalled();
    }, { timeout: 2100 });
  });
  
  it('applies correct size classes', () => {
    const { rerender } = render(<SuccessAnimation show={true} size="sm" />);
    expect(screen.getByRole('img', { hidden: true })).toHaveClass('h-8 w-8');
    
    rerender(<SuccessAnimation show={true} size="xl" />);
    expect(screen.getByRole('img', { hidden: true })).toHaveClass('h-20 w-20');
  });
});

// Integration test for toast system
describe('Toast Integration', () => {
  it('handles multiple toasts correctly', () => {
    const mockClose1 = jest.fn();
    const mockClose2 = jest.fn();
    
    render(
      <div>
        <EnhancedToast
          type="success"
          title="First Toast"
          onClose={mockClose1}
        />
        <EnhancedToast
          type="error"
          title="Second Toast"
          onClose={mockClose2}
        />
      </div>
    );
    
    expect(screen.getByText('First Toast')).toBeInTheDocument();
    expect(screen.getByText('Second Toast')).toBeInTheDocument();
    
    // Close first toast
    fireEvent.click(screen.getAllByTitle('Close')[0]);
    expect(mockClose1).toHaveBeenCalled();
    expect(screen.getByText('Second Toast')).toBeInTheDocument();
  });
});

// Accessibility tests
describe('Accessibility', () => {
  it('LoadingSpinner has proper ARIA attributes', () => {
    render(<LoadingSpinner label="Loading data" />);
    
    const spinner = screen.getByRole('status');
    expect(spinner).toHaveAttribute('aria-label', 'Loading data');
    expect(screen.getByText('Loading data')).toHaveClass('sr-only');
  });
  
  it('ProgressBar has proper ARIA attributes', () => {
    render(<ProgressBar progress={60} label="Upload progress" />);
    
    const progressBar = screen.getByRole('progressbar');
    expect(progressBar).toHaveAttribute('aria-label', 'Upload progress: 60%');
    expect(progressBar).toHaveAttribute('aria-valuenow', '60');
  });
  
  it('Toast has proper ARIA attributes', () => {
    render(
      <EnhancedToast
        type="info"
        title="Information"
        message="This is important information"
        onClose={jest.fn()}
      />
    );
    
    const toast = screen.getByRole('region');
    expect(toast).toHaveAttribute('aria-label', 'Notifications');
    expect(toast).toHaveAttribute('aria-live', 'polite');
  });
});

