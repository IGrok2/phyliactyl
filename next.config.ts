import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  // Явно указываем корень проекта, чтобы Turbopack не путал его с
  // вышестоящим package-lock.json в домашней директории пользователя.
  turbopack: {
    root: __dirname,
  },

  // Хосты, с которых разрешён доступ к dev-серверу, кроме localhost.
  // ВАЖНО: CIDR (например 192.168.0.0/16) НЕ поддерживается — Next.js
  // сравнивает хост по сегментам через точку, поэтому для IP используем
  // wildcard-шаблоны вида "192.168.*.*". Добавьте сюда свой адрес/домен,
  // если открываете панель не с localhost (LAN-IP, ngrok, cloudflared).
  allowedDevOrigins: [
    "127.0.0.1",
    // Ваш текущий хост в локальной сети:
    "192.168.1.117",
    // Локальная сеть (частные диапазоны) через точечные wildcard:
    "192.168.*.*",
    "10.*.*.*",
    "172.*.*.*",
    // Примеры своего домена/туннеля — замените на ваш:
    // "panel.local",
    // "*.ngrok-free.app",
    // "*.trycloudflare.com",
  ],
};

export default nextConfig;
