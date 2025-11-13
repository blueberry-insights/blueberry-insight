import RegisterForm from "./RegisterForm";

type RegisterPageProps = {
  searchParams?: Promise<{ error?: string }>;
};

export default async function RegisterPage({ searchParams }: RegisterPageProps) {
  const sp = (await searchParams) ?? {};
  const serverError = sp.error ? decodeURIComponent(sp.error) : null;

  return <RegisterForm serverError={serverError} />;
}
