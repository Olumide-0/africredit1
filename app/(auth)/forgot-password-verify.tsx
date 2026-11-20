import { useEffect, useRef, useState } from "react";
import {
  View,
  Text,
  TextInput,
  Pressable,
  StyleSheet,
  KeyboardAvoidingView,
  ScrollView,
  Platform,
  Keyboard,
  ActivityIndicator,
} from "react-native";
import { router, useLocalSearchParams } from "expo-router";
import { ArrowLeft } from "lucide-react-native";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { useMutation } from "@tanstack/react-query";
import { forgotPassword, verifyResetOtp } from "../../services/api";

const DIGIT_REGEX = /[^0-9]/g;

const verifySchema = z.object({
  otp: z.string().regex(/^\d{6}$/, "Please enter the 6-digit code."),
});

type VerifyFormData = z.infer<typeof verifySchema>;

export default function ForgotPasswordStep2() {
  const { phone } = useLocalSearchParams<{ phone: string }>();
  const [digits, setDigits] = useState(["", "", "", "", "", ""]);
  const [seconds, setSeconds] = useState(30);
  const [formError, setFormError] = useState("");
  const inputRefs = useRef<Array<TextInput | null>>([]);

  const {
    handleSubmit,
    setValue,
    formState: { errors, isSubmitted },
  } = useForm<VerifyFormData>({
    resolver: zodResolver(verifySchema),
    defaultValues: { otp: "" },
  });

  useEffect(() => {
    if (seconds === 0) return;
    const timer = setInterval(() => {
      setSeconds((previous) => previous - 1);
    }, 1000);
    return () => clearInterval(timer);
  }, [seconds]);

  const clearCode = () => {
    setDigits(["", "", "", "", "", ""]);
    setValue("otp", "");
    inputRefs.current[0]?.focus();
  };

  const verifyMutation = useMutation({
    mutationFn: verifyResetOtp,
    onSuccess: (_, variables) => {
      router.push({
        pathname: "/forgot-password-reset",
        params: { phone, otp: variables.otp },
      });
    },
    onError: (error: Error) => {
      console.log("Verify OTP error", error);
      setFormError(error.message);
      clearCode();
    },
  });

  const resendMutation = useMutation({
    mutationFn: forgotPassword,
    onSuccess: () => {
      setSeconds(30);
      setFormError("");
      clearCode();
    },
    onError: (error: Error) => {
      console.log("Resend OTP error", error);
      setFormError(error.message);
    },
  });

  const handleChange = (value: string, index: number) => {
    const digit = value.replace(DIGIT_REGEX, "").slice(-1);
    const next = [...digits];
    next[index] = digit;
    setDigits(next);
    setValue("otp", next.join(""), { shouldValidate: isSubmitted });
    if (formError) setFormError("");

    if (digit && index < 5) {
      inputRefs.current[index + 1]?.focus();
    } else if (digit && index === 5) {
      Keyboard.dismiss();
    }
  };

  const handleKeyPress = (event: any, index: number) => {
    if (event.nativeEvent.key === "Backspace" && !digits[index] && index > 0) {
      inputRefs.current[index - 1]?.focus();
    }
  };

  const handleResend = () => {
    if (seconds > 0 || resendMutation.isPending) return;
    resendMutation.mutate({ phone_number: `+234${phone}` });
  };

  const onSubmit = (data: VerifyFormData) => {
    Keyboard.dismiss();
    setFormError("");
    verifyMutation.mutate({ phone_number: `+234${phone}`, otp: data.otp });
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
        <Pressable style={styles.backButton} onPress={() => router.back()}>
          <ArrowLeft size={20} color="#111827" />
        </Pressable>

        <Text style={styles.stepLabel}>Reset Password  •  Step 2 of 3</Text>
        <Text style={styles.title}>Enter the 6-digit code</Text>
        <Text style={styles.subtitle}>Sent to +234 {phone}</Text>

        {!!formError && <Text style={styles.formError}>{formError}</Text>}

        <View style={styles.codeRow}>
          {digits.map((digit, i) => (
            <TextInput
              key={i}
              ref={(ref) => {
                inputRefs.current[i] = ref;
              }}
              style={[styles.codeInput, errors.otp && styles.codeInputError]}
              value={digit}
              onChangeText={(v) => handleChange(v, i)}
              onKeyPress={(e) => handleKeyPress(e, i)}
              keyboardType="number-pad"
              maxLength={1}
              editable={!verifyMutation.isPending}
              returnKeyType={i === 5 ? "done" : "next"}
              onSubmitEditing={i === 5 ? handleSubmit(onSubmit) : undefined}
            />
          ))}
        </View>
        {!!errors.otp && <Text style={styles.errorText}>{errors.otp.message}</Text>}

        <Text style={styles.resendText}>
          Didn&apos;t get it?{" "}
          {seconds > 0 ? (
            <>
              Resend code in{" "}
              <Text style={styles.resendTimer}>
                00:{seconds.toString().padStart(2, "0")}
              </Text>
            </>
          ) : (
            <Text style={styles.resendTimer} onPress={handleResend}>
              {resendMutation.isPending ? "Sending..." : "Resend code"}
            </Text>
          )}
        </Text>
      </ScrollView>

      <Pressable
        style={[styles.button, verifyMutation.isPending && styles.buttonDisabled]}
        onPress={handleSubmit(onSubmit)}
        disabled={verifyMutation.isPending}
      >
        {verifyMutation.isPending ? (
          <ActivityIndicator color="#fff" />
        ) : (
          <Text style={styles.buttonText}>Verify</Text>
        )}
      </Pressable>
    </KeyboardAvoidingView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: "#FAF3EA",
  },
  scrollContent: {
    flexGrow: 1,
    paddingHorizontal: 24,
    paddingTop: 60,
  },
  backButton: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: "#fff",
    alignItems: "center",
    justifyContent: "center",
    marginBottom: 24,
  },
  stepLabel: {
    color: "#22A67A",
    fontSize: 13,
    fontWeight: "600",
    marginBottom: 8,
  },
  title: {
    fontSize: 22,
    fontWeight: "bold",
    color: "#111827",
    marginBottom: 8,
  },
  subtitle: {
    fontSize: 14,
    color: "#6b7280",
    marginBottom: 24,
  },
  formError: {
    color: "#DC2626",
    fontSize: 13,
    marginBottom: 16,
  },
  codeRow: {
    flexDirection: "row",
    gap: 8,
    marginBottom: 12,
  },
  codeInput: {
    width: 48,
    height: 52,
    borderWidth: 1,
    borderColor: "#E5E7EB",
    borderRadius: 10,
    textAlign: "center",
    fontSize: 18,
    fontWeight: "700",
    color: "#111827",
    backgroundColor: "#fff",
  },
  codeInputError: {
    borderColor: "#DC2626",
  },
  errorText: {
    color: "#DC2626",
    fontSize: 12,
    marginBottom: 12,
  },
  resendText: {
    fontSize: 13,
    color: "#6b7280",
  },
  resendTimer: {
    color: "#22A67A",
    fontWeight: "700",
  },
  button: {
    backgroundColor: "#22A67A",
    borderRadius: 10,
    paddingVertical: 16,
    alignItems: "center",
    marginHorizontal: 24,
    marginTop: 12,
    marginBottom: 32,
  },
  buttonDisabled: {
    opacity: 0.7,
  },
  buttonText: {
    color: "#fff",
    fontSize: 16,
    fontWeight: "700",
  },
});