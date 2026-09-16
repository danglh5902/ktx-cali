import { zodResolver } from "@hookform/resolvers/zod";
import { useState } from "react";
import { useForm } from "react-hook-form";
import { useLocation, useNavigate } from "react-router-dom";
import { z } from "zod";
import { Alert } from "../../components/ui/alert";
import { Button } from "../../components/ui/button";
import { FormField, Input } from "../../components/ui/input";
import { getErrorMessage } from "../../lib/errors";
import { useAuth } from "./auth-context";

const loginSchema = z.object({
  email: z.string().email("Email không hợp lệ"),
  password: z.string().min(1, "Vui lòng nhập mật khẩu"),
});
type LoginForm = z.infer<typeof loginSchema>;

export function LoginPage() {
  const { login } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();
  const [serverError, setServerError] = useState<string | null>(null);

  const {
    register,
    handleSubmit,
    formState: { errors, isSubmitting },
  } = useForm<LoginForm>({ resolver: zodResolver(loginSchema) });

  const onSubmit = async (data: LoginForm) => {
    setServerError(null);
    try {
      await login(data.email, data.password);
      const redirectTo = (location.state as { from?: string } | null)?.from ?? "/";
      navigate(redirectTo, { replace: true });
    } catch (err) {
      setServerError(getErrorMessage(err));
    }
  };

  return (
    <div className="flex min-h-screen items-center justify-center bg-slate-100 px-4">
      <div className="w-full max-w-sm rounded-lg bg-white p-6 shadow-md">
        <h1 className="mb-1 text-lg font-semibold text-slate-900">KTX Cali</h1>
        <p className="mb-6 text-sm text-slate-500">Đăng nhập vào hệ thống quản trị</p>

        <form onSubmit={handleSubmit(onSubmit)} className="space-y-4" noValidate>
          {serverError && <Alert>{serverError}</Alert>}

          <FormField label="Email" required error={errors.email?.message}>
            <Input type="email" autoComplete="username" autoFocus {...register("email")} />
          </FormField>

          <FormField label="Mật khẩu" required error={errors.password?.message}>
            <Input type="password" autoComplete="current-password" {...register("password")} />
          </FormField>

          <Button type="submit" className="w-full" disabled={isSubmitting}>
            {isSubmitting ? "Đang đăng nhập..." : "Đăng nhập"}
          </Button>
        </form>
      </div>
    </div>
  );
}
