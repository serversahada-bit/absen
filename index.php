<?php
require 'config/database.php';
require 'auth.php';

set_session_params();
session_start();

// Auto-login kalau session hilang
try_auto_login($conn);

// A. CEK APAKAH SUDAH LOGIN?
if (isset($_SESSION['user_id'])) {
    header("Location: dashboard");
    exit();
}

$err = "";

/**
 * Identitas login:
 * - jika input mengandung '@' => dianggap email, dan kita batasi hanya gmail/googlemail
 * - jika tidak => dianggap username (kolom: nama_user)
 */
function is_gmail(string $email): bool
{
    if (!filter_var($email, FILTER_VALIDATE_EMAIL)) return false;
    $domain = strtolower(substr(strrchr($email, "@"), 1));
    return in_array($domain, ['gmail.com', 'googlemail.com'], true);
}

function verify_password_migration(string $input, string $stored): bool
{
    // Jika stored adalah hash modern (bcrypt/argon), pakai password_verify
    if (str_starts_with($stored, '$2y$') || str_starts_with($stored, '$2a$') || str_starts_with($stored, '$argon2')) {
        return password_verify($input, $stored);
    }
    // fallback: password lama masih polos
    return hash_equals($stored, $input);
}

// B. PROSES LOGIN
if (isset($_POST['login'])) {
    $identifier = trim($_POST['identifier'] ?? '');
    $password_input = (string)($_POST['password'] ?? '');
    $remember = isset($_POST['remember']);

    if ($identifier === '' || $password_input === '') {
        $err = "Identitas dan password wajib diisi.";
    } else {
        $isEmail = str_contains($identifier, '@');

        if ($isEmail) {
            // Opsi 1: Login pakai Gmail (dibatasi)
            if (!is_gmail($identifier)) {
                $err = "Silakan gunakan email Gmail (contoh: nama@gmail.com).";
            } else {
                $stmt = $conn->prepare("
                    SELECT id, id_karyawan, nama, nama_user, jabatan, organisasi, foto, password, status_karyawan, email
                    FROM karyawan
                    WHERE email = ?
                    LIMIT 1
                ");
                $stmt->bind_param("s", $identifier);
                $stmt->execute();
                $result = $stmt->get_result();
            }
        } else {
            // Opsi 2: Login pakai username (kolom: nama_user)
            $stmt = $conn->prepare("
                SELECT id, id_karyawan, nama, nama_user, jabatan, organisasi, foto, password, status_karyawan, email
                FROM karyawan
                WHERE nama_user = ?
                LIMIT 1
            ");
            $stmt->bind_param("s", $identifier);
            $stmt->execute();
            $result = $stmt->get_result();
        }

        if (empty($err)) {
            if ($result->num_rows === 1) {
                $row = $result->fetch_assoc();

                // 1) cek password (hash modern / fallback polos)
                $valid = verify_password_migration($password_input, (string)$row['password']);

                if ($valid) {
                    // 2) cek status aktif
                    if (($row['status_karyawan'] ?? '') === 'Non-Aktif') {
                        $err = "Akun Anda telah dinonaktifkan. Silakan hubungi HRD.";
                    } else {
                        session_regenerate_id(true);

                        $_SESSION['user_id']     = (int)$row['id'];
                        $_SESSION['id_karyawan'] = $row['id_karyawan'] ?? '';
                        $_SESSION['nama']        = $row['nama'] ?? '';
                        $_SESSION['nama_user']   = $row['nama_user'] ?? '';
                        $_SESSION['role']        = $row['jabatan'] ?? '';
                        $_SESSION['perusahaan']  = $row['organisasi'] ?? '';
                        $_SESSION['foto']        = $row['foto'] ?? '';
                        $_SESSION['email']       = $row['email'] ?? '';

                        // 3) remember me (30 hari)
                        if ($remember) {
                            remember_me($conn, (int)$row['id'], 30);
                        } else {
                            // kalau tidak dicentang, bersihkan cookie lama
                            if (!empty($_COOKIE[remember_cookie_name()] ?? '')) {
                                clear_remember_cookie();
                            }
                        }

                        header("Location: dashboard");
                        exit();
                    }
                } else {
                    $err = "Password salah. Silakan coba lagi.";
                }
            } else {
                $err = "Akun tidak ditemukan di sistem.";
            }

            if (isset($stmt) && $stmt instanceof mysqli_stmt) {
                $stmt->close();
            }
        }
    }
}
?>

<!DOCTYPE html>
<html lang="id">
<head>
  <meta charset="UTF-8" />
  <meta name="viewport" content="width=device-width, initial-scale=1.0, maximum-scale=1.0, user-scalable=no" />
  <title>Login Karyawan</title>

  <!-- Font -->
  <link rel="preconnect" href="https://fonts.googleapis.com" />
  <link rel="preconnect" href="https://fonts.gstatic.com" crossorigin />
  <link href="https://fonts.googleapis.com/css2?family=Poppins:wght@400;500;600;700&display=swap" rel="stylesheet" />

  <!-- Tailwind CDN -->
  <script src="https://cdn.tailwindcss.com"></script>

  <script>
    tailwind.config = {
      theme: {
        extend: {
          fontFamily: { poppins: ["Poppins", "sans-serif"] },
        },
      },
    };
  </script>

  <link rel="icon" href="logo.webp" />
</head>

<body class="min-h-screen w-full bg-gray-100 font-poppins md:flex md:flex-row">

  <!-- LEFT: HEADER IMAGE (WEBP) -->
  <section class="relative h-[45vh] w-full flex-shrink-0 overflow-hidden bg-gray-900 md:h-screen md:w-3/5">

    <!-- Background image using <picture> for webp + fallback -->
    <picture class="absolute inset-0 z-0 h-full w-full">
      <source srcset="assets/pak_ceo.webp" type="image/webp">
      <!-- fallback kalau webp tidak didukung (opsional): ganti ke jpg/png kamu -->
      <img src="assets/pak_ceo.webp" alt="" class="h-full w-full object-cover object-top" />
    </picture>

    <!-- Overlay -->
    <div class="absolute inset-0 z-[1] bg-gradient-to-b from-black/20 to-black/60" aria-hidden="true"></div>
  </section>

  <!-- RIGHT: FORM -->
  <main
    class="relative z-10 w-full flex-1 -mt-6 rounded-t-2xl bg-white px-5 py-7
           md:mt-0 md:h-screen md:w-2/5 md:rounded-none md:px-10 md:py-0
           md:shadow-[-10px_0_30px_rgba(0,0,0,0.10)] md:flex md:items-center"
  >
    <div class="w-full max-w-sm mx-auto">

      <h1 class="text-center text-2xl font-bold text-gray-900 md:text-left md:text-3xl">
        Welcome Back
      </h1>
      <p class="mt-2 mb-6 text-center text-sm text-gray-400 md:text-left">
        Masuk untuk mengakses Absensi, Slip Gaji, dan Pengajuan Izin.
      </p>

      <?php if($err): ?>
        <div class="mb-5 rounded-xl border border-red-100 bg-red-50 px-4 py-3 text-sm text-red-600">
          <div class="flex items-start gap-2">
            <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" stroke="currentColor" stroke-width="2" class="mt-0.5 h-5 w-5">
              <path stroke-linecap="round" stroke-linejoin="round" d="M12 9v3.75m0 3.75h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
            </svg>
            <div class="font-medium"><?= htmlspecialchars($err) ?></div>
          </div>
        </div>
      <?php endif; ?>

      <form method="POST" class="space-y-4">

        <div class="rounded-xl border border-gray-200 bg-white px-4 py-2.5
                    transition focus-within:border-indigo-500 focus-within:ring-4 focus-within:ring-indigo-500/10">
          <label for="identifier" class="mb-1 block text-[11px] font-medium text-gray-500">
            Gmail / Username
          </label>
          <input
            type="text"
            id="identifier"
            name="identifier"
            placeholder="nama@gmail.com atau username"
            autocomplete="username"
            required
            class="w-full border-0 bg-transparent p-0 text-[15px] font-medium text-gray-800
                   outline-none placeholder:text-gray-300"
          />
        </div>

        <div class="rounded-xl border border-gray-200 bg-white px-4 py-2.5
                    transition focus-within:border-indigo-500 focus-within:ring-4 focus-within:ring-indigo-500/10">
          <label for="password" class="mb-1 block text-[11px] font-medium text-gray-500">
            Password
          </label>

          <div class="flex items-center gap-2">
            <input
              type="password"
              id="password"
              name="password"
              placeholder="••••••••"
              autocomplete="current-password"
              required
              class="w-full border-0 bg-transparent p-0 text-[15px] font-medium text-gray-800
                     outline-none placeholder:text-gray-300"
            />

            <button
              type="button"
              id="togglePassword"
              class="p-1 text-gray-400 transition hover:text-indigo-500"
              aria-label="Toggle password visibility"
            >
              <svg id="eyeOpen" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" stroke="currentColor" stroke-width="2" class="h-5 w-5">
                <path stroke-linecap="round" stroke-linejoin="round" d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
                <path stroke-linecap="round" stroke-linejoin="round" d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z" />
              </svg>

              <svg id="eyeClosed" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" stroke="currentColor" stroke-width="2" class="hidden h-5 w-5">
                <path stroke-linecap="round" stroke-linejoin="round" d="M3 3l18 18" />
                <path stroke-linecap="round" stroke-linejoin="round" d="M10.477 10.49a3 3 0 004.04 4.03" />
                <path stroke-linecap="round" stroke-linejoin="round" d="M9.88 5.09A9.953 9.953 0 0112 5c4.478 0 8.268 2.943 9.542 7a9.97 9.97 0 01-4.132 5.411" />
                <path stroke-linecap="round" stroke-linejoin="round" d="M6.228 6.228A9.97 9.97 0 002.458 12C3.732 16.057 7.523 19 12 19c.705 0 1.392-.073 2.055-.212" />
              </svg>
            </button>
          </div>
        </div>

        <label class="flex items-center gap-2 text-sm text-gray-600 select-none">
          <input type="checkbox" name="remember"
                 class="h-4 w-4 rounded border-gray-300 text-indigo-600 focus:ring-indigo-500/20"
                 checked>
          Ingat saya (30 hari)
        </label>

        <button
          type="submit"
          name="login"
          class="w-full rounded-xl bg-gradient-to-r from-[#584CF4] to-[#9F62F8]
                 px-4 py-3 text-[15px] font-semibold text-white
                 shadow-[0_4px_14px_rgba(88,76,244,0.28)] transition
                 active:translate-y-[1px] hover:-translate-y-[1px] hover:shadow-[0_6px_18px_rgba(88,76,244,0.35)]"
        >
          Masuk Dashboard
        </button>
      </form>

      <footer class="mt-8 text-center text-xs text-gray-300 md:text-left">
        &copy; 2026 Great HRD System
      </footer>
    </div>
  </main>

  <script>
    const btn = document.getElementById("togglePassword");
    const input = document.getElementById("password");
    const eyeOpen = document.getElementById("eyeOpen");
    const eyeClosed = document.getElementById("eyeClosed");

    btn.addEventListener("click", () => {
      const isPassword = input.type === "password";
      input.type = isPassword ? "text" : "password";
      eyeOpen.classList.toggle("hidden", isPassword);
      eyeClosed.classList.toggle("hidden", !isPassword);
    });
  </script>
</body>
</html>
