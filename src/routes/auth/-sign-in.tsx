import { usePostHog } from "@posthog/react";
//import { useAuth } from '@convex-dev/better-auth/react'

export default function SignInPage() {
  const posthog = usePostHog();

  // posthog.identify(userId, {
  //     email: email,
  //   })

  // posthog.capture('user_logged_in')
}
