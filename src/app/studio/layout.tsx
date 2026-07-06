// Sanity Studio lives outside the [locale] tree (sanity.config.ts hardcodes
// basePath: '/studio'), so it needs its own root layout. Deliberately bare:
// the Studio brings its own chrome and must not render inside the marketing
// NavBar/Footer or require a locale context.
export default function StudioLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en">
      <body>{children}</body>
    </html>
  );
}
