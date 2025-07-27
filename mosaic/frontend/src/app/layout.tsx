import "./global.css";

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
       <footer className="bg-gray-800 text-white text-center py-4">
          <p className="text-sm">
            &copy; {new Date().getFullYear()} mosAIc. All rights reserved.
          </p>
        </footer>
      </body>
    </html>
  );
}