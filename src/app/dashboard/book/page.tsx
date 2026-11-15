import type { Metadata } from "next";
import { Suspense } from "react";
import { BookingWizard } from "@/components/booking/BookingWizard";

export const metadata: Metadata = { title: "Book an appointment" };

export default function BookPage() {
  return (
    <Suspense>
      <BookingWizard />
    </Suspense>
  );
}
