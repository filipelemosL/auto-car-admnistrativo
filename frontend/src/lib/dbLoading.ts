import { useEffect, useState } from "react";

type DbLoadingListener = (activeOperations: number) => void;

let activeOperations = 0;
const listeners = new Set<DbLoadingListener>();

function notifyListeners() {
  listeners.forEach((listener) => listener(activeOperations));
}

export function beginDbOperation() {
  activeOperations += 1;
  notifyListeners();
}

export function endDbOperation() {
  activeOperations = Math.max(0, activeOperations - 1);
  notifyListeners();
}

export async function trackDbOperation<T>(operation: Promise<T>): Promise<T> {
  beginDbOperation();
  try {
    return await operation;
  } finally {
    endDbOperation();
  }
}

export function useDbLoading() {
  const [pendingOperations, setPendingOperations] = useState(activeOperations);

  useEffect(() => {
    listeners.add(setPendingOperations);
    setPendingOperations(activeOperations);
    return () => {
      listeners.delete(setPendingOperations);
    };
  }, []);

  return pendingOperations;
}
