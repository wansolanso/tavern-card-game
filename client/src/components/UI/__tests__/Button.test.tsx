import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { describe, it, expect, vi } from 'vitest';
import { Button } from '../Button';

describe('Button', () => {
  describe('Rendering', () => {
    it('should render with text', () => {
      render(<Button>Click me</Button>);
      expect(screen.getByText('Click me')).toBeInTheDocument();
    });

    it('should render with children elements', () => {
      render(
        <Button>
          <span>Icon</span>
          <span>Text</span>
        </Button>
      );

      expect(screen.getByText('Icon')).toBeInTheDocument();
      expect(screen.getByText('Text')).toBeInTheDocument();
    });

    it('should apply custom className', () => {
      render(<Button className="custom-class">Button</Button>);
      const button = screen.getByRole('button');
      expect(button).toHaveClass('custom-class');
    });
  });

  describe('Variants', () => {
    it('should apply primary variant by default', () => {
      render(<Button>Primary</Button>);
      const button = screen.getByRole('button');
      expect(button).toHaveClass('bg-tavern-gold');
    });

    it('should apply secondary variant', () => {
      render(<Button variant="secondary">Secondary</Button>);
      const button = screen.getByRole('button');
      expect(button).toHaveClass('bg-tavern-wood');
    });

    it('should apply danger variant', () => {
      render(<Button variant="danger">Danger</Button>);
      const button = screen.getByRole('button');
      expect(button).toHaveClass('bg-red-600');
    });

    it('should apply ghost variant', () => {
      render(<Button variant="ghost">Ghost</Button>);
      const button = screen.getByRole('button');
      expect(button).toHaveClass('bg-transparent');
    });
  });

  describe('Sizes', () => {
    it('should apply medium size by default', () => {
      render(<Button>Medium</Button>);
      const button = screen.getByRole('button');
      expect(button).toHaveClass('px-4', 'py-2');
    });

    it('should apply small size', () => {
      render(<Button size="sm">Small</Button>);
      const button = screen.getByRole('button');
      expect(button).toHaveClass('px-3', 'py-1.5');
    });

    it('should apply large size', () => {
      render(<Button size="lg">Large</Button>);
      const button = screen.getByRole('button');
      expect(button).toHaveClass('px-6', 'py-3');
    });
  });

  describe('Interaction', () => {
    it('should handle click events', async () => {
      const handleClick = vi.fn();
      const user = userEvent.setup();

      render(<Button onClick={handleClick}>Click me</Button>);

      const button = screen.getByText('Click me');
      await user.click(button);

      expect(handleClick).toHaveBeenCalledTimes(1);
    });

    it('should handle multiple clicks', async () => {
      const handleClick = vi.fn();
      const user = userEvent.setup();

      render(<Button onClick={handleClick}>Click me</Button>);

      const button = screen.getByText('Click me');
      await user.click(button);
      await user.click(button);
      await user.click(button);

      expect(handleClick).toHaveBeenCalledTimes(3);
    });

    it('should not trigger click when disabled', async () => {
      const handleClick = vi.fn();
      const user = userEvent.setup();

      render(
        <Button onClick={handleClick} disabled>
          Click me
        </Button>
      );

      const button = screen.getByText('Click me');
      await user.click(button);

      expect(handleClick).not.toHaveBeenCalled();
    });
  });

  describe('Loading State', () => {
    it('should show loading spinner when isLoading is true', () => {
      render(<Button isLoading>Click me</Button>);

      expect(screen.getByText('Loading...')).toBeInTheDocument();
      expect(screen.queryByText('Click me')).not.toBeInTheDocument();
    });

    it('should show custom loading text', () => {
      render(
        <Button isLoading loadingText="Processing...">
          Click me
        </Button>
      );

      expect(screen.getByText('Processing...')).toBeInTheDocument();
      expect(screen.queryByText('Click me')).not.toBeInTheDocument();
    });

    it('should be disabled when loading', () => {
      render(<Button isLoading>Click me</Button>);
      const button = screen.getByRole('button');
      expect(button).toBeDisabled();
    });

    it('should not trigger click when loading', async () => {
      const handleClick = vi.fn();
      const user = userEvent.setup();

      render(
        <Button onClick={handleClick} isLoading>
          Click me
        </Button>
      );

      const button = screen.getByRole('button');
      await user.click(button);

      expect(handleClick).not.toHaveBeenCalled();
    });

    it('should have aria-busy attribute when loading', () => {
      render(<Button isLoading>Click me</Button>);
      const button = screen.getByRole('button');
      expect(button).toHaveAttribute('aria-busy', 'true');
    });
  });

  describe('Disabled State', () => {
    it('should render as disabled', () => {
      render(<Button disabled>Click me</Button>);
      const button = screen.getByRole('button');
      expect(button).toBeDisabled();
    });

    it('should have disabled opacity class', () => {
      render(<Button disabled>Click me</Button>);
      const button = screen.getByRole('button');
      expect(button).toHaveClass('disabled:opacity-50');
    });

    it('should not trigger click when disabled', async () => {
      const handleClick = vi.fn();
      const user = userEvent.setup();

      render(
        <Button onClick={handleClick} disabled>
          Click me
        </Button>
      );

      const button = screen.getByText('Click me');
      await user.click(button);

      expect(handleClick).not.toHaveBeenCalled();
    });
  });

  describe('Accessibility', () => {
    it('should have correct role', () => {
      render(<Button>Click me</Button>);
      expect(screen.getByRole('button')).toBeInTheDocument();
    });

    it('should support type attribute', () => {
      render(<Button type="submit">Submit</Button>);
      const button = screen.getByRole('button');
      expect(button).toHaveAttribute('type', 'submit');
    });

    it('should have aria-live attribute', () => {
      render(<Button>Click me</Button>);
      const button = screen.getByRole('button');
      expect(button).toHaveAttribute('aria-live', 'polite');
    });

    it('should be keyboard accessible', async () => {
      const handleClick = vi.fn();
      const user = userEvent.setup();

      render(<Button onClick={handleClick}>Click me</Button>);

      const button = screen.getByRole('button');
      button.focus();
      await user.keyboard('{Enter}');

      expect(handleClick).toHaveBeenCalledTimes(1);
    });
  });
});
