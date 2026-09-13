import './globals.css';

export const metadata = {
  title: 'Rejoice Weekly Independent Publisher Dashboard',
  description: 'Local publishing operating system for Rejoice Weekly Independent Publishers.'
};

export default function RootLayout({ children }) {
  return (
    <html lang="en">
      <body>{children}</body>
    </html>
  );
}
