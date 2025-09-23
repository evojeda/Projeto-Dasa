const $ = (s, r=document) => r.querySelector(s);
const isEmail = (v) => /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(v);
const showMsg = (el, msg, type="error") => {
  if(!el) return;
  el.textContent = msg;
  el.className = type;
  el.style.display = msg ? "block" : "none";
};

const DEMO_USERS = {
  colaborador: [{ email: "colab@dasa.com", pass: "123" }],
  gestor: [{ email: "gestor@dasa.com", pass: "123" }],
};

document.addEventListener("DOMContentLoaded", () => {
  const form = $("#loginform");
  const emailEl = $("#userId");
  const passEl = $("#password");
  const roleEl = $("#role");
  const errorBox = $("#errorBox");
  const successBox = $("#successBox");

  const toggle = $("#togglePassword");
  if (toggle && passEl) {
    toggle.addEventListener("click", (e) => {
      e.preventDefault();
      const isHidden = passEl.type === "password";
      passEl.type = isHidden ? "text" : "password";
      toggle.src = isHidden
        ? "./assets/img/closeeyes-password.png"
        : "./assets/img/vieweyes-password.png";
      toggle.alt = isHidden ? "Ocultar senha" : "Mostrar senha";
    });
  }

  if (!form) return;

  form.addEventListener("submit", (e) => {
    e.preventDefault();
    showMsg(errorBox, "");
    showMsg(successBox, "");

    const email = (emailEl.value || "").trim();
    const pass = (passEl.value || "").trim();
    const role = (roleEl.value || "").trim(); 

    if (!email || !pass || !role) {
      showMsg(errorBox, "Preencha usuário, senha e selecione o perfil.");
      return;
    }
    if (!isEmail(email)) {
      showMsg(errorBox, "Informe um e-mail válido.");
      return;
    }

    const ok = (DEMO_USERS[role] || []).some(u => u.email === email && u.pass === pass);
    if (!ok) {
      showMsg(errorBox, "Credenciais inválidas para o perfil selecionado.");
      return;
    }

    localStorage.setItem("dasaUser", JSON.stringify({ email, role }));

    showMsg(successBox, "Login realizado com sucesso!", "success");

    const dest = role === "colaborador"
      ? "./pages/colaborador.html"
      : "./pages/gestor.html";

    setTimeout(() => { window.location.href = dest; }, 300);
  });
});
