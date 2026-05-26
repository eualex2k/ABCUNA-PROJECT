import React from 'react';
import { render, screen } from '@testing-library/react';
import { Button } from '../components/ui';
import { it, expect } from 'vitest';

it('renders Button with default variant', () => {
  render(<Button>Click me</Button>);
  const button = screen.getByRole('button', { name: /click me/i });
  expect(button).toBeTruthy();
});
