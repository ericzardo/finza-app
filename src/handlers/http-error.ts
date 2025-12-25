export async function handleHttpError(response: Response, defaultMessage: string) {
  try {
    const errorData = await response.json();
    return new Error(errorData.error || errorData.message || defaultMessage);
  } catch {
    return new Error(defaultMessage);
  }
}