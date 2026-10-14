import { useLocalSearchParams, useRouter } from "expo-router";
import { useState } from "react";
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
  ActivityIndicator,
} from "react-native";
import { useForm, Controller } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { useMutation } from "@tanstack/react-query";
import * as SecureStore from "expo-secure-store";
import { verifyRegistration } from "../services/api";

const createAccountSchema = z.object({
  password: z.string().min(8, "Password must be at least 8 characters."),
});

type CreateAccountFormData = z.infer<typeof createAccountSchema>;

export default function CreateAccount() {
  const router = useRouter();
  const { phone, otp } = useLocalSearchParams<{ phone: string; otp: string }>();
  const [showPassword, setShowPassword] = useState(false);
  const [formError, setFormError] = useState("");

  const {
    control,
    handleSubmit,
    watch,
    formState: { errors },
  } = useForm<CreateAccountFormData>({
    resolver: zodResolver(createAccountSchema),
    defaultValues: { password: "" },
  });

  const password = watch("password");

  const verifyRegistrationMutation = useMutation({
    mutationFn: verifyRegistration,
    onSuccess: async (data) => {
      if (data.token) {
        await SecureStore.setItemAsync("authToken", data.token);
      }
      router.push("./account-created");
    },
    onError: (error: Error) => {
      console.log("Verify registration error", error);
      setFormError(error.message);
    },
  });

  const getPasswordStrength = () => {
    if (!password || password.length === 0) return "";

    const hasUppercase = /[A-Z]/.test(password);
    const hasLowercase = /[a-z]/.test(password);
    const hasNumber = /[0-9]/.test(password);

    const score = [
      password.length >= 8,
      hasUppercase,
      hasLowercase,
      hasNumber,
    ].filter(Boolean).length;

    if (score <= 1) return "Weak password";
    if (score <= 3) return "Medium password";
    return "Strong password";
  };

  const onSubmit = (data: CreateAccountFormData) => {
    Keyboard.dismiss();
    verifyRegistrationMutation.mutate({
      phone_number: `+234${phone}`,
      otp,
      password: data.password,
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
          <Text style={styles.stepTitle}>Create Your Account</Text>
          <Text style={styles.dot}>•</Text>
          <Text style={styles.stepNumber}>Step 3 of 3</Text>
        </View>

        <Text style={styles.title}>Create account</Text>
        <Text style={styles.subtitle}>Create account with Phone number and password</Text>

        <Text style={styles.label}>Phone number</Text>
        <View style={styles.inputContainer}>
          <Text style={styles.phoneText}>{phone ? `+234${phone}` : "Phone number"}</Text>
        </View>

        {!!formError && <Text style={styles.errorText}>{formError}</Text>}

        <Text style={styles.label}>Password</Text>
        <Controller
          control={control}
          name="password"
          render={({ field: { onChange, onBlur, value } }) => (
            <View
              style={[
                styles.passwordContainer,
                errors.password && styles.passwordContainerError,
              ]}
            >
              <TextInput
                style={styles.passwordInput}
                value={value}
                onBlur={onBlur}
                onChangeText={(text) => {
                  onChange(text);
                  if (formError) setFormError("");
                }}
                placeholder="Enter a password"
                placeholderTextColor="#777"
                secureTextEntry={!showPassword}
                editable={!verifyRegistrationMutation.isPending}
                returnKeyType="done"
                onSubmitEditing={handleSubmit(onSubmit)}
              />
              <TouchableOpacity onPress={() => setShowPassword((v) => !v)}>
                <Text style={styles.eye}>{showPassword ? "◉" : "◉"}</Text>
              </TouchableOpacity>
            </View>
          )}
        />
        {!!errors.password && (
          <Text style={styles.errorText}>{errors.password.message}</Text>
        )}

        {!!password && password.length > 0 && !errors.password && (
          <Text style={styles.passwordStrength}>{getPasswordStrength()}</Text>
        )}
      </ScrollView>

      <TouchableOpacity
        style={[
          styles.createButton,
          verifyRegistrationMutation.isPending && styles.buttonDisabled,
        ]}
        onPress={handleSubmit(onSubmit)}
        disabled={verifyRegistrationMutation.isPending}
      >
        {verifyRegistrationMutation.isPending ? (
          <ActivityIndicator color="#fff" />
        ) : (
          <Text style={styles.createButtonText}>Create account</Text>
        )}
      </TouchableOpacity>
    </KeyboardAvoidingView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: "#FFFBF3" },
  scrollContent: { flexGrow: 1, paddingHorizontal: 36, paddingTop: 30 },
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
  stepTitle: { fontSize: 22, fontWeight: "600", color: "#28A982" },
  dot: { fontSize: 22, color: "#28A982", marginHorizontal: 10 },
  stepNumber: { fontSize: 22, color: "#75BCA5" },
  title: { fontSize: 36, fontWeight: "700", color: "#111", marginBottom: 8 },
  subtitle: { fontSize: 21, color: "#777", marginBottom: 36 },
  label: { fontSize: 20, color: "#333", marginBottom: 12 },
  inputContainer: {
    height: 70,
    borderWidth: 2,
    borderColor: "#D8D8D8",
    borderRadius: 15,
    backgroundColor: "#FFFFFF",
    justifyContent: "center",
    paddingHorizontal: 24,
    marginBottom: 28,
  },
  phoneText: { fontSize: 21, color: "#333" },
  passwordContainer: {
    height: 70,
    borderWidth: 2,
    borderColor: "#D8D8D8",
    borderRadius: 15,
    backgroundColor: "#FFFFFF",
    flexDirection: "row",
    alignItems: "center",
    paddingHorizontal: 24,
  },
  passwordContainerError: { borderColor: "#DC2626" },
  passwordInput: { flex: 1, fontSize: 20, color: "#333" },
  eye: { fontSize: 26, color: "#111" },
  errorText: { fontSize: 16, color: "#DC2626", marginTop: 10 },
  passwordStrength: { fontSize: 20, color: "#28A982", fontWeight: "600", marginTop: 10 },
  createButton: {
    marginHorizontal: 36,
    marginBottom: 32,
    marginTop: 12,
    height: 62,
    borderRadius: 10,
    backgroundColor: "#28A982",
    justifyContent: "center",
    alignItems: "center",
  },
  buttonDisabled: { opacity: 0.7 },
  createButtonText: { fontSize: 24, fontWeight: "700", color: "#FFFFFF" },
});