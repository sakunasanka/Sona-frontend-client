import { Text, View } from "react-native";
import { PrimaryButton } from "../components/Buttons";
import "../global.css";
import { router } from "expo-router";
import SignIn from "./signin"; 

export default function Home() {
  return (
    <SignIn/>
  );
}