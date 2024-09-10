import { useRef } from "react";

import { useUser } from "pages/interface";

export default function signup() {
  const { fetchUser } = useUser();

  const usernameRef = useRef("");
  const passwordRef = useRef("");

  async function signinOnSubmit(e) {
    e.preventDefault();

    const info = {
      username: usernameRef.current.value,
      password: passwordRef.current.value,
    };

    const res = await fetch("/api/v1/sessions", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        username: info.username,
        password: info.password,
      }),
    });

    if (res.status === 201) {
      fetchUser();
      return;
    }
  }

  return (
    <>
      <h1>Login</h1>
      <form onSubmit={signinOnSubmit}>
        <label htmlFor="username">Username</label>
        <input
          type="text"
          name="username"
          ref={usernameRef}
          autoComplete="off"
          autoCorrect="off"
        ></input>
        <label htmlFor="password">Senha</label>
        <input
          type="password"
          name="password"
          ref={passwordRef}
          autoComplete="off"
          autoCorrect="off"
        ></input>
        <button type="submit">Entrar</button>
      </form>
    </>
  );
}
