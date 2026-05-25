import React from 'react';
import { render, screen } from '@testing-library/react';
import { Button } from '../components/ui';

test('renders Button with default variant', () => {
  render(<Button>Click me</Button>);
  const button = screen.getByRole('button', { name: /click me/i });
  expect(button).toBeInTheDocument();
  expect(button).toHaveClass('bg-brand-600');
});
