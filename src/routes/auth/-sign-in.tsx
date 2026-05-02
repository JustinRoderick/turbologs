import { LoginForm } from "@/components/login-form";

export function SignInScreen() {
  return (
    <div className="min-h-svh flex flex-col items-center justify-center bg-gray-50 px-4 py-12 dark:bg-gray-950">
      <div className="w-full max-w-sm rounded-xl border border-gray-200 bg-white p-8 shadow-sm dark:border-gray-800 dark:bg-gray-900">
        <LoginForm callbackURL="/" />
      </div>
    </div>
  );
}
