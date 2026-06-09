import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";

async function login(formData: FormData) {
  "use server";

  const email = formData.get("email") as string;
  const password = formData.get("password") as string;

  const supabase = await createClient();

  const { error } = await supabase.auth.signInWithPassword({
    email,
    password,
  });

  if (error) {
    throw new Error(error.message);
  }

  redirect("/");
}

export default function LoginPage() {
  return (
    <main className="mx-auto max-w-md p-8">
      <h1 className="mb-6 text-2xl font-bold">ログイン</h1>

      <form action={login} className="space-y-4">
        <div>
          <label className="mb-1 block text-sm font-medium">
            メールアドレス
          </label>
          <input
            name="email"
            type="email"
            required
            className="w-full rounded border p-3"
          />
        </div>

        <div>
          <label className="mb-1 block text-sm font-medium">
            パスワード
          </label>
          <input
            name="password"
            type="password"
            required
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