import { useState, useRef } from "react";
import {
  View,
  Text,
  TextInput,
  Pressable,
  StyleSheet,
  Image,
  ActivityIndicator,
  KeyboardAvoidingView,
  ScrollView,
  Platform,
  Keyboard,
} from "react-native";
import { Link, router } from "expo-router";
import { Eye, EyeOff } from "lucide-react-native";
import { useMutation } from "@tanstack/react-query";
import * as SecureStore from "expo-secure-store";
import logo from "../../assets/images/africredit-logo.png";
import { login } from "../../services/api";

const PHONE_REGEX = /[^0-9\s]/g;
const PHONE_DIGITS_REGEX = /^\d{10,13}$/;

export default function SignIn() {
  const [phone, setPhone] = useState("234 345 4567");
  const [password, setPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [phoneError, setPhoneError] = useState("");
  const [passwordError, setPasswordError] = useState("");
  const [formError, setFormError] = useState("");

  const passwordInputRef = useRef<TextInput>(null);

  const loginMutation = useMutation({
    mutationFn: login,
    onSuccess: async (data) => {
      await SecureStore.setItemAsync("authToken", data.token);
      router.push("/(tabs)/home");
    },
    onError: (error: Error) => {
      console.log("Login mutation error", error);
      setFormError(error.message);
    },
  });

  const handlePhoneChange = (value: string) => {
    setPhone(value.replace(PHONE_REGEX, ""));
    if (phoneError) setPhoneError("");
    if (formError) setFormError("");
  };

  const handlePasswordChange = (value: string) => {
    setPassword(value);
    if (passwordError) setPasswordError("");
    if (formError) setFormError("");
  };

  const validate = () => {
    const digitsOnly = phone.replace(/\s/g, "");
    let phoneMsg = "";
    let passwordMsg = "";

    if (!digitsOnly) {
      phoneMsg = "Phone number is required";
    } else if (!PHONE_DIGITS_REGEX.test(digitsOnly)) {
      phoneMsg = "Enter a valid phone number";
    }

    if (!password) {
      passwordMsg = "Password is required";
    } else if (password.length < 6) {
      passwordMsg = "Password must be at least 6 characters";
    }

    setPhoneError(phoneMsg);
    setPasswordError(passwordMsg);

    return { isValid: !phoneMsg && !passwordMsg, phoneMsg, passwordMsg };
  };

  const handleLogin = () => {
    Keyboard.dismiss();

    const { isValid, phoneMsg, passwordMsg } = validate();

    if (!isValid) {
      console.log("Login blocked — validation failed", {
        phone,
        password,
        phoneError: phoneMsg,
        passwordError: passwordMsg,
      });
      return;
    }

    const digitsOnly = phone.replace(/\s/g, "");
    const formattedPhone = `+234${digitsOnly.replace(/^234/, "")}`;

    console.log("Login submitted", { phone: formattedPhone });
    loginMutation.mutate({ phone_number: formattedPhone, password });
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
        <View style={styles.logoSection}>
          <Image source={logo} style={styles.logo} resizeMode="contain" />
          <Text style={styles.tagline}>Just a smarter way to borrow</Text>
        </View>

        <View style={styles.card}>
          <Text style={styles.title}>Welcome back</Text>
          <Text style={styles.subtitle}>
            Log in to check your loan status and manage repayments.
          </Text>

          {!!formError && <Text style={styles.formError}>{formError}</Text>}

          <Text style={styles.label}>Phone number</Text>
          <TextInput
            style={[styles.input, phoneError && styles.inputError]}
            value={phone}
            onChangeText={handlePhoneChange}
            keyboardType="phone-pad"
            placeholder="234 345 4567"
            placeholderTextColor="#9ca3af"
            maxLength={13}
            editable={!loginMutation.isPending}
            returnKeyType="next"
            onSubmitEditing={() => passwordInputRef.current?.focus()}
            blurOnSubmit={false}
          />
          {!!phoneError && <Text style={styles.errorText}>{phoneError}</Text>}

          <Text style={styles.label}>Password</Text>
          <View
            style={[styles.passwordRow, passwordError && styles.inputError]}
          >
            <TextInput
              ref={passwordInputRef}
              style={styles.passwordInput}
              value={password}
              onChangeText={handlePasswordChange}
              placeholder="Enter a password"
              placeholderTextColor="#9ca3af"
              secureTextEntry={!showPassword}
              editable={!loginMutation.isPending}
              returnKeyType="done"
              onSubmitEditing={handleLogin}
            />
            <Pressable onPress={() => setShowPassword((v) => !v)}>
              {showPassword ? (
                <EyeOff size={20} color="#6b7280" />
              ) : (
                <Eye size={20} color="#6b7280" />
              )}
            </Pressable>
          </View>
          {!!passwordError && (
            <Text style={styles.errorText}>{passwordError}</Text>
          )}

          <Link href="/forgot-password" asChild>
            <Pressable>
              <Text style={styles.forgotPassword}>Forgot password?</Text>
            </Pressable>
          </Link>

          <Pressable
            style={[
              styles.loginButton,
              loginMutation.isPending && styles.loginButtonDisabled,
            ]}
            onPress={handleLogin}
            disabled={loginMutation.isPending}
          >
            {loginMutation.isPending ? (
              <ActivityIndicator color="#fff" />
            ) : (
              <Text style={styles.loginButtonText}>Login</Text>
            )}
          </Pressable>

          <View style={styles.signupRow}>
            <Text style={styles.signupText}>New to AfriCredit? </Text>
            <Link href="/signup" asChild>
              <Pressable>
                <Text style={styles.signupLink}>Create an account</Text>
              </Pressable>
            </Link>
          </View>
        </View>
      </ScrollView>
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
  },
  logoSection: {
    alignItems: "center",
    paddingTop: 80,
    paddingBottom: 60,
  },
  logo: {
    width: 383,
    height: 234,
  },
  tagline: {
    color: "#9ca3af",
    fontSize: 13,
    marginTop: -8,
  },
  card: {
    flex: 1,
    backgroundColor: "#FFFFFF",
    borderTopLeftRadius: 28,
    borderTopRightRadius: 28,
    paddingHorizontal: 24,
    paddingTop: 28,
    paddingBottom: 32,
  },
  title: {
    fontSize: 22,
    fontWeight: "bold",
    color: "#111827",
  },
  subtitle: {
    fontSize: 14,
    color: "#6b7280",
    marginTop: 4,
    marginBottom: 24,
  },
  formError: {
    color: "#DC2626",
    fontSize: 13,
    marginBottom: 16,
    textAlign: "center",
  },
  label: {
    fontSize: 13,
    color: "#374151",
    marginBottom: 6,
  },
  input: {
    borderWidth: 1,
    borderColor: "#E5E7EB",
    borderRadius: 10,
    paddingHorizontal: 14,
    paddingVertical: 14,
    fontSize: 15,
    color: "#111827",
    marginBottom: 18,
  },
  inputError: {
    borderColor: "#DC2626",
    marginBottom: 6,
  },
  errorText: {
    color: "#DC2626",
    fontSize: 12,
    marginBottom: 12,
  },
  passwordRow: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    borderWidth: 1,
    borderColor: "#E5E7EB",
    borderRadius: 10,
    paddingHorizontal: 14,
    paddingVertical: 14,
  },
  passwordInput: {
    flex: 1,
    fontSize: 15,
    color: "#111827",
  },
  forgotPassword: {
    alignSelf: "flex-end",
    color: "#22A67A",
    fontSize: 13,
    fontWeight: "600",
    marginTop: 10,
  },
  loginButton: {
    backgroundColor: "#22A67A",
    borderRadius: 10,
    paddingVertical: 16,
    alignItems: "center",
    marginTop: 24,
  },
  loginButtonDisabled: {
    opacity: 0.7,
  },
  loginButtonText: {
    color: "#fff",
    fontSize: 16,
    fontWeight: "700",
  },
  signupRow: {
    flexDirection: "row",
    justifyContent: "center",
    marginTop: 16,
  },
  signupText: {
    color: "#6b7280",
    fontSize: 13,
  },
  signupLink: {
    color: "#22A67A",
    fontSize: 13,
    fontWeight: "700",
  },
});