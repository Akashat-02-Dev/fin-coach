import React, { createContext, useContext } from "react";
import { 
  useAuthMe, 
  useLoginUser, 
  useSignupUser, 
  useLogoutUser, 
  useUpdateUserProfile,
  getAuthMeQueryKey,
  User,
  LoginInput,
  SignupInput,
  UserProfileInput
} from "@workspace/api-client-react";
import { useQueryClient, UseMutationResult } from "@tanstack/react-query";
import { useToast } from "@/hooks/use-toast";

interface AuthContextType {
  user: User | null;
  isLoading: boolean;
  loginMutation: UseMutationResult<User, any, { data: LoginInput }>;
  signupMutation: UseMutationResult<User, any, { data: SignupInput }>;
  logoutMutation: UseMutationResult<{ success: boolean }, any, void>;
  updateProfileMutation: UseMutationResult<User, any, { data: UserProfileInput }>;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const queryClient = useQueryClient();
  const { toast } = useToast();

  const { data: user, isLoading } = useAuthMe({
    query: {
      queryKey: getAuthMeQueryKey(),
      retry: false,
      staleTime: Infinity,
    }
  });

  const loginMutation = useLoginUser({
    mutation: {
      onSuccess: (data) => {
        queryClient.setQueryData(getAuthMeQueryKey(), data);
        toast({
          title: "Welcome back!",
          description: `Logged in as ${data.firstName}.`,
        });
      },
    }
  });

  const signupMutation = useSignupUser({
    mutation: {
      onSuccess: (data) => {
        queryClient.setQueryData(getAuthMeQueryKey(), data);
        toast({
          title: "Account created!",
          description: `Welcome to FinCoach, ${data.firstName}!`,
        });
      },
    }
  });

  const logoutMutation = useLogoutUser({
    mutation: {
      onSuccess: () => {
        queryClient.setQueryData(getAuthMeQueryKey(), null);
        queryClient.clear(); // Clear cache to prevent data leak between log-ins
        toast({
          title: "Logged out",
          description: "You have been logged out of your session.",
        });
      },
    }
  });

  const updateProfileMutation = useUpdateUserProfile({
    mutation: {
      onSuccess: (data) => {
        queryClient.setQueryData(getAuthMeQueryKey(), data);
        toast({
          title: "Profile updated",
          description: "Your settings have been saved successfully.",
        });
      },
    }
  });

  return (
    <AuthContext.Provider
      value={{
        user: user ?? null,
        isLoading,
        loginMutation,
        signupMutation,
        logoutMutation,
        updateProfileMutation,
      }}
    >
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error("useAuth must be used within an AuthProvider");
  }
  return context;
}
