import { act, cleanup, fireEvent, render, screen } from '@testing-library/react';
import { afterEach, beforeEach, expect, it } from 'vitest';
import { useState } from 'react';
import { useLanguageStore } from '@/stores/useLanguageStore';
import LocalizedEventEditor from './LocalizedEventEditor';

function Editor({ isOwner = true }) {
  const [form, setForm] = useState({ eventType: 'BIRTHDAY', title: 'ខួបកំណើត', hostName: 'សុខា', languageMode: 'KH', saveTheDate: { enabled: false }, customData: { untouched: true } });
  const [locale, setLocale] = useState('km');
  return <><LocalizedEventEditor form={form} schedule={[]} setForm={setForm} locale={locale} setLocale={setLocale} isOwner={isOwner} /><output data-testid="form">{JSON.stringify(form)}</output></>;
}

beforeEach(() => useLanguageStore.setState({ lang: 'km' }));
afterEach(() => { cleanup(); useLanguageStore.setState({ lang: 'en' }); });

it('switches interface language without changing the authored locale or unsaved translations', () => {
  render(<Editor />);
  expect(screen.getByRole('heading', { name: 'ភាសាខ្មែរ និងអង់គ្លេស' })).toBeInTheDocument();
  fireEvent.click(screen.getByRole('button', { name: 'ភាសាអង់គ្លេស', exact: true }));
  fireEvent.change(screen.getByLabelText('ភាសាអង់គ្លេស ចំណងជើងកម្មវិធី', { exact: true }), { target: { value: 'Sokha’s birthday' } });
  const before = JSON.parse(screen.getByTestId('form').textContent);
  act(() => useLanguageStore.setState({ lang: 'en' }));
  expect(screen.getByRole('button', { name: 'Edit English', exact: true })).toHaveAttribute('aria-pressed', 'true');
  expect(screen.getByLabelText('English Event title', { exact: true })).toHaveValue('Sokha’s birthday');
  expect(JSON.parse(screen.getByTestId('form').textContent)).toEqual(before);
  expect(before.localizedContentV1.km.title).toBe('ខួបកំណើត');
  expect(before.customData).toEqual({ untouched: true });
  act(() => useLanguageStore.setState({ lang: 'km' }));
  expect(screen.getByLabelText('ភាសាអង់គ្លេស ចំណងជើងកម្មវិធី', { exact: true })).toHaveValue('Sokha’s birthday');
});

it('keeps the English publication permission gate while localizing its label', () => {
  render(<Editor isOwner={false} />);
  expect(screen.getByRole('checkbox', { name: 'ផ្សព្វផ្សាយជាភាសាអង់គ្លេស' })).toBeDisabled();
});
