import React, { createContext, useContext, useEffect, useState } from "react";
import {
  onAuthStateChanged,
  signInWithPopup,
  signInWithEmailAndPassword,
  createUserWithEmailAndPassword,
  signOut,
} from "firebase/auth";
import { auth, googleProvider, db } from "../firebase";
import { doc, setDoc, getDoc, serverTimestamp } from "firebase/firestore";

const AuthContext = createContext();

export function AuthProvider({ children }) {
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);

  // 🧠 Hàm đồng bộ dữ liệu user với Firestore
  const syncUserData = async (firebaseUser) => {
    if (!firebaseUser) return;

    const userRef = doc(db, "users", firebaseUser.uid);
    const existingDoc = await getDoc(userRef);

    if (existingDoc.exists()) {
      // 🔁 Nếu user đã có trong Firestore → chỉ cập nhật lastLogin
      await setDoc(
        userRef,
        {
          lastLogin: serverTimestamp(),
        },
        { merge: true }
      );
    } else {
      // 🆕 Nếu user mới → tạo bản ghi mới
      await setDoc(userRef, {
        uid: firebaseUser.uid,
        email: firebaseUser.email,
        displayName: firebaseUser.displayName || "",
        photoURL: firebaseUser.photoURL || "",
        createdAt: serverTimestamp(),
        lastLogin: serverTimestamp(),
      });
    }
  };

  // Lắng nghe trạng thái đăng nhập
  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, async (currentUser) => {
      setUser(currentUser);
      if (currentUser) {
        await syncUserData(currentUser);
      }
      setLoading(false);
    });
    return () => unsubscribe();
  }, []);

  // ✅ Đăng nhập bằng Google
  const loginWithGoogle = async () => {
    const result = await signInWithPopup(auth, googleProvider);
    await syncUserData(result.user);
    setUser(result.user);
    return result.user;
  };

  // ✅ Đăng ký bằng email
  const signupWithEmail = async (email, password) => {
    const result = await createUserWithEmailAndPassword(auth, email, password);
    await syncUserData(result.user);
    setUser(result.user);
    return result.user;
  };

  // ✅ Đăng nhập bằng email
  const loginWithEmail = async (email, password) => {
    const result = await signInWithEmailAndPassword(auth, email, password);
    await syncUserData(result.user);
    setUser(result.user);
    return result.user;
  };

  // ✅ Đăng xuất
  const logout = async () => {
    await signOut(auth);
    setUser(null);
  };

  return (
    <AuthContext.Provider
      value={{
        user,
        loading,
        loginWithGoogle,
        loginWithEmail,
        signupWithEmail,
        logout,
      }}
    >
      {!loading && children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  return useContext(AuthContext);
}
