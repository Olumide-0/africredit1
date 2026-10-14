// import { FaceDetectionProvider } from "@infinitered/react-native-mlkit-face-detection";
import {QueryClient, QueryClientProvider} from "@tanstack/react-query";
import { Stack } from "expo-router";
import { GestureHandlerRootView } from "react-native-gesture-handler";
import { LoanProvider } from "../contexts/LoanContext";
import { ProfileProvider } from "../contexts/ProfileContext";



const queryClient = new QueryClient();

export default function RootLayout() {
  return (
    <QueryClientProvider client={queryClient}>
      <GestureHandlerRootView style={{ flex: 1 }}>
  {/* <FaceDetectionProvider> */}
    <ProfileProvider>
      <LoanProvider>
        <Stack screenOptions={{ headerShown: false }} />
      </LoanProvider>
    </ProfileProvider>
  {/* </FaceDetectionProvider> */}
</GestureHandlerRootView>
    </QueryClientProvider>

  );
}