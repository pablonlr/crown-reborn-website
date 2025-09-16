import localFont from "next/font/local";
import { Montserrat, Montserrat_Alternates } from 'next/font/google'


export const montserrat = Montserrat({
  subsets: ['latin'],
  weight: ['100', '200', '300', '400', '500', '600', '700', '800', '900'], 
  variable: '--font-montserrat',
  display: 'swap',
})
export const montserratAlternates = Montserrat_Alternates({
  subsets: ['latin'],
  weight: ['100', '200', '300', '400', '500', '600', '700', '800', '900'], 
  variable: '--font-montserrat-alternates',
  display: 'swap',
})

export const medieval = localFont({
  src: [
    {
      path: "./fonts/MedievalTimes-AL7l6.ttf",
      weight: "700",
      style: "normal",
    },

  ],
  variable: "--font-medieval", 
  display: "swap",           
});
