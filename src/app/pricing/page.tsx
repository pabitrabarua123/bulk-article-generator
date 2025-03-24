import { Footer } from "@/components/Footer/Footer";
import { Header } from "@/components/Header/Header";
import { Pricing } from "@/components/Pricing/Pricing";

export const metadata = {
    title: 'Pricing | Bulk Article Generator',
    description: '',
  };

export default function PricingPage() {
  return (
    <>
      <Header />
      <main className="">
        <Pricing />
      </main>
      <Footer />
    </>
  );
}
