import "@/app/globals.css";
import type { Metadata } from "next";
import { AuthProvider } from "@/contexts/AuthContext";
import { NuqsAdapter } from "nuqs/adapters/next/app";
import { Provider } from "react-redux";
import { store } from "@/store/store";

export const metadata: Metadata = {
  title: "Thothy",
  description: "Thothy",
};

// TODO: Replace NuqsAdapter with useState and props
export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en">
      <body suppressHydrationWarning>
        <Provider store={store}>
          <NuqsAdapter>
            <AuthProvider>{children}</AuthProvider>
          </NuqsAdapter>
        </Provider>
      </body>
    </html>
  );
}
