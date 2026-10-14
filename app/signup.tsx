import { useRouter } from "expo-router";
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
import { initiateRegister } from "../services/api";

const loginSchema = z.object({
  phoneNumber: z
    .string()
    .length(10, "Please enter a valid 10-digit phone number.")
    .refine((val) => ["70", "80", "81"].includes(val.substring(0, 2)), {
      message: "Phone number must start with 70, 80 or 81.",
    }),
});

type LoginFormData = z.infer<typeof loginSchema>;

export default function Login() {
  const router = useRouter();

  const {
    control,
    handleSubmit,
    formState: { errors },
  } = useForm<LoginFormData>({
    resolver: zodResolver(loginSchema),
    defaultValues: { phoneNumber: "" },
  });

  const initiateRegisterMutation = useMutation({
    mutationFn: initiateRegister,
    onSuccess: (_, variables) => {
      router.push({
        pathname: "/otp",
        params: { phone: variables.phone_number.replace("+234", "") },
      });
    },
    onError: (error: Error) => {
      console.log("Initiate register error", error);
      alert(error.message);
    },
  });

  const onSubmit = (data: LoginFormData) => {
    Keyboard.dismiss();
    initiateRegisterMutation.mutate({
      phone_number: `+234${data.phoneNumber}`,
      role: "borrower",
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

        <Text style={styles.stepText}>
          Create Your Account
          <Text style={styles.dot}> • </Text>
          <Text style={styles.step}>Step 1 of 3</Text>
        </Text>

        <Text style={styles.title}>What's your number?</Text>
        <Text style={styles.subtitle}>
          We'll send you a code to verify it's really you.
        </Text>

        <Text style={styles.label}>Phone number</Text>

        <Controller
          control={control}
          name="phoneNumber"
          render={({ field: { onChange, onBlur, value } }) => (
            <View
              style={[
                styles.phoneInput,
                errors.phoneNumber && styles.phoneInputError,
              ]}
            >
              <Text style={styles.countryCode}>+234</Text>
              <TextInput
                style={styles.input}
                value={value}
                onBlur={onBlur}
                onChangeText={(text) => {
                  const numbersOnly = text.replace(/[^0-9]/g, "");
                  onChange(numbersOnly);
                }}
                placeholder="234 345 4567"
                placeholderTextColor="#777"
                keyboardType="phone-pad"
                maxLength={10}
                editable={!initiateRegisterMutation.isPending}
                returnKeyType="done"
                onSubmitEditing={handleSubmit(onSubmit)}
              />
            </View>
          )}
        />
        {!!errors.phoneNumber && (
          <Text style={styles.errorText}>{errors.phoneNumber.message}</Text>
        )}

        <Text style={styles.terms}>
          By continuing, you agree to AfriCredit's Terms of service and
          privacy policy
        </Text>
      </ScrollView>

      <TouchableOpacity
        style={[
          styles.button,
          initiateRegisterMutation.isPending && styles.buttonDisabled,
        ]}
        onPress={handleSubmit(onSubmit)}
        disabled={initiateRegisterMutation.isPending}
      >
        {initiateRegisterMutation.isPending ? (
          <ActivityIndicator color="#fff" />
        ) : (
          <Text style={styles.buttonText}>Send code</Text>
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
  stepText: { fontSize: 22, fontWeight: "600", color: "#28A982", marginBottom: 36 },
  dot: { color: "#28A982" },
  step: { color: "#62BFA3", fontWeight: "400" },
  title: { fontSize: 36, fontWeight: "700", color: "#111", marginBottom: 8 },
  subtitle: { fontSize: 21, color: "#777", marginBottom: 38 },
  label: { fontSize: 20, color: "#333", marginBottom: 12 },
  phoneInput: {
    flexDirection: "row",
    alignItems: "center",
    borderWidth: 1,
    borderColor: "#D8D8D8",
    borderRadius: 14,
    height: 70,
    paddingHorizontal: 20,
    backgroundColor: "#FFF",
  },
  phoneInputError: { borderColor: "#DC2626" },
  countryCode: { fontSize: 18, fontWeight: "600", color: "#111", marginRight: 15 },
  input: { flex: 1, fontSize: 18, color: "#111" },
  errorText: { color: "#DC2626", fontSize: 14, marginTop: 8 },
  terms: { fontSize: 17, lineHeight: 25, color: "#777", marginTop: 14 },
  button: {
    marginHorizontal: 36,
    marginBottom: 32,
    marginTop: 12,
    height: 56,
    borderRadius: 10,
    backgroundColor: "#28A982",
    justifyContent: "center",
    alignItems: "center",
  },
  buttonDisabled: { opacity: 0.7 },
  buttonText: { color: "#FFF", fontSize: 20, fontWeight: "700" },
});