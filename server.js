const express = require('express');
const axios = require('axios');

// ==========================================
// 🛠️ CONFIG: WAJIB LU ISI BAGIAN SINI BRO!
// ==========================================
const CLIENT_ID = 'CLIENT_ID_KAMU'; 
const CLIENT_SECRET = 'CLIENT_SECRET_KAMU'; 

// 👇 UDAH GW GANTI JADI DOMAIN LU
const REDIRECT_URI = 'DOMAIN_WEBSITE';

const GUILD_ID = 'GUILD_ID_KALIAN';
const VERIFIED_ROLE_ID = 'ROLE_ID';
const UNVERIFIED_ROLE_ID = 'ROLE_ID';
const BOT_TOKEN = 'TOKEN_BOT'; 

// 🛡️ CONFIG CAPTCHA
const RECAPTCHA_SITE_KEY = 'CAPTCHA';
const RECAPTCHA_SECRET_KEY = 'CAPTCHA';

// ==========================================
// 🎨 TEMPLATE HTML (HALAMAN UTAMA / LANDING PAGE)
// ==========================================
const generateLandingPageHTML = () => `
<!DOCTYPE html>
<html lang="id">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>Server Ngobrol - Portal Utama</title>
    <link href="https://fonts.googleapis.com/css2?family=Poppins:wght@400;500;600;700;800&display=swap" rel="stylesheet">
    <style>
        * { margin: 0; padding: 0; box-sizing: border-box; font-family: 'Poppins', sans-serif; }
        body {
            background: #0f0c29;
            background: linear-gradient(135deg, #0f0c29, #302b63, #24243e);
            background-size: 400% 400%;
            animation: gradientBG 15s ease infinite;
            color: white;
            min-height: 100vh;
            display: flex;
            flex-direction: column;
            align-items: center;
            overflow-x: hidden;
            position: relative;
        }
        @keyframes gradientBG {
            0% { background-position: 0% 50%; }
            50% { background-position: 100% 50%; }
            100% { background-position: 0% 50%; }
        }
        
        .bg-shapes { position: fixed; width: 100vw; height: 100vh; z-index: 0; overflow: hidden; top: 0; left: 0; pointer-events: none; }
        .shape { position: absolute; filter: blur(90px); opacity: 0.5; animation: floatShape 12s infinite alternate ease-in-out; border-radius: 50%; }
        .shape-1 { width: 400px; height: 400px; background: #5865F2; top: -10%; left: -10%; }
        .shape-2 { width: 500px; height: 500px; background: #ED4245; bottom: -20%; right: -10%; animation-delay: -5s; }
        .shape-3 { width: 300px; height: 300px; background: #57F287; top: 40%; left: 30%; animation-duration: 20s; }
        @keyframes floatShape {
            0% { transform: translate(0, 0) scale(1); }
            100% { transform: translate(50px, 50px) scale(1.1); }
        }

        .container {
            max-width: 1100px;
            width: 100%;
            padding: 60px 20px;
            z-index: 10;
            display: flex;
            flex-direction: column;
            align-items: center;
        }
        
        /* Hero Section & Server Logo */
        .hero {
            text-align: center;
            margin-bottom: 60px;
            animation: fadeInUp 1s ease forwards;
            opacity: 0;
            transform: translateY(30px);
            display: flex;
            flex-direction: column;
            align-items: center;
        }
        .server-logo-container {
            position: relative;
            margin-bottom: 25px;
        }
        .server-logo {
            width: 130px;
            height: 130px;
            border-radius: 50%;
            object-fit: cover;
            border: 4px solid #5865F2;
            box-shadow: 0 0 30px rgba(88, 101, 242, 0.6);
            animation: floatLogo 4s ease-in-out infinite;
            position: relative;
            z-index: 2;
        }
        .logo-glow {
            position: absolute;
            top: 50%; left: 50%;
            transform: translate(-50%, -50%);
            width: 150px; height: 150px;
            background: #5865F2;
            border-radius: 50%;
            filter: blur(25px);
            opacity: 0.6;
            z-index: 1;
            animation: pulseGlow 2s infinite alternate;
        }
        @keyframes floatLogo {
            0% { transform: translateY(0px); }
            50% { transform: translateY(-10px); }
            100% { transform: translateY(0px); }
        }
        @keyframes pulseGlow {
            0% { transform: translate(-50%, -50%) scale(0.9); opacity: 0.4; }
            100% { transform: translate(-50%, -50%) scale(1.1); opacity: 0.8; }
        }

        .hero-badge {
            background: rgba(88, 101, 242, 0.2);
            color: #5865F2;
            padding: 8px 20px;
            border-radius: 50px;
            font-size: 14px;
            font-weight: 600;
            display: flex;
            align-items: center;
            gap: 8px;
            margin-bottom: 20px;
            border: 1px solid rgba(88, 101, 242, 0.5);
            letter-spacing: 1px;
        }
        .hero h1 {
            font-size: clamp(2.5rem, 5vw, 4rem);
            font-weight: 800;
            line-height: 1.2;
            margin-bottom: 20px;
            background: -webkit-linear-gradient(45deg, #fff, #a5b4fc);
            -webkit-background-clip: text;
            -webkit-text-fill-color: transparent;
        }
        .hero p {
            font-size: clamp(1rem, 2vw, 1.15rem);
            color: #D1D5DB;
            max-width: 700px;
            margin: 0 auto;
            line-height: 1.7;
        }
        
        .section-title {
            font-size: clamp(1.6rem, 3vw, 2rem);
            font-weight: 700;
            margin-bottom: 40px;
            text-align: center;
            width: 100%;
        }
        
        /* Steps Grid Section */
        .steps-grid {
            display: grid;
            grid-template-columns: repeat(auto-fit, minmax(300px, 1fr));
            gap: 30px;
            width: 100%;
            animation: fadeInUp 1s ease forwards;
            animation-delay: 0.3s;
            opacity: 0;
            transform: translateY(30px);
        }
        .step-card {
            background: rgba(255, 255, 255, 0.05);
            backdrop-filter: blur(16px);
            -webkit-backdrop-filter: blur(16px);
            border: 1px solid rgba(255, 255, 255, 0.1);
            border-radius: 24px;
            padding: 40px 30px;
            text-align: center;
            transition: all 0.4s cubic-bezier(0.175, 0.885, 0.32, 1.275);
            position: relative;
            overflow: hidden;
        }
        .step-card::before {
            content: '';
            position: absolute;
            top: 0; left: 0; width: 100%; height: 4px;
            background: linear-gradient(90deg, #5865F2, #57F287);
            transform: scaleX(0);
            transition: transform 0.4s ease;
            transform-origin: left;
        }
        .step-card:hover {
            transform: translateY(-10px);
            box-shadow: 0 20px 40px rgba(0, 0, 0, 0.3);
            background: rgba(255, 255, 255, 0.08);
            border-color: rgba(255, 255, 255, 0.2);
        }
        .step-card:hover::before { transform: scaleX(1); }
        
        .step-icon-wrapper {
            position: relative;
            width: 64px;
            height: 64px;
            background: rgba(88, 101, 242, 0.15);
            border: 2px solid #5865F2;
            border-radius: 16px;
            display: flex;
            align-items: center;
            justify-content: center;
            margin: 0 auto 20px auto;
            color: #5865F2;
            box-shadow: 0 10px 20px rgba(88, 101, 242, 0.2);
            transform: rotate(-5deg);
            transition: all 0.3s ease;
        }
        .step-card:hover .step-icon-wrapper {
            transform: rotate(0deg) scale(1.1);
            background: #5865F2;
            color: white;
            box-shadow: 0 15px 25px rgba(88, 101, 242, 0.4);
        }
        .step-number-badge {
            position: absolute;
            top: -10px;
            right: -10px;
            background: #ED4245;
            color: white;
            width: 24px;
            height: 24px;
            border-radius: 50%;
            font-size: 12px;
            font-weight: 800;
            display: flex;
            align-items: center;
            justify-content: center;
            border: 2px solid #24243e;
        }

        .step-title {
            font-size: 1.3rem;
            font-weight: 700;
            margin-bottom: 15px;
            color: #fff;
        }
        .step-desc {
            font-size: 0.95rem;
            color: #9CA3AF;
            line-height: 1.6;
        }
        
        /* CTA Section */
        .cta-section {
            margin-top: 60px;
            text-align: center;
            animation: fadeInUp 1s ease forwards;
            animation-delay: 0.6s;
            opacity: 0;
            transform: translateY(30px);
        }
        .discord-btn {
            display: inline-flex;
            align-items: center;
            gap: 12px;
            background: #5865F2;
            color: white;
            text-decoration: none;
            padding: 16px 40px;
            border-radius: 14px;
            font-weight: 700;
            font-size: 1.1rem;
            transition: all 0.3s ease;
            border: none;
            box-shadow: 0 10px 25px rgba(88, 101, 242, 0.4);
        }
        .discord-btn:hover {
            background: #4752C4;
            transform: translateY(-3px) scale(1.05);
            box-shadow: 0 15px 35px rgba(88, 101, 242, 0.6);
        }

        @keyframes fadeInUp {
            to { opacity: 1; transform: translateY(0); }
        }
    </style>
</head>
<body>
    <div class="bg-shapes">
        <div class="shape shape-1"></div>
        <div class="shape shape-2"></div>
        <div class="shape shape-3"></div>
    </div>
    
    <div class="container">
        <!-- Hero Section -->
        <div class="hero">
            <!-- 👇 GANTI LINK "https://..." DI BAWAH INI DENGAN LINK GAMBAR LOGO SERVER LU -->
            <div class="server-logo-container">
                <div class="logo-glow"></div>
                <img src="https://cdn.discordapp.com/icons/1234449485929648189/91b342b814ce2ea21be0d18c645dbd7d.webp?size=1024" alt="Logo Server" class="server-logo">
            </div>

            <div class="hero-badge">
                <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M14 9V5a3 3 0 0 0-3-3l-4 9v11h11.28a2 2 0 0 0 2-1.7l1.38-9a2 2 0 0 0-2-2.3zM7 22H4a2 2 0 0 1-2-2v-7a2 2 0 0 1 2-2h3"></path></svg>
                SELAMAT DATANG
            </div>
            
            <h1>Server Ngobrol</h1>
            <p>Tempat nongkrong digital paling asik! Di sini lu bisa ngobrol santai, bahas hobi, mabar game bareng temen-temen baru, dan menikmati komunitas yang bebas toxic. Komunitas kita menjunjung tinggi kenyamanan dan keamanan membernya.</p>
        </div>

        <h2 class="section-title">Langkah Verifikasi</h2>
        <div class="steps-grid">
            <!-- Step 1 -->
            <div class="step-card">
                <div class="step-icon-wrapper">
                    <div class="step-number-badge">1</div>
                    <svg width="28" height="28" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M10 13a5 5 0 0 0 7.54.54l3-3a5 5 0 0 0-7.07-7.07l-1.72 1.71"></path><path d="M14 11a5 5 0 0 0-7.54-.54l-3 3a5 5 0 0 0 7.07 7.07l1.71-1.71"></path></svg>
                </div>
                <h3 class="step-title">Klik Link Verifikasi</h3>
                <p class="step-desc">Masuk ke channel verifikasi di server Discord kita, lalu klik tombol verifikasi yang disediakan oleh bot. Lu akan diarahkan ke halaman aman kami.</p>
            </div>
            <!-- Step 2 -->
            <div class="step-card">
                <div class="step-icon-wrapper">
                    <div class="step-number-badge">2</div>
                    <svg width="28" height="28" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z"></path></svg>
                </div>
                <h3 class="step-title">Selesaikan Captcha</h3>
                <p class="step-desc">Untuk mencegah serangan bot spammer, sistem kami akan meminta lu buat ngelewatin tantangan Google reCAPTCHA. Cukup centang kotak dan selesai.</p>
            </div>
            <!-- Step 3 -->
            <div class="step-card">
                <div class="step-icon-wrapper">
                    <div class="step-number-badge">3</div>
                    <svg width="28" height="28" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M22 11.08V12a10 10 0 1 1-5.93-9.14"></path><polyline points="22 4 12 14.01 9 11.01"></polyline></svg>
                </div>
                <h3 class="step-title">Dapatkan Role!</h3>
                <p class="step-desc">Boom! Akun lu langsung otomatis dapet role <strong>Verified</strong>. Semua channel di server bakal terbuka dan lu siap buat mulai ngobrol!</p>
            </div>
        </div>

        <div class="cta-section">
            <a href="https://discord.com/channels/${GUILD_ID}" class="discord-btn">
                <svg width="24" height="24" viewBox="0 0 24 24" fill="currentColor" xmlns="http://www.w3.org/2000/svg"><path d="M20.317 4.3698a19.7913 19.7913 0 00-4.8851-1.5152.0741.0741 0 00-.0785.0371c-.211.3753-.4447.8648-.6083 1.2495-1.8447-.2762-3.68-.2762-5.4868 0-.1636-.3933-.4058-.8742-.6177-1.2495a.077.077 0 00-.0785-.037 19.7363 19.7363 0 00-4.8852 1.515.0699.0699 0 00-.0321.0277C.5334 9.0458-.319 13.5799.0992 18.0578a.0824.0824 0 00.0312.0561c2.0528 1.5076 4.0413 2.4228 5.9929 3.0294a.0777.0777 0 00.0842-.0276c.4616-.6304.8731-1.2952 1.226-1.9942a.076.076 0 00-.0416-.1057c-.6528-.2476-1.2743-.5495-1.8722-.8923a.077.077 0 01-.0076-.1277c.1258-.0943.2517-.1923.3718-.2914a.0743.0743 0 01.0776-.0105c3.9278 1.7933 8.18 1.7933 12.0614 0a.0739.0739 0 01.0785.0095c.1202.099.246.1981.3728.2924a.077.077 0 01-.0066.1276 12.2986 12.2986 0 01-1.873.8914.0766.0766 0 00-.0407.1067c.3604.698.7719 1.3628 1.225 1.9932a.076.076 0 00.0842.0286c1.961-.6067 3.9495-1.5219 6.0023-3.0294a.077.077 0 00.0313-.0552c.5004-5.177-.8382-9.6739-3.5485-13.6604a.061.061 0 00-.0312-.0286zM8.02 15.3312c-1.1825 0-2.1569-1.0857-2.1569-2.419 0-1.3332.9555-2.4189 2.157-2.4189 1.2108 0 2.1757 1.0952 2.1568 2.419 0 1.3332-.9555 2.4189-2.1569 2.4189zm7.9748 0c-1.1825 0-2.1569-1.0857-2.1569-2.419 0-1.3332.9554-2.4189 2.1569-2.4189 1.2108 0 2.1757 1.0952 2.1568 2.419 0 1.3332-.946 2.4189-2.1568 2.4189Z"/></svg>
                Buka Discord Sekarang
            </a>
        </div>
    </div>
</body>
</html>
`;

// ==========================================
// 🎨 TEMPLATE HTML (VERIFIKASI TINGKAT DEWA)
// ==========================================
const generateVerifyHTML = (state, title, message, detail = '', extraData = {}) => `
<!DOCTYPE html>
<html lang="id">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0, maximum-scale=1.0, user-scalable=no">
    <title>${title} - Server Ngobrol</title>
    <link href="https://fonts.googleapis.com/css2?family=Poppins:wght@400;500;600;700;800&display=swap" rel="stylesheet">
    ${state === 'captcha' ? '<script src="https://www.google.com/recaptcha/api.js" async defer></script>' : ''}
    <style>
        * { margin: 0; padding: 0; box-sizing: border-box; font-family: 'Poppins', sans-serif; }
        body {
            background: #0f0c29;
            background: linear-gradient(135deg, #0f0c29, #302b63, #24243e);
            min-height: 100vh;
            display: flex;
            justify-content: center;
            align-items: center;
            color: white;
            overflow-x: hidden;
            padding: 15px;
        }
        
        /* Background Animated Shapes */
        .bg-shapes { position: fixed; width: 100vw; height: 100vh; z-index: 0; overflow: hidden; top:0; left:0; pointer-events: none;}
        .shape { position: absolute; filter: blur(70px); opacity: 0.5; animation: float 10s infinite alternate ease-in-out; border-radius: 50%;}
        .shape-1 { width: 300px; height: 300px; background: #5865F2; top: -5%; left: -5%; }
        .shape-2 { width: 350px; height: 350px; background: #ED4245; bottom: -10%; right: -5%; animation-delay: -3s; }
        .shape-3 { width: 250px; height: 250px; background: #57F287; top: 30%; left: 50%; animation-duration: 15s; }
        @keyframes float { 0% { transform: translate(0, 0); } 100% { transform: translate(30px, 30px); } }

        /* Main Card */
        .card {
            background: rgba(20, 20, 35, 0.6);
            backdrop-filter: blur(25px);
            -webkit-backdrop-filter: blur(25px);
            border: 1px solid rgba(255, 255, 255, 0.1);
            border-radius: 28px;
            padding: 40px 30px;
            text-align: center;
            width: 100%;
            max-width: 480px;
            box-shadow: 0 25px 50px rgba(0, 0, 0, 0.5), inset 0 0 0 1px rgba(255, 255, 255, 0.05);
            animation: popIn 0.6s cubic-bezier(0.175, 0.885, 0.32, 1.275) forwards;
            position: relative;
            z-index: 10;
        }
        @keyframes popIn { 0% { transform: scale(0.9); opacity: 0; } 100% { transform: scale(1); opacity: 1; } }

        /* Stepper UI */
        .stepper {
            display: flex;
            justify-content: space-between;
            align-items: center;
            margin-bottom: 35px;
            position: relative;
            padding: 0 10px;
        }
        .stepper::before {
            content: '';
            position: absolute;
            top: 50%; left: 30px; right: 30px;
            height: 3px;
            background: rgba(255,255,255,0.1);
            transform: translateY(-50%);
            z-index: 1;
        }
        .step {
            width: 36px; height: 36px;
            border-radius: 50%;
            background: rgba(255,255,255,0.1);
            color: #9CA3AF;
            display: flex; justify-content: center; align-items: center;
            font-weight: 700; font-size: 14px;
            position: relative; z-index: 2;
            border: 3px solid #1a1a2e;
            transition: all 0.3s ease;
        }
        .step.done { background: #57F287; color: #1a1a2e; border-color: #57F287; box-shadow: 0 0 15px rgba(87, 242, 135, 0.4); }
        .step.active { background: #5865F2; color: white; border-color: #5865F2; box-shadow: 0 0 15px rgba(88, 101, 242, 0.6); animation: pulse 2s infinite; }
        .step.error { background: #ED4245; color: white; border-color: #ED4245; box-shadow: 0 0 15px rgba(237, 66, 69, 0.6); }
        @keyframes pulse { 0% { box-shadow: 0 0 0 0 rgba(88, 101, 242, 0.7); } 70% { box-shadow: 0 0 0 10px rgba(88, 101, 242, 0); } 100% { box-shadow: 0 0 0 0 rgba(88, 101, 242, 0); } }

        .step-labels {
            display: flex; justify-content: space-between; margin-top: -25px; margin-bottom: 30px; padding: 0 5px;
        }
        .step-label { font-size: 11px; color: #9CA3AF; font-weight: 600; width: 60px; text-align: center; }
        .step-label.active { color: #fff; }

        /* Icon & Text */
        .icon-container { margin-bottom: 20px; }
        .icon { font-size: 65px; display: inline-block; filter: drop-shadow(0 10px 15px rgba(0,0,0,0.3)); }
        h1 { font-size: 1.6rem; font-weight: 800; margin-bottom: 12px; letter-spacing: -0.5px; }
        p { font-size: 0.95rem; font-weight: 400; color: #D1D5DB; margin-bottom: 15px; line-height: 1.6; }
        
        .detail-box {
            background: rgba(0,0,0,0.2);
            border-left: 4px solid #ED4245;
            padding: 12px 15px;
            border-radius: 8px;
            font-size: 0.85rem;
            color: #FCA5A5;
            text-align: left;
            margin-bottom: 25px;
        }

        /* Buttons & Forms */
        .btn {
            display: flex; justify-content: center; align-items: center; gap: 8px;
            background: #5865F2; color: white; text-decoration: none;
            padding: 16px 20px; border-radius: 14px; font-weight: 600; font-size: 1rem;
            transition: all 0.3s ease; border: none; cursor: pointer; width: 100%;
            box-shadow: 0 8px 20px rgba(88, 101, 242, 0.3);
        }
        .btn:hover { background: #4752C4; transform: translateY(-3px); box-shadow: 0 12px 25px rgba(88, 101, 242, 0.5); }
        .btn:active { transform: translateY(0); }
        
        .btn-discord { background: #4F545C; box-shadow: 0 8px 20px rgba(0, 0, 0, 0.3); }
        .btn-discord:hover { background: #3B3F45; box-shadow: 0 12px 25px rgba(0, 0, 0, 0.4); }

        .success-text { color: #57F287; }
        .error-text { color: #ED4245; }

        /* Captcha Wrapper for Mobile Compatibility */
        .captcha-wrapper {
            display: flex; justify-content: center; align-items: center;
            margin-bottom: 25px; width: 100%; overflow: hidden;
            background: rgba(0,0,0,0.1); border-radius: 12px; padding: 10px 0;
            border: 1px solid rgba(255,255,255,0.05);
        }
        .g-recaptcha { transform-origin: center; }

        /* Media Queries */
        @media (max-width: 400px) {
            .card { padding: 30px 20px; }
            h1 { font-size: 1.4rem; }
            p { font-size: 0.85rem; }
            .g-recaptcha { transform: scale(0.85); }
        }
        @media (max-width: 340px) {
            .g-recaptcha { transform: scale(0.75); }
            .step-labels { display: none; }
            .stepper { margin-bottom: 20px; }
        }
    </style>
</head>
<body>
    <div class="bg-shapes">
        <div class="shape shape-1"></div>
        <div class="shape shape-2"></div>
        <div class="shape shape-3"></div>
    </div>
    <div class="card">
        <!-- Stepper Dinamis -->
        <div class="stepper">
            <div class="step ${state === 'error' && extraData.step === 1 ? 'error' : 'done'}">✓</div>
            <div class="step ${state === 'captcha' ? 'active' : (state === 'success' || (state === 'error' && extraData.step > 2) ? 'done' : (state === 'error' && extraData.step === 2 ? 'error' : ''))}">2</div>
            <div class="step ${state === 'success' ? 'done' : (state === 'error' && extraData.step === 3 ? 'error' : '')}">3</div>
        </div>
        <div class="step-labels">
            <div class="step-label ${state === 'error' && extraData.step === 1 ? 'error-text' : 'active'}">Login</div>
            <div class="step-label ${state === 'captcha' ? 'active' : ''}">Verifikasi</div>
            <div class="step-label ${state === 'success' ? 'active' : ''}">Selesai</div>
        </div>

        <!-- Konten Berdasarkan State -->
        ${state === 'captcha' ? `
            <div class="icon-container"><div class="icon">🤖</div></div>
            <h1>Buktikan Lu Manusia!</h1>
            <p>${message}</p>
            <form action="/verify-process" method="POST">
                <input type="hidden" name="code" value="${extraData.code}">
                <div class="captcha-wrapper">
                    <div class="g-recaptcha" data-sitekey="${RECAPTCHA_SITE_KEY}" data-theme="dark"></div>
                </div>
                <button type="submit" class="btn">
                    <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M22 11.08V12a10 10 0 1 1-5.93-9.14"></path><polyline points="22 4 12 14.01 9 11.01"></polyline></svg>
                    Selesaikan Verifikasi
                </button>
            </form>
        ` : `
            <div class="icon-container"><div class="icon">${state === 'success' ? '🎉' : '❌'}</div></div>
            <h1 class="${state === 'success' ? 'success-text' : 'error-text'}">${title}</h1>
            <p>${message}</p>
            
            ${state === 'error' && detail ? `
                <div class="detail-box">
                    <strong>Detail Error:</strong><br>
                    ${detail}
                </div>
            ` : ''}

            <a href="https://discord.com/channels/${GUILD_ID}" class="btn ${state === 'error' ? 'btn-discord' : ''}">
                <svg width="20" height="20" viewBox="0 0 24 24" fill="currentColor" xmlns="http://www.w3.org/2000/svg"><path d="M20.317 4.3698a19.7913 19.7913 0 00-4.8851-1.5152.0741.0741 0 00-.0785.0371c-.211.3753-.4447.8648-.6083 1.2495-1.8447-.2762-3.68-.2762-5.4868 0-.1636-.3933-.4058-.8742-.6177-1.2495a.077.077 0 00-.0785-.037 19.7363 19.7363 0 00-4.8852 1.515.0699.0699 0 00-.0321.0277C.5334 9.0458-.319 13.5799.0992 18.0578a.0824.0824 0 00.0312.0561c2.0528 1.5076 4.0413 2.4228 5.9929 3.0294a.0777.0777 0 00.0842-.0276c.4616-.6304.8731-1.2952 1.226-1.9942a.076.076 0 00-.0416-.1057c-.6528-.2476-1.2743-.5495-1.8722-.8923a.077.077 0 01-.0076-.1277c.1258-.0943.2517-.1923.3718-.2914a.0743.0743 0 01.0776-.0105c3.9278 1.7933 8.18 1.7933 12.0614 0a.0739.0739 0 01.0785.0095c.1202.099.246.1981.3728.2924a.077.077 0 01-.0066.1276 12.2986 12.2986 0 01-1.873.8914.0766.0766 0 00-.0407.1067c.3604.698.7719 1.3628 1.225 1.9932a.076.076 0 00.0842.0286c1.961-.6067 3.9495-1.5219 6.0023-3.0294a.077.077 0 00.0313-.0552c.5004-5.177-.8382-9.6739-3.5485-13.6604a.061.061 0 00-.0312-.0286zM8.02 15.3312c-1.1825 0-2.1569-1.0857-2.1569-2.419 0-1.3332.9555-2.4189 2.157-2.4189 1.2108 0 2.1757 1.0952 2.1568 2.419 0 1.3332-.9555 2.4189-2.1569 2.4189zm7.9748 0c-1.1825 0-2.1569-1.0857-2.1569-2.419 0-1.3332.9554-2.4189 2.1569-2.4189 1.2108 0 2.1757 1.0952 2.1568 2.419 0 1.3332-.946 2.4189-2.1568 2.4189Z"/></svg>
                Kembali ke Discord
            </a>
        `}
    </div>
</body>
</html>
`;

// ==========================================
// 🚀 FUNGSI UTAMA BUAT JALANIN SERVER
// ==========================================
function startOAuthServer() {
    const app = express();
    app.use(express.urlencoded({ extended: true }));

    // Rute Landing Page
    app.get('/', (req, res) => {
        res.send(generateLandingPageHTML());
    });

    // Rute Callback Discord
    app.get('/callback', (req, res) => {
        const code = req.query.code;
        
        if (!code) {
            return res.send(generateVerifyHTML(
                'error', 
                'Akses Ditolak!', 
                'Proses otorisasi dibatalkan atau tidak valid.',
                'Sistem tidak menerima kode akses (code) dari Discord. Pastikan lu mengklik tombol "Authorize" saat diarahkan oleh bot. Silakan kembali ke Discord dan coba lagi.',
                { step: 1 }
            ));
        }

        // Tampilkan halaman Captcha
        res.send(generateVerifyHTML(
            'captcha',
            'Verifikasi Keamanan',
            'Tinggal satu langkah lagi! Selesaikan captcha di bawah ini buat mastiin lu bukan bot otomatis.',
            '',
            { code: code }
        ));
    });

    // Rute Proses Validasi Captcha & Pemberian Role
    app.post('/verify-process', async (req, res) => {
        const code = req.body.code;
        const captchaResponse = req.body['g-recaptcha-response'];

        if (!captchaResponse) {
            return res.send(generateVerifyHTML(
                'error',
                'Captcha Terlewat!',
                'Lu belum nyelesaiin tantangan Captcha bro.',
                'Kotak reCAPTCHA wajib dicentang. Silakan tekan tombol kembali (Back) di browser lu, centang kotak "I am not a robot", lalu klik tombol submit lagi.',
                { step: 2 }
            ));
        }

        try {
            // Verifikasi ke server Google
            const verifyCaptchaURL = `https://www.google.com/recaptcha/api/siteverify?secret=${RECAPTCHA_SECRET_KEY}&response=${captchaResponse}`;
            const googleVerify = await axios.post(verifyCaptchaURL);

            if (!googleVerify.data.success) {
                return res.send(generateVerifyHTML(
                    'error',
                    'Verifikasi Gagal!',
                    'Sistem Google mendeteksi aktivitas mencurigakan.',
                    'Skor keamanan Captcha tidak memenuhi standar (terdeteksi sebagai bot). Coba ganti jaringan internet/WiFi atau hapus cache browser, lalu ulangi dari Discord.',
                    { step: 2 }
                ));
            }

            // Tukar kode dengan Access Token Discord
            const tokenResponse = await axios.post('https://discord.com/api/oauth2/token', new URLSearchParams({
                client_id: CLIENT_ID,
                client_secret: CLIENT_SECRET,
                code: code,
                grant_type: 'authorization_code',
                redirect_uri: REDIRECT_URI,
            }), {
                headers: { 'Content-Type': 'application/x-www-form-urlencoded' }
            });

            const accessToken = tokenResponse.data.access_token;

            // Dapatkan Info User
            const userResponse = await axios.get('https://discord.com/api/users/@me', {
                headers: { Authorization: `Bearer ${accessToken}` }
            });

            const userId = userResponse.data.id;

            // Berikan Role Verified
            await axios.put(`https://discord.com/api/guilds/${GUILD_ID}/members/${userId}/roles/${VERIFIED_ROLE_ID}`, {}, {
                headers: { 
                    Authorization: `Bot ${BOT_TOKEN}`,
                    'X-Audit-Log-Reason': 'Verifikasi OAuth2 + Captcha Sukses via Web Panel'
                }
            });

            // Hapus Role Unverified (Abaikan kalau error, misal dia gak punya role-nya dari awal)
            try {
                await axios.delete(`https://discord.com/api/guilds/${GUILD_ID}/members/${userId}/roles/${UNVERIFIED_ROLE_ID}`, {
                    headers: { 
                        Authorization: `Bot ${BOT_TOKEN}`,
                        'X-Audit-Log-Reason': 'Hapus role non-verifikasi karena sudah sukses verif'
                    }
                });
            } catch (delError) {}

            // SUKSES!
            res.send(generateVerifyHTML(
                'success', 
                'Berhasil Masuk!', 
                'Mantap! Verifikasi lu sukses 100%. Sekarang akun lu udah dapetin role Verified.',
                '',
                { step: 3 }
            ));

        } catch (error) {
            console.error('Error Detail:', error.response ? error.response.data : error.message);
            
            let detailMsg = 'Terjadi kesalahan sistem yang tidak diketahui.';
            if (error.response && error.response.status === 400) {
                detailMsg = 'Kode otorisasi sudah kadaluarsa (expired). Token dari Discord hanya berlaku sebentar. Silakan request tombol/link verifikasi baru di dalam server Discord.';
            } else if (error.response && error.response.status === 403) {
                detailMsg = 'Bot Discord tidak memiliki izin (Permission) yang cukup untuk memberikan Role. Harap lapor ke Admin server.';
            }

            res.send(generateVerifyHTML(
                'error', 
                'Gagal Memproses!', 
                'Ada masalah saat menghubungi server Discord.',
                detailMsg,
                { step: 3 }
            ));
        }
    });

    const PORT = process.env.PORT || PORT_KALIAN; 
    app.listen(PORT, () => {
        console.log(`[🌐] Server OAuth2 Web jalan di port ${PORT} ngab!`);
    });
}

module.exports = startOAuthServer;


