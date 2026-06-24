import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";

type PageProps = {
  searchParams?: Promise<{
    error?: string;
  }>;
};

function loginIdToEmail(loginId: string) {
  return `${loginId.trim().toLowerCase()}@paint-app.local`;
}

async function login(formData: FormData) {
  "use server";

  const loginId = String(formData.get("login_id") ?? "").trim();
  const password = String(formData.get("password") ?? "");

  if (!loginId || !password) {
    redirect("/login?error=1");
  }

  const supabase = await createClient();

  const { error } = await supabase.auth.signInWithPassword({
    email: loginIdToEmail(loginId),
    password,
  });

  if (error) {
    redirect("/login?error=1");
  }

  redirect("/");
}

export default async function LoginPage({ searchParams }: PageProps) {
  const params = searchParams ? await searchParams : {};
  const hasError = params?.error === "1";

  return (
    <main className="mx-auto max-w-md p-8">
      <h1 className="mb-6 text-2xl font-bold">ログイン</h1>

      {hasError && (
        <div className="mb-4 rounded border border-red-300 bg-red-50 p-3 text-sm font-bold text-red-700">
          ログインIDまたはパスワードが違います。
        </div>
      )}

      <form action={login} className="space-y-4">
        <div>
          <label className="mb-1 block text-sm font-medium">ログインID</label>
          <input
            name="login_id"
            type="text"
            required
            autoComplete="username"
            className="w-full rounded border p-3"
          />
        </div>

        <div>
          <label className="mb-1 block text-sm font-medium">パスワード</label>
          <input
            name="password"
            type="password"
            required
            autoComplete="current-password"
            className="w-full rounded border p-3"
          />
        </div>

        <button
          type="submit"
          className="w-full rounded bg-black px-4 py-3 text-white"
        >
          ログイン
        </button>
      </form>
    </main>
  );
}