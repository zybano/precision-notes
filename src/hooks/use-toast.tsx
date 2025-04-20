
import * as React from "react";
import { useEffect, useState } from "react";
import { Cross2Icon } from "@radix-ui/react-icons";

import { cn } from "@/lib/utils";
import {
  Toast,
  ToastClose,
  ToastDescription,
  ToastProvider,
  ToastTitle,
  ToastViewport,
} from "@/components/ui/toast";

const TOAST_LIMIT = 5;
const TOAST_REMOVE_DELAY = 1000000;

type ToasterToast = {
  id: string;
  title?: string;
  description?: string;
  action?: React.ReactNode;
  variant?: "default" | "destructive" | "success" | "warning" | "info";
};

let count = 0;

function genId() {
  count = (count + 1) % Number.MAX_SAFE_INTEGER;
  return count.toString();
}

type ActionType = "ADD_TOAST" | "UPDATE_TOAST" | "DISMISS_TOAST" | "REMOVE_TOAST";

let listeners: Array<(state: ToasterToast[]) => void> = [];

let memoryState: ToasterToast[] = [];

function dispatch(action: {
  type: ActionType;
  toast?: ToasterToast;
  toastId?: string;
}) {
  memoryState = reducer(memoryState, action);
  listeners.forEach((listener) => {
    listener(memoryState);
  });
}

interface Action {
  type: ActionType;
  toast?: ToasterToast;
  toastId?: string;
}

function reducer(state: ToasterToast[], action: Action): ToasterToast[] {
  switch (action.type) {
    case "ADD_TOAST":
      return [
        ...state,
        {
          id: genId(),
          ...(action.toast as ToasterToast),
        },
      ].slice(0, TOAST_LIMIT);

    case "UPDATE_TOAST":
      return state.map((t) =>
        t.id === action.toastId
          ? { ...t, ...action.toast }
          : t
      );

    case "DISMISS_TOAST": {
      return state.map((t) =>
        t.id === action.toastId || action.toastId === undefined
          ? {
              ...t,
            }
          : t
      );
    }

    case "REMOVE_TOAST":
      if (action.toastId === undefined) {
        return [];
      }
      return state.filter((t) => t.id !== action.toastId);

    default:
      return state;
  }
}

export function useToast() {
  const [state, setState] = useState<ToasterToast[]>(memoryState);

  useEffect(() => {
    listeners.push(setState);
    return () => {
      const index = listeners.indexOf(setState);
      if (index > -1) {
        listeners.splice(index, 1);
      }
    };
  }, [state]);

  return {
    toast: (props: ToasterToast) =>
      dispatch({
        type: "ADD_TOAST",
        toast: props,
      }),
    dismiss: (toastId?: string) => dispatch({ type: "DISMISS_TOAST", toastId }),
    remove: (toastId?: string) => dispatch({ type: "REMOVE_TOAST", toastId }),
  };
}

export function Toaster() {
  const [toasts, setToasts] = useState<ToasterToast[]>([]);

  useEffect(() => {
    const handleNewToast = (state: ToasterToast[]) => {
      setToasts(state);
    };

    listeners.push(handleNewToast);

    return () => {
      const index = listeners.indexOf(handleNewToast);
      if (index > -1) {
        listeners.splice(index, 1);
      }
    };
  }, []);

  return (
    <ToastProvider>
      {toasts.map(function ({ id, title, description, action, variant }) {
        return (
          <Toast key={id} variant={variant === "destructive" ? "destructive" : "default"}>
            <div className="grid gap-1">
              {title && <ToastTitle>{title}</ToastTitle>}
              {description && (
                <ToastDescription>{description}</ToastDescription>
              )}
            </div>
            {action}
            <ToastClose />
          </Toast>
        );
      })}
      <ToastViewport />
    </ToastProvider>
  );
}

// Also export as a simple function for convenience
export const toast = {
  custom: (props: ToasterToast) =>
    dispatch({
      type: "ADD_TOAST",
      toast: props,
    }),
  default: (props: { title?: string; description?: string; action?: React.ReactNode }) =>
    dispatch({
      type: "ADD_TOAST",
      toast: {
        ...props,
        variant: "default",
      },
    }),
  success: (props: { title?: string; description?: string; action?: React.ReactNode }) =>
    dispatch({
      type: "ADD_TOAST",
      toast: {
        ...props,
        variant: "success",
      },
    }),
  error: (props: { title?: string; description?: string; action?: React.ReactNode }) =>
    dispatch({
      type: "ADD_TOAST",
      toast: {
        ...props,
        variant: "destructive",
      },
    }),
  warning: (props: { title?: string; description?: string; action?: React.ReactNode }) =>
    dispatch({
      type: "ADD_TOAST",
      toast: {
        ...props,
        variant: "warning",
      },
    }),
  info: (props: { title?: string; description?: string; action?: React.ReactNode }) =>
    dispatch({
      type: "ADD_TOAST",
      toast: {
        ...props,
        variant: "info",
      },
    }),
  dismiss: (toastId?: string) => dispatch({ type: "DISMISS_TOAST", toastId }),
  remove: (toastId?: string) => dispatch({ type: "REMOVE_TOAST", toastId }),
};
