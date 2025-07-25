import "./global.css";
import { FooterWithLogo } from "../components/footer";

export const metadata = {
  title: 'mosAIc',
  description: 'A mosaic of AI tools',
}

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en">
      <body>
        {children}
        <FooterWithLogo />
      </body>
    </html>
  );
}