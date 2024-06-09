'use client';

import React from 'react';
import { Label } from './ui/label';
import { Input } from './ui/input';
import { cn } from '@/app/utils/cn';
import { Textarea } from './ui/textarea';
import { RadioGroup, RadioGroupItem } from '@/app/components/ui/radio-group';

export function ContactForm() {
  return (
    <div className="md:border border-[var(--timberwolf)]  max-w-md w-full mx-auto rounded-none md:rounded-2xl p-4 md:p-8 shadow-input bg-[var(--night)] mb-8">
      <h2 className="font-bold text-xl text-neutral-200">Join us</h2>
      <p className=" text-sm max-w-sm mt-2 text-neutral-300">
        Become a PLAYBACK venue partner.
      </p>

      <form
        className="my-8 flex flex-col items-start space-y-6"
        data-netlify="true"
        action="/success"
        name="contact"
        method="POST"
        netlify-honeypot="bot-field"
      >
        <p className="hidden">
          <label>
            Don&rsquo;t fill this out if you&rsquo;re human: <input name="bot-field" />
          </label>
        </p>
        <input type="hidden" name="form-name" value="contact" />
        <RadioGroup defaultValue="venue" className="mb-2">
          <Label className="mb-2">How am I?</Label>
          <div className="flex items-center space-x-2">
            <RadioGroupItem value="venue" id="r1" />
            <Label htmlFor="r1">Venue</Label>
          </div>
          <div className="flex items-center space-x-2">
            <RadioGroupItem value="camera_provider" id="r2" />
            <Label htmlFor="r2">Camera provider</Label>
          </div>
        </RadioGroup>
        <div className="flex flex-col md:flex-row space-y-2 md:space-y-0 md:space-x-2">
          <LabelInputContainer>
            <Label htmlFor="firstname">First name</Label>
            <Input id="firstname" placeholder="Tyler" type="text" />
          </LabelInputContainer>
          <LabelInputContainer>
            <Label htmlFor="lastname">Last name</Label>
            <Input id="lastname" placeholder="Durden" type="text" />
          </LabelInputContainer>
        </div>
        <LabelInputContainer>
          <Label htmlFor="email">Email Address</Label>
          <Input id="email" placeholder="projectmayhem@fc.com" type="email" />
        </LabelInputContainer>
        <LabelInputContainer>
          <Label htmlFor="company">Company</Label>
          <Input id="company" placeholder="Alphabet LTD" type="text" />
        </LabelInputContainer>
        <LabelInputContainer>
          <Label htmlFor="message">Message (optional)</Label>
          <Textarea id="message" placeholder="Hi..." />
        </LabelInputContainer>
        <button
          className="bg-gradient-to-br relative group/btn from-zinc-900 to-zinc-900 block bg-zinc-800 w-full text-white rounded-md h-10 font-medium shadow-[0px_1px_0px_0px_var(--zinc-800)_inset,0px_-1px_0px_0px_var(--zinc-800)_inset]"
          type="submit"
        >
          Send &rarr;
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
