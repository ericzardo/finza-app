import { NextResponse } from "next/server";

type ResponseOptions = {
  status?: number;
  message?: string;
};

export function handleResponse<T>(data: T, options?: ResponseOptions) {
  const status = options?.status || 200;

  return NextResponse.json(
    {
      success: true,
      message: options?.message || undefined,
      data: data,
    },
    { status }
  );
}