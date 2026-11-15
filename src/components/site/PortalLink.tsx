"use client";

import Link from "next/link";
import { homePathFor, useAuth } from "@/context/AuthContext";

/** Footer link to the patient / doctor / admin portal. */
export function PortalLink() {
  const { user } = useAuth();
  return (
    <Link href={user ? homePathFor(user.role) : "/login"} className="ml-2 underline decoration-line underline-offset-4 hover:text-espresso">
      {user ? "My dashboard" : "Patient portal"}
    </Link>
  );
}
