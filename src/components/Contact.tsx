'use client';

import React, { useState } from 'react';
import { useTranslations } from 'next-intl';
import { Button, Label, Input } from '@braintwopoint0/playback-commons/ui';
import { cn } from '@/lib/utils';
import { Textarea } from './ui/textarea';
import SectionTitle from './ui/section-title';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';

type Status = 'pending' | 'ok' | 'error';

export function ContactForm() {
  const t = useTranslations('landing.contact');
  const [status, setStatus] = useState<Status | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [who, setWho] = useState<string>('');

  const handleFormSubmit = async (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    if (status === 'pending') return;
    try {
      setStatus('pending');
      setError(null);
      const formData = new FormData(event.currentTarget);
      const res = await fetch('/api/contact', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          name: formData.get('name'),
          email: formData.get('email'),
          company: formData.get('company'),
          who: who || null,
          message: formData.get('message'),
          'bot-field': formData.get('bot-field'),
        }),
      });
      if (res.ok) {
        setStatus('ok');
      } else if (res.status === 429) {
        setStatus('error');
        setError(t('errorRateLimited'));
      } else {
        setStatus('error');
        setError(t('errorGeneric'));
      }
    } catch {
      setStatus('error');
      setError(t('errorNetwork'));
    }
  };

  return (
    <section id="contact" className="relative mt-32 md:mt-40 scroll-mt-24">
      <div className="mx-auto max-w-[1400px] px-6 sm:px-10">
        <SectionTitle eyebrow={t('eyebrow')} title={t('title')} />
        <div className="p-0 md:p-0">
          <form
            className="flex flex-col items-start space-y-6"
            name="contact"
            onSubmit={handleFormSubmit}
          >
            {/* Honeypot - hidden from humans, attractive to bots. Uses the
                sr-only clip pattern: offscreen left-[-10000px] positioning
                widens the document in RTL and causes an endless zoom-out. */}
            <div aria-hidden className="sr-only">
              <label htmlFor="contact-botfield">{t('honeypotLabel')}</label>
              <input
                id="contact-botfield"
                name="bot-field"
                type="text"
                tabIndex={-1}
                autoComplete="off"
              />
            </div>
            <div className="flex flex-col md:flex-row gap-6 md:gap-4 w-full">
              <LabelInputContainer>
                <Label htmlFor="name">{t('nameLabel')}</Label>
                <Input
                  id="name"
                  placeholder={t('namePlaceholder')}
                  type="text"
                  name="name"
                  autoComplete="name"
                  required
                />
              </LabelInputContainer>
              <LabelInputContainer>
                <Label htmlFor="email">{t('emailLabel')}</Label>
                <Input
                  id="email"
                  placeholder={t('emailPlaceholder')}
                  type="email"
                  name="email"
                  autoComplete="email"
                  dir="ltr"
                  required
                />
              </LabelInputContainer>
            </div>
            <div className="flex flex-col md:flex-row gap-6 md:gap-4 w-full">
              <LabelInputContainer>
                <Label htmlFor="company">{t('companyLabel')}</Label>
                <Input
                  id="company"
                  placeholder={t('companyPlaceholder')}
                  type="text"
                  name="company"
                  autoComplete="organization"
                />
              </LabelInputContainer>
              <LabelInputContainer>
                <Label htmlFor="who">{t('whoLabel')}</Label>
                <Select value={who} onValueChange={setWho}>
                  <SelectTrigger id="who" className="w-full">
                    <SelectValue placeholder={t('whoPlaceholder')} />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="player">
                      {t('whoOptions.player')}
                    </SelectItem>
                    <SelectItem value="venue">
                      {t('whoOptions.venue')}
                    </SelectItem>
                    <SelectItem value="equipment_provider">
                      {t('whoOptions.equipmentProvider')}
                    </SelectItem>
                    <SelectItem value="league_organiser">
                      {t('whoOptions.leagueOrganiser')}
                    </SelectItem>
                    <SelectItem value="ambassador">
                      {t('whoOptions.ambassador')}
                    </SelectItem>
                  </SelectContent>
                </Select>
              </LabelInputContainer>
            </div>
            <LabelInputContainer>
              <Label htmlFor="message">{t('messageLabel')}</Label>
              <Textarea
                id="message"
                placeholder={t('messagePlaceholder')}
                name="message"
              />
            </LabelInputContainer>
            {status !== 'ok' && (
              <Button
                variant="playback"
                className="group w-full"
                disabled={status === 'pending'}
                type="submit"
              >
                {status === 'pending' ? (
                  t('sending')
                ) : (
                  <>
                    {t('send')}
                    <span
                      aria-hidden
                      className="ms-2 inline-block transition-transform duration-300 motion-reduce:transition-none group-hover:translate-x-0.5 rtl:rotate-180"
                    >
                      →
                    </span>
                  </>
                )}
              </Button>
            )}
            <div className="bg-gradient-to-r from-transparent via-line-strong to-transparent my-8 h-px w-full" />
            {status !== null && (
              <div
                aria-live="polite"
                role={
                  status === 'error'
                    ? 'alert'
                    : status === 'ok'
                      ? 'status'
                      : undefined
                }
                className={cn(
                  'flex items-center justify-center w-full pt-2 text-[15px] font-medium text-center',
                  status === 'error' && 'text-[rgb(237,106,106)]',
                  status === 'ok' && 'text-timberwolf',
                  status === 'pending' && 'text-ink-muted'
                )}
              >
                {status === 'pending' && <span>{t('submitting')}</span>}
                {status === 'error' && (
                  <span>{error ?? t('errorFallback')}</span>
                )}
                {status === 'ok' && <span>{t('success')}</span>}
              </div>
            )}
          </form>
        </div>
      </div>
    </section>
  );
}

const LabelInputContainer = ({
  children,
  className,
}: {
  children: React.ReactNode;
  className?: string;
}) => {
  return (
    <div className={cn('flex flex-col space-y-2 w-full', className)}>
      {children}
    </div>
  );
};
