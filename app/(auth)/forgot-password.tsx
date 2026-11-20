import { useState } from "react";
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
import { router } from "expo-router";
import { ArrowLeft } from "lucide-react-native";
import { useForm, Controller } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { useMutation } from "@tanstack/react-query";
import { forgotPassword } from "../../services/api";

const forgotPasswordSchema = z.object({
  phoneNumber: z
    .string()
    .length(10, "Please enter a valid 10-digit phone number.")
    .refine((val) => ["70", "80", "81"].includes(val.substring(0, 2)), {
      message: "Phone number must start with 70, 80 or 81.",
    }),
});

type ForgotPasswordFormData = z.infer<typeof forgotPasswordSchema>;

export default function ForgotPasswordStep1() {
  const [formError, setFormError] = useState("");

  const {
    control,
    handleSubmit,
    formState: { errors },
  } = useForm<ForgotPasswordFormData>({
    resolver: zodResolver(forgotPasswordSchema),
    defaultValues: { phoneNumber: "" },
  });

  const forgotPasswordMutation = useMutation({
    mutationFn: forgotPassword,
    onSuccess: (_, variables) => {
      router.push({
        pathname: "/forgot-password-verify",
        params: { phone: variables.phone_number.replace("+234", "") },
      });
    },
    onError: (error: Error) => {
      console.log("Forgot password error", error);
      setFormError(error.message);
    },
  });

  const onSubmit = (data: ForgotPasswordFormData) => {
    Keyboard.dismiss();
    setFormError("");
    forgotPasswordMutation.mutate({ phone_number: `+234${data.phoneNumber}` });
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
        keyboardDismissMode="on-drag"
        showsVerticalScrollIndicator={false}
      >
        <Pressable style={styles.backButton} onPress={() => router.back()}>
          <ArrowLeft size={20} color="#111827" />
        </Pressable>

        <Text style={styles.stepLabel}>Reset Password  •  Step 1 of 3</Text>
        <Text style={styles.title}>Let&apos;s find your account</Text>
        <Text style={styles.subtitle}>
          Confirm the phone number on your account. We&apos;ll text you a code to
          reset your password.
        </Text>

        {!!formError && <Text style={styles.formError}>{formError}</Text>}

        <Text style={styles.label}>Phone number</Text>
        <Controller
          control={control}
          name="phoneNumber"
          render={({ field: { onChange, onBlur, value } }) => (
            <View
              style={[styles.inputRow, errors.phoneNumber && styles.inputRowError]}
            >
              <Text style={styles.prefix}>+234</Text>
              <TextInput
                style={styles.input}
                value={value}
                onBlur={onBlur}
                onChangeText={(text) => {
                  onChange(text.replace(/[^0-9]/g, ""));
                  if (formError) setFormError("");
                }}
                placeholder="234 345 4567"
                placeholderTextColor="#9ca3af"
                keyboardType="phone-pad"
                maxLength={10}
                editable={!forgotPasswordMutation.isPending}
                returnKeyType="done"
                onSubmitEditing={handleSubmit(onSubmit)}
              />
            </View>
          )}
        />
        {!!errors.phoneNumber && (
          <Text style={styles.errorText}>{errors.phoneNumber.message}</Text>
        )}
      </ScrollView>

      <Pressable
        style={[
          styles.button,
          forgotPasswordMutation.isPending && styles.buttonDisabled,
        ]}
        onPress={handleSubmit(onSubmit)}
        disabled={forgotPasswordMutation.isPending}
      >
        {forgotPasswordMutation.isPending ? (
          <ActivityIndicator color="#fff" />
        ) : (
          <Text style={styles.buttonText}>Send code</Text>
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
    lineHeight: 20,
    marginBottom: 28,
  },
  formError: {
    color: "#DC2626",
    fontSize: 13,
    marginBottom: 16,
  },
  label: {
    fontSize: 13,
    color: "#374151",
    marginBottom: 6,
  },
  inputRow: {
    flexDirection: "row",
    alignItems: "center",
    borderWidth: 1,
    borderColor: "#E5E7EB",
    borderRadius: 10,
    paddingHorizontal: 14,
  },
  inputRowError: {
    borderColor: "#DC2626",
  },
  prefix: {
    fontSize: 15,
    color: "#111827",
    fontWeight: "600",
    marginRight: 10,
  },
  input: {
    flex: 1,
    paddingVertical: 14,
    fontSize: 15,
    color: "#111827",
  },
  errorText: {
    color: "#DC2626",
    fontSize: 12,
    marginTop: 6,
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