'use client';

import React, { useState } from 'react';
import { Label } from './ui/label';
import { Input } from './ui/input';
import { cn } from '@/app/utils/cn';
import { Textarea } from './ui/textarea';
import { RadioGroup, RadioGroupItem } from '@/app/components/ui/radio-group';

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
    <div className="md:border border-[var(--timberwolf)]  max-w-md w-full mx-auto rounded-none md:rounded-2xl p-4 md:p-8 shadow-input bg-[var(--night)] mb-8">
      <div className="my-4 flex items-center justify-center text-lg font-medium text-center">
        {status === 'error' && (
          <span>
            Something went wrong <br />
            {error}
          </span>
        )}
        {status === 'ok' && (
          <span>
            Thank you for your submission
          </span>
        )}
      </div>
      <h2 className="font-bold text-3xl text-neutral-200">Join us</h2>

      <form
        className="my-2 flex flex-col items-start space-y-6"
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
        <RadioGroup defaultValue="venue" className="mb-2" name="who">
          <Label className="mb-2">Who am I?</Label>
          <div className="flex items-center space-x-2">
            <RadioGroupItem value="venue" id="r1" />
            <Label htmlFor="r1">Venue</Label>
          </div>
          <div className="flex items-center space-x-2">
            <RadioGroupItem value="camera_provider" id="r2" />
            <Label htmlFor="r2">Camera Provider</Label>
          </div>
          <div className="flex items-center space-x-2">
            <RadioGroupItem value="league_organiser" id="r3" />
            <Label htmlFor="r3">League Organiser</Label>
          </div>
          <div className="flex items-center space-x-2">
            <RadioGroupItem value="ambassador" id="r4" />
            <Label htmlFor="r4">Potential Ambassador</Label>
          </div>
        </RadioGroup>
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
          <Label htmlFor="message">Message (optional)</Label>
          <Textarea id="message" placeholder="Hi..." name="message" />
        </LabelInputContainer>
        <button
          className="bg-gradient-to-br relative group/btn from-zinc-900 to-zinc-900 block bg-zinc-800 w-full text-white rounded-md h-10 font-medium shadow-[0px_1px_0px_0px_var(--zinc-800)_inset,0px_-1px_0px_0px_var(--zinc-800)_inset]"
          disabled={status === 'pending'}
          type="submit"
        >
          {status === 'pending' ? 'Loading...' : <>Send &rarr;</>}
          <BottomGradient />
        </button>

        <div className="bg-gradient-to-r from-transparent via-neutral-700 to-transparent my-8 h-[1px] w-full" />
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
