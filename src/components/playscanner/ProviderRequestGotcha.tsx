'use client';

import { Gotcha } from 'gotcha-feedback';

export function ProviderRequestGotcha() {
  return (
    <Gotcha
      elementId="playscanner-provider-request"
      position="inline"
      size="sm"
      theme="dark"
      showRating={false}
      showOnHover={false}
      promptText="Missing a booking provider?"
      placeholder="Which provider would you like us to add? (e.g. Playtomic, MATCHi, LTA Clubspark)"
    />
  );
}
