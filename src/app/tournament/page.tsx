'use client';

import { TournamentOnboarding } from '../components/TournamentOnboarding';
import { TournamentSubscriptions } from '../components/TournamentSubscriptions';
import { ContactForm } from '../components/Contact';

export default function Academy() {
    return (
        <div>
            <TournamentOnboarding />
            <TournamentSubscriptions />
            <ContactForm />
        </div>
    );
}
