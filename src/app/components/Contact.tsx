'use client';

import React, { useState } from 'react';
import { Label } from './ui/label';
import { Input } from './ui/input';
import { cn } from '@/app/utils/cn';
import { Textarea } from './ui/textarea';
import SectionTitle from './ui/section-title';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/app/components/ui/select';

type Status = 'pending' | 'ok' | 'error';

export function ContactForm() {
  const [status, setStatus] = useState<Status | null>(null);
  const [error, setError] = useState<string | null>(null);

  const handleFormSubmit = async (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    try {
      setStatus('pending');
      setError(null);
      const myForm = event.currentTarget;
      const formData = new FormData(myForm);
      const res = await fetch('/__forms.html', {
        method: 'POST',
        headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
        body: new URLSearchParams(formData as any).toString(),
      });
      if (res.status === 200) {
        setStatus('ok');
      } else {
        setStatus('error');
        setError(`${res.status} ${res.statusText}`);
      }
    } catch (e) {
      setStatus('error');
      setError(`${e}`);
    }
  };

  return (
    <div className="container w-full rounded-none md:rounded-2xl p-4 md:p-8 shadow-input bg-[var(--night)] mb-8">
      <SectionTitle title="Need Help?" />
      <form
        className="mb-2 mt-[-2rem] flex flex-col items-start space-y-6"
        name="contact"
        onSubmit={handleFormSubmit}
      >
        <p className="hidden">
          <label>
            Don&rsquo;t fill this out if you&rsquo;re human:{' '}
            <input name="bot-field" />
          </label>
        </p>
        <input type="hidden" name="form-name" value="contact" />
        <div className="flex flex-col md:flex-row md:space-x-4 space-y-6 md:space-y-0 w-full">
          <LabelInputContainer>
            <Label htmlFor="name">Full Name</Label>
            <Input
              id="name"
              placeholder="Tyler Adams"
              type="text"
              name="name"
            />
          </LabelInputContainer>
          <LabelInputContainer>
            <Label htmlFor="email">Email Address</Label>
            <Input
              id="email"
              placeholder="projectmayhem@fc.com"
              type="email"
              name="email"
              required
            />
          </LabelInputContainer>
        </div>
        <div className="flex flex-col md:flex-row md:space-x-4 space-y-6 md:space-y-0 w-full">
          <LabelInputContainer>
            <Label htmlFor="company">Company</Label>
            <Input
              id="company"
              placeholder="Alphabet LTD"
              type="text"
              name="company"
              required
            />
          </LabelInputContainer>
          <LabelInputContainer>
            <Label htmlFor="who">I am a...</Label>
            <Select name="who">
              <SelectTrigger className="w-full">
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
                <SelectItem value="ambassador">Potential Ambassador</SelectItem>
              </SelectContent>
            </Select>
          </LabelInputContainer>
        </div>
        <LabelInputContainer>
          <Label htmlFor="message">Message (optional)</Label>
          <Textarea id="message" placeholder="Hi..." name="message" />
        </LabelInputContainer>
        {status !== 'ok' && (
          <button
            className="bg-gradient-to-br relative group/btn from-zinc-900 to-zinc-900 block bg-zinc-800 w-full text-white rounded-md h-10 font-medium shadow-[0px_1px_0px_0px_var(--zinc-800)_inset,0px_-1px_0px_0px_var(--zinc-800)_inset]"
            disabled={status === 'pending'}
            type="submit"
          >
            {status === 'pending' ? 'Loading...' : <>Send &rarr;</>}
            <BottomGradient />
          </button>
        )}
        <div className="bg-gradient-to-r from-transparent via-neutral-700 to-transparent my-8 h-[1.5px] w-full" />
        {status !== null && (
          <div className="flex items-center justify-center w-full pt-2 text-lg font-medium text-center">
            {status === 'pending' && <span>Submitting...</span>}
            {status === 'error' && (
              <span>
                Something went wrong <br />
                {error}
              </span>
            )}
            {status === 'ok' && <span>Thank you for your submission</span>}
          </div>
        )}
      </form>
    </div>
  );
}

const BottomGradient = () => {
  return (
    <>
      <span className="group-hover/btn:opacity-100 block transition duration-500 opacity-0 absolute h-px w-full -bottom-px inset-x-0 bg-gradient-to-r from-transparent via-[var(--timberwolf)] to-transparent" />
      <span className="group-hover/btn:opacity-100 blur-sm block transition duration-500 opacity-0 absolute h-px w-1/2 mx-auto -bottom-px inset-x-10 bg-gradient-to-r from-transparent via-[var(--timberwolf)] to-transparent" />
    </>
  );
};

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
