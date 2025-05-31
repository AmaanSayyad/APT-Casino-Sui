
import { Inter } from "next/font/google";
import "@/styles/globals.css";
import Providers from "./providers";
import Navbar from "@/components/Navbar";
import Footer from "@/components/Footer";
import { QueryClientProvider } from "@tanstack/react-query";
import "@mysten/dapp-kit/dist/index.css"; 

const inter = Inter({ subsets: ["latin"] });

export const metadata = {
  title: "APT Casino",
  description: "APT Casino",
};

export default function RootLayout({ children }) {
  return (
    <html lang="en">
      <body className={`${inter.className} overflow-x-hidden w-full`}>
        <Providers>
              <Navbar />
              {children}
              <Footer />
        </Providers>
      </body>
    </html>
  );
}


// export default function RootLayout({ children }) {
//   return (
//     <html lang="en">
//       <body className={`${inter.className} overflow-x-hidden w-full`}>
//         <NotificationProvider>
//           <QueryClientProvider>
//             <SuiClientProvider defaultNetwork="testnet" network={networkConfig}>
//             <WallletProvider autoConnect={true}>
//               <Navbar />
//               {children}
//               <Footer />
//             </WallletProvider>
//             </SuiClientProvider>
//           </QueryClientProvider>

//         </NotificationProvider>
//       </body>
//     </html>
//   );
// }

