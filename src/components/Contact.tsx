'use client';

import React, { useState } from 'react';
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
        setError("You're sending too quickly. Try again in a minute.");
      } else {
        setStatus('error');
        setError('Something went wrong - please email us directly.');
      }
    } catch {
      setStatus('error');
      setError("Couldn't reach the server. Please try again.");
    }
  };

  return (
    <section id="contact" className="relative mt-32 md:mt-40 scroll-mt-24">
      <div className="mx-auto max-w-[1400px] px-6 sm:px-10">
        <SectionTitle eyebrow="Get in touch" title="Join the Network." />
        <div className="p-0 md:p-0">
          <form
            className="flex flex-col items-start space-y-6"
            name="contact"
            onSubmit={handleFormSubmit}
          >
            {/* Honeypot - hidden from humans, attractive to bots. */}
            <div
              aria-hidden
              className="absolute left-[-10000px] top-auto h-px w-px overflow-hidden"
            >
              <label htmlFor="contact-botfield">
                Don&rsquo;t fill this out
              </label>
              <input
                id="contact-botfield"
                name="bot-field"
                type="text"
                tabIndex={-1}
                autoComplete="off"
              />
            </div>
            <div className="flex flex-col md:flex-row md:space-x-4 space-y-6 md:space-y-0 w-full">
              <LabelInputContainer>
                <Label htmlFor="name">Full Name</Label>
                <Input
                  id="name"
                  placeholder="Tyler Adams"
                  type="text"
                  name="name"
                  autoComplete="name"
                  required
                />
              </LabelInputContainer>
              <LabelInputContainer>
                <Label htmlFor="email">Email Address</Label>
                <Input
                  id="email"
                  placeholder="projectmayhem@fc.com"
                  type="email"
                  name="email"
                  autoComplete="email"
                  required
                />
              </LabelInputContainer>
            </div>
            <div className="flex flex-col md:flex-row md:space-x-4 space-y-6 md:space-y-0 w-full">
              <LabelInputContainer>
                <Label htmlFor="company">Club or company (optional)</Label>
                <Input
                  id="company"
                  placeholder="Your club, academy, or organisation"
                  type="text"
                  name="company"
                  autoComplete="organization"
                />
              </LabelInputContainer>
              <LabelInputContainer>
                <Label htmlFor="who">I am a...</Label>
                <Select value={who} onValueChange={setWho}>
                  <SelectTrigger id="who" className="w-full">
                    <SelectValue placeholder="- Select -" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="player">Player</SelectItem>
                    <SelectItem value="venue">Venue</SelectItem>
                    <SelectItem value="equipment_provider">
                      Equipment Provider
                    </SelectItem>
                    <SelectItem value="league_organiser">
                      League Organiser
                    </SelectItem>
                    <SelectItem value="ambassador">
                      Potential Ambassador
                    </SelectItem>
                  </SelectContent>
                </Select>
              </LabelInputContainer>
            </div>
            <LabelInputContainer>
              <Label htmlFor="message">Message (optional)</Label>
              <Textarea id="message" placeholder="Hi..." name="message" />
            </LabelInputContainer>
            {status !== 'ok' && (
              <Button
                variant="playback"
                className="group w-full"
                disabled={status === 'pending'}
                type="submit"
              >
                {status === 'pending' ? (
                  'Loading...'
                ) : (
                  <>
                    Send
                    <span
                      aria-hidden
                      className="ml-2 inline-block transition-transform duration-300 motion-reduce:transition-none group-hover:translate-x-0.5"
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
                {status === 'pending' && <span>Submitting&hellip;</span>}
                {status === 'error' && (
                  <span>{error ?? 'Something went wrong.'}</span>
                )}
                {status === 'ok' && (
                  <span>Thanks - we&rsquo;ll be in touch shortly.</span>
                )}
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
