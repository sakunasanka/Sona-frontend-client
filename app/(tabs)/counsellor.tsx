import { useRouter } from "expo-router";
import { useEffect, useState } from "react";

const Counsellor = () => {
  const router = useRouter();
  const [isRedirecting, setIsRedirecting] = useState(false);

  useEffect(() => {
    const redirect = async () => {
      setIsRedirecting(true);
      
      // Optional: Add a small delay to show loading state
      // await new Promise(resolve => setTimeout(resolve, 500));
      
      router.replace("/(hidden)/profile/counsellors");
    };

    redirect();
  }, []);

  return null;
};

export default Counsellor;