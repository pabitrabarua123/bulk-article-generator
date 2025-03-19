import { brandName } from "@/config";
import { getSEOTags } from "@/components/SEOTags/SEOTags";
import { Metadata } from "next";
import Login from "@/components/pages/Login/Login";

export const metadata: Metadata = getSEOTags({
  title: 'Login | Bulk Article Generator',
  description: `Login to your account`,
});

const LoginPage = () => {
  return <Login />;
};

export default LoginPage;
