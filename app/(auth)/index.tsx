import { router } from "expo-router";
import { useEffect } from "react";
import "../global.css";

export default function Home() {
  useEffect(() => {
    router.replace('/(auth)/signin');
  }, []);
}