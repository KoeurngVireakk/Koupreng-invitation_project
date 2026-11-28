import { eventLocaleModel } from './localizedEventModel';
import { editLocalizedField, localeContent, translationFieldLabel, translationReadiness } from '../../templates/shared/localizedContent';
import { useUiCopy } from '@/shared/i18n/useUiCopy';
export default function LocalizedEventEditor({ form, schedule, setForm, locale, setLocale, isOwner }) {
  const uiCopy = useUiCopy();
  const model = eventLocaleModel(form, schedule);
  const content = localeContent(model), readiness = translationReadiness(model);
  const khmerReadiness = translationReadiness(model, 'km');
  const wedding = ['WEDDING', 'ENGAGEMENT'].includes(form.eventType);
  const keys = ['title', ...(wedding ? ['groomName', 'brideName'] : ['hostName']), ...(form.partnerName && !wedding ? ['partnerName'] : []), 'venueName', 'venueAddress', 'messageText'];
  const select = next => {
    if (!form.localizedContentV1 && ((next === 'en' && form.languageMode !== 'EN') || (next === 'km' && form.languageMode === 'EN'))) setForm(current => ({ ...current, localizedContentV1: localeContent(eventLocaleModel(current, schedule)) }));
    setLocale(next);
  };
  return <section className="event-settings-section" aria-label={uiCopy('ភាសាខ្មែរ និងអង់គ្លេស', 'Invitation content languages')}><h2>{uiCopy('ភាសាខ្មែរ និងអង់គ្លេស', 'Invitation content languages')}</h2>
    <div className="workspace-actions"><button type="button" aria-pressed={locale === 'km'} onClick={() => select('km')}>{uiCopy('ភាសាខ្មែរ', 'Edit Khmer')}</button><button type="button" aria-pressed={locale === 'en'} onClick={() => select('en')}>{uiCopy('ភាសាអង់គ្លេស', 'Edit English')}</button></div>
    <p role="status">{uiCopy('ភាសាអង់គ្លេស', 'English')}: {readiness.complete}/{readiness.total} · {uiCopy(`${readiness.missing.length} ខ្វះ`, `${readiness.missing.length} missing`)}</p>
    <p>{uiCopy('ភាសាខ្មែរ', 'Khmer')}: {khmerReadiness.complete}/{khmerReadiness.total} · {uiCopy(`${khmerReadiness.missing.length} ខ្វះ`, `${khmerReadiness.missing.length} missing`)}</p>
    <label className="studio-inline-check"><input type="checkbox" checked={content.enabledLocales.includes('en')} disabled={isOwner === false || (!readiness.ready && !content.enabledLocales.includes('en'))} onChange={e => setForm(current => ({ ...current, localizedContentV1: { ...localeContent(eventLocaleModel(current, schedule)), enabledLocales: e.target.checked ? ['km', 'en'] : ['km'], defaultLocale: 'km' } }))} />{uiCopy('ផ្សព្វផ្សាយជាភាសាអង់គ្លេស', 'Publish English version')}</label>
    {locale === 'en' && keys.map(key => { const Control = key === 'messageText' ? 'textarea' : 'input'; return <label key={key}>{uiCopy('ភាសាអង់គ្លេស', 'English')} {translationFieldLabel(key, uiCopy('km', 'en'))}<Control data-settings-translation={key} maxLength={key === 'messageText' ? 5000 : key === 'venueAddress' ? 1000 : 255} value={content.en[key] || ''} onChange={e => setForm(current => { const next = editLocalizedField(eventLocaleModel(current, schedule), 'en', key, e.target.value); return key === 'messageText' && !next.localizedContentV1 ? { ...next, storyText: e.target.value } : next; })} /></label>; })}
    {locale === 'en' && form.saveTheDate?.enabled !== false && ['heading', 'subtitle'].map(key => <label key={key}>{uiCopy(`ភាសាអង់គ្លេស ${translationFieldLabel(`saveTheDate.row-0.${key}`, 'km')}`, `English calendar ${key}`)}<input maxLength={key === 'heading' ? 300 : 1000} value={content.en.collections?.saveTheDate?.['row-0']?.[key] || ''} onChange={e => setForm(current => editLocalizedField(current, 'en', 'saveTheDate', { ...content.en.collections?.saveTheDate?.['row-0'], [key]: e.target.value }))} /></label>)}
    {locale === 'en' && <button type="button" onClick={() => setForm(current => { let next = eventLocaleModel(current, schedule); for (const key of ['hostName', 'partnerName', 'groomName', 'brideName']) next = editLocalizedField(next, 'en', key, localeContent(next).km[key] || ''); return next; })}>{uiCopy('ចម្លងឈ្មោះពីភាសាខ្មែរ', 'Copy names from Khmer')}</button>}
  </section>;
}
