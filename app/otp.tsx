import { router, useLocalSearchParams } from "expo-router";
import { useEffect, useRef, useState } from "react";
import {
  StyleSheet,
  Text,
  TextInput,
  TouchableOpacity,
  View,
  KeyboardAvoidingView,
  ScrollView,
  Platform,
  Keyboard,
} from "react-native";

export default function OTP() {
  const [seconds, setSeconds] = useState(30);
  const { phone } = useLocalSearchParams<{ phone: string }>();
  const [otp, setOtp] = useState(["", "", "", "", "", ""]);
  const [formError, setFormError] = useState("");

  const inputRefs = useRef<(TextInput | null)[]>([]);

  useEffect(() => {
    if (seconds === 0) return;
    const timer = setInterval(() => {
      setSeconds((previous) => previous - 1);
    }, 1000);
    return () => clearInterval(timer);
  }, [seconds]);

  const handleResend = () => {
    if (seconds > 0) return;

    // TODO: wire to a real resend endpoint once available (likely /auth/register again)
    alert("A new verification code has been sent.");
    setSeconds(30);
    setOtp(["", "", "", "", "", ""]);
    setFormError("");
    inputRefs.current[0]?.focus();
  };

  const handleChange = (text: string, index: number) => {
    const number = text.replace(/[^0-9]/g, "");
    const newOtp = [...otp];
    newOtp[index] = number.slice(-1);
    setOtp(newOtp);
    if (formError) setFormError("");

    if (number && index < 5) {
      inputRefs.current[index + 1]?.focus();
    } else if (number && index === 5) {
      Keyboard.dismiss();
    }
  };

  const handleKeyPress = (event: any, index: number) => {
    if (event.nativeEvent.key === "Backspace" && !otp[index] && index > 0) {
      inputRefs.current[index - 1]?.focus();
    }
  };

  const handleContinue = () => {
    Keyboard.dismiss();

    const code = otp.join("");

    if (code.length !== 6) {
      setFormError("Please enter the 6-digit code");
      inputRefs.current[0]?.focus();
      return;
    }

    // OTP is verified together with the password at step 3
    router.push({
      pathname: "/create-account",
      params: { phone, otp: code },
    });
  };

  return (
    <KeyboardAvoidingView
      style={styles.container}
      behavior={Platform.OS === "ios" ? "padding" : "height"}
      keyboardVerticalOffset={Platform.OS === "ios" ? 0 : 20}
    >
      <ScrollView
        contentContainerStyle={styles.scrollContent}
        keyboardShouldPersistTaps="handled"
        showsVerticalScrollIndicator={false}
      >
        <TouchableOpacity style={styles.backButton} onPress={() => router.back()}>
          <Text style={styles.backArrow}>←</Text>
        </TouchableOpacity>

        <View style={styles.stepRow}>
          <Text style={styles.createAccount}>Create Your Account</Text>
          <Text style={styles.dot}>•</Text>
          <Text style={styles.step}>Step 2 of 3</Text>
        </View>

        <Text style={styles.title}>Enter the 6-digit code</Text>

        <View style={styles.phoneRow}>
          <Text style={styles.sentText}>Sent to</Text>
          <Text style={styles.phoneNumber}>+234{phone}</Text>
          <Text style={styles.dot}>•</Text>
          <TouchableOpacity onPress={() => router.back()}>
            <Text style={styles.changeNumber}>Change number</Text>
          </TouchableOpacity>
        </View>

        {!!formError && <Text style={styles.errorText}>{formError}</Text>}

        <View style={styles.otpContainer}>
          {otp.map((digit, index) => (
            <TextInput
              key={index}
              ref={(ref) => {
                inputRefs.current[index] = ref;
              }}
              style={[styles.otpBox, formError && styles.otpBoxError]}
              value={digit}
              onChangeText={(text) => handleChange(text, index)}
              onKeyPress={(event) => handleKeyPress(event, index)}
              keyboardType="number-pad"
              maxLength={1}
              textAlign="center"
              returnKeyType={index === 5 ? "done" : "next"}
              onSubmitEditing={index === 5 ? handleContinue : undefined}
            />
          ))}
        </View>

        <View style={styles.resendRow}>
          <Text style={styles.resendText}>Didn't get it? </Text>
          {seconds > 0 ? (
            <Text style={styles.resendText}>
              Resend code in{" "}
              <Text style={styles.timer}>00:{seconds.toString().padStart(2, "0")}</Text>
            </Text>
          ) : (
            <Text style={styles.resendLink} onPress={handleResend}>
              Resend code
            </Text>
          )}
        </View>
      </ScrollView>

      <TouchableOpacity style={styles.button} onPress={handleContinue}>
        <Text style={styles.buttonText}>Continue</Text>
      </TouchableOpacity>
    </KeyboardAvoidingView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: "#FFFDF3" },
  scrollContent: { flexGrow: 1, paddingHorizontal: 24, paddingTop: 30 },
  backButton: {
    width: 58,
    height: 58,
    borderRadius: 29,
    borderWidth: 1,
    borderColor: "#D8D8D8",
    justifyContent: "center",
    alignItems: "center",
    marginBottom: 28,
  },
  backArrow: { fontSize: 32, color: "#111" },
  stepRow: { flexDirection: "row", alignItems: "center", marginBottom: 36 },
  createAccount: { fontSize: 22, fontWeight: "600", color: "#28A982" },
  dot: { fontSize: 22, color: "#28A982", marginHorizontal: 8 },
  step: { fontSize: 20, color: "#70BCA8" },
  title: { fontSize: 28, fontWeight: "700", color: "#111", marginBottom: 10 },
  phoneRow: { flexDirection: "row", alignItems: "center", flexWrap: "wrap", marginBottom: 20 },
  sentText: { fontSize: 18, color: "#777" },
  phoneNumber: { fontSize: 16, fontWeight: "600", color: "#111", marginLeft: 5 },
  changeNumber: { fontSize: 16, color: "#28A982" },
  errorText: { fontSize: 16, color: "#DC2626", marginBottom: 16 },
  otpContainer: { flexDirection: "row", justifyContent: "space-between", marginBottom: 20 },
  otpBox: {
    width: 48,
    height: 64,
    borderWidth: 2,
    borderColor: "#D8D8D8",
    borderRadius: 14,
    backgroundColor: "#FFF",
    fontSize: 24,
    color: "#111",
  },
  otpBoxError: { borderColor: "#DC2626" },
  resendRow: { flexDirection: "row", alignItems: "center" },
  resendLink: { color: "#28A982", fontWeight: "600" },
  resendText: { fontSize: 18, color: "#777" },
  timer: { fontSize: 18, color: "#28A982", fontWeight: "600" },
  button: {
    marginHorizontal: 36,
    marginBottom: 30,
    marginTop: 12,
    height: 82,
    borderRadius: 18,
    backgroundColor: "#28A982",
    justifyContent: "center",
    alignItems: "center",
  },
  buttonText: { color: "#FFF", fontSize: 24, fontWeight: "700" },
});