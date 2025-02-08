'use client';

import { AcademyOnboarding } from '../components/AcademyOnboarding';
import { AcademySubscriptions } from '../components/AcademySubscriptions';
import { ContactForm } from '../components/Contact';
export default function Academy() {
  return (
    <div>
      <AcademyOnboarding />
      <AcademySubscriptions />
      <ContactForm />
    </div>
  );
}
