'use client';

import { useTranslations } from 'next-intl';
import { Gotcha } from 'gotcha-feedback';

export function ProviderRequestGotcha() {
  const t = useTranslations('playscanner.results.providerRequest');
  return (
    <Gotcha
      elementId="playscanner-provider-request"
      position="inline"
      size="sm"
      theme="dark"
      showRating={false}
      showOnHover={false}
      promptText={t('prompt')}
      placeholder={t('placeholder')}
    />
  );
}
