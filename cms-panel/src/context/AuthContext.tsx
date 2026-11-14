// src/context/AuthContext.tsx
import React, { createContext, useContext, useEffect, useState } from "react";
import { pb } from "../pocketbaseClient";

interface AuthUser {
	email: string;
}

interface AuthContextValue {
	user: AuthUser | null;
	signIn: (email: string, password: string) => Promise<void>;
	signOut: () => Promise<void>;
}

const AuthContext = createContext<AuthContextValue | undefined>(undefined);

export const useAuth = (): AuthContextValue => {
	const ctx = useContext(AuthContext);
	if (!ctx) throw new Error("useAuth must be used within AuthProvider");
	return ctx;
};

export const AuthProvider: React.FC<{ children: React.ReactNode }> = ({
	children,
}) => {
	const [user, setUser] = useState<AuthUser | null>(null);

	// Wczytaj sesję superusera z authStore (jeśli jest)
	useEffect(() => {
		if (pb.authStore.isValid && pb.authStore.model) {
			const model = pb.authStore.model as any;
			setUser({ email: model.email });
		} else {
			setUser(null);
		}
	}, []);

	const signIn = async (email: string, password: string) => {
		// 🔥 SUPERUSER LOGIN
		await pb.collection("_superusers").authWithPassword(email, password);

		const model = pb.authStore.model as any;
		if (!model) {
			throw new Error("Brak danych admina po zalogowaniu.");
		}

		// zapisujemy email superusera
		setUser({ email: model.email });
	};

	const signOut = async () => {
		pb.authStore.clear();
		setUser(null);
	};

	return (
		<AuthContext.Provider value={{ user, signIn, signOut }}>
			{children}
		</AuthContext.Provider>
	);
};
