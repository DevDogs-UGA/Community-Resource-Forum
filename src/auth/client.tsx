"use client";

import {
  createContext,
  useContext,
  useRef,
  type PropsWithChildren,
} from "react";
import { __signInAction, __signOutAction } from "./actions";

interface AuthHandlers {
  signIn: () => void;
  signOut: () => void;
}

const context = createContext<AuthHandlers | null>(null);

export function AuthProvider({ children }: PropsWithChildren) {
  const signInForm = useRef<HTMLFormElement>(null);
  const signOutForm = useRef<HTMLFormElement>(null);

  return (
    <context.Provider
      value={{
        signIn: () => signInForm.current?.requestSubmit(),
        signOut: () => signOutForm.current?.requestSubmit(),
      }}
    >
      <form action={__signInAction} className="hidden" ref={signInForm} />
      <form action={__signOutAction} className="hidden" ref={signOutForm} />
      {children}
    </context.Provider>
  );
}

export function useAuth() {
  const handlers = useContext(context);

  if (handlers === null) {
    throw new Error(
      "`useAuth()` must be called from a component which is a descendant of <AuthProvider />",
    );
  }

  return handlers;
}
