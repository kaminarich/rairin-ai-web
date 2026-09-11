"use client";

import Link from "next/link";
import { LanguageProvider, LanguageToggle, T } from "@/components/Language";

const TELEGRAM = "https://t.me/kaminarich";

export default function PolicyPage() {
  return (
    <LanguageProvider>
      <header className="topbar">
        <div className="topbar-inner">
          <Link className="brand" href="/">
            <span className="led led--live" />
            <span className="brand-mark">RAIRIN<em>-AI</em></span>
          </Link>
          <LanguageToggle />
          <Link className="btn btn--sm" href="/#payment"><T en="ORDER" id="PESAN" /></Link>
        </div>
      </header>

      <main className="legal-page">
        <div className="shell legal-shell">
          <p className="kicker"><span className="led led--accent" /><T en="Customer policies" id="Kebijakan pelanggan" /></p>
          <h1><T en="Terms, Refunds & Privacy" id="Syarat, Pengembalian Dana & Privasi" /></h1>
          <p className="lede"><T en="Effective 11 September 2026. These policies apply to RaiRin-AI digital license orders." id="Berlaku 11 September 2026. Kebijakan ini berlaku untuk pesanan lisensi digital RaiRin-AI." /></p>

          <nav className="legal-nav" aria-label="Policy sections">
            <a href="#terms"><T en="Terms & Conditions" id="Syarat & Ketentuan" /></a>
            <a href="#refund"><T en="Refund Policy" id="Kebijakan Pengembalian Dana" /></a>
            <a href="#privacy"><T en="Privacy Policy" id="Kebijakan Privasi" /></a>
            <a href="#contact"><T en="Business Contact" id="Kontak Bisnis" /></a>
          </nav>

          <article className="panel legal-card" id="terms">
            <h2><T en="Terms & Conditions" id="Syarat & Ketentuan" /></h2>
            <h3><T en="1. Seller and product" id="1. Penjual dan produk" /></h3>
            <p><T en="KAMINARICH sells RaiRin-AI, a digital Magisk/KernelSU module license for one rooted Android device. One Rp 15.000 payment buys one permanent license bound to the device serial submitted at checkout. No physical product is shipped." id="KAMINARICH menjual RaiRin-AI, lisensi modul digital Magisk/KernelSU untuk satu perangkat Android yang sudah di-root. Satu pembayaran Rp 15.000 membeli satu lisensi permanen yang terikat pada serial perangkat yang dimasukkan saat checkout. Tidak ada produk fisik yang dikirim." /></p>
            <h3><T en="2. Ordering and payment" id="2. Pemesanan dan pembayaran" /></h3>
            <p><T en="Website transactions use Indonesian Rupiah (IDR). QRIS payment is processed by Midtrans on this website. A QRIS code remains valid for five minutes. Do not pay an expired code; create a new order. An order is paid only after Midtrans confirms settlement." id="Transaksi website menggunakan Rupiah Indonesia (IDR). Pembayaran QRIS diproses oleh Midtrans di website ini. Kode QRIS berlaku selama lima menit. Jangan bayar kode yang sudah kedaluwarsa; buat pesanan baru. Pesanan dinyatakan lunas hanya setelah Midtrans mengonfirmasi settlement." /></p>
            <h3><T en="3. Delivery and activation" id="3. Pengiriman dan aktivasi" /></h3>
            <p><T en="After payment confirmation, the website shows a verification ID and Telegram contact button. Send the verification ID to @kaminarich. Activation is handled manually for the serial submitted before payment. Contact support if activation has not arrived within 24 hours after sending the verification ID." id="Setelah pembayaran terkonfirmasi, website menampilkan ID verifikasi dan tombol kontak Telegram. Kirim ID verifikasi ke @kaminarich. Aktivasi diproses manual untuk serial yang dimasukkan sebelum pembayaran. Hubungi dukungan jika aktivasi belum diterima dalam 24 jam setelah mengirim ID verifikasi." /></p>
            <h3><T en="4. Device requirements and license scope" id="4. Persyaratan perangkat dan cakupan lisensi" /></h3>
            <p><T en="Buyer must verify that the device is rooted and supports Magisk or KernelSU. License covers one submitted serial and cannot be resold, shared, or transferred without written approval. Another device requires another license." id="Pembeli wajib memastikan perangkat sudah di-root dan mendukung Magisk atau KernelSU. Lisensi berlaku untuk satu serial yang didaftarkan dan tidak boleh dijual kembali, dibagikan, atau dipindahkan tanpa persetujuan tertulis. Perangkat lain memerlukan lisensi lain." /></p>
            <h3><T en="5. Acceptable use and warranty" id="5. Penggunaan yang diizinkan dan jaminan" /></h3>
            <p><T en="Use RaiRin-AI lawfully and at your own device risk. Root modifications can affect stability, battery, heat, app compatibility, and warranties. Product is provided as described on the website; uninterrupted compatibility with every ROM, kernel, game, or future Android version is not guaranteed." id="Gunakan RaiRin-AI secara sah dan dengan risiko perangkat ditanggung pengguna. Modifikasi root dapat memengaruhi stabilitas, baterai, suhu, kompatibilitas aplikasi, dan garansi. Produk diberikan sesuai deskripsi website; kompatibilitas tanpa gangguan dengan setiap ROM, kernel, game, atau versi Android mendatang tidak dijamin." /></p>
          </article>

          <article className="panel legal-card" id="refund">
            <h2><T en="Refund & Digital Product Return Policy" id="Kebijakan Pengembalian Dana & Produk Digital" /></h2>
            <p><T en="RaiRin-AI is a digital product delivered as a permanent device-bound license. All completed purchases are final and non-refundable. No physical product return applies." id="RaiRin-AI adalah produk digital yang diberikan sebagai lisensi permanen terikat perangkat. Semua pembelian yang selesai bersifat final dan tidak dapat dikembalikan. Tidak ada pengembalian produk fisik." /></p>
            <p><T en="No refund is provided for change of mind, wrong serial supplied by buyer, unsupported or unrooted devices, device damage, account misuse, compatibility changes, or license transfer requests. Buyer must review product description and device requirements before payment." id="Tidak ada pengembalian dana karena berubah pikiran, serial salah dari pembeli, perangkat tidak didukung atau belum di-root, kerusakan perangkat, penyalahgunaan akun, perubahan kompatibilitas, atau permintaan pemindahan lisensi. Pembeli wajib memeriksa deskripsi produk dan persyaratan perangkat sebelum membayar." /></p>
            <p><T en="Duplicate charges or payments confirmed by Midtrans but not matched to an order are payment errors, not refund requests. Contact @kaminarich with the verification ID for reconciliation. Do not pay an expired QRIS or create repeated payments." id="Tagihan ganda atau pembayaran yang dikonfirmasi Midtrans tetapi tidak cocok dengan pesanan merupakan kesalahan pembayaran, bukan permintaan pengembalian dana. Hubungi @kaminarich dengan ID verifikasi untuk rekonsiliasi. Jangan membayar QRIS kedaluwarsa atau membuat pembayaran berulang." /></p>
          </article>

          <article className="panel legal-card" id="privacy">
            <h2><T en="Privacy Policy" id="Kebijakan Privasi" /></h2>
            <p><T en="We collect the device serial entered at checkout, order and transaction identifiers, payment status, and support messages needed to issue and maintain the license. Midtrans processes QRIS payment data under its own privacy policy. Telegram processes messages you send through its service." id="Kami mengumpulkan serial perangkat yang dimasukkan saat checkout, ID pesanan dan transaksi, status pembayaran, serta pesan dukungan yang diperlukan untuk menerbitkan dan memelihara lisensi. Midtrans memproses data pembayaran QRIS berdasarkan kebijakan privasinya. Telegram memproses pesan yang Anda kirim melalui layanannya." /></p>
            <p><T en="Data is used for payment verification, fraud prevention, license activation, support, and legal records. We do not sell personal data. Records are retained only as needed for license operation, disputes, accounting, and applicable law. Request access, correction, or deletion through @kaminarich; some transaction records may need to be retained by law." id="Data digunakan untuk verifikasi pembayaran, pencegahan penipuan, aktivasi lisensi, dukungan, dan catatan hukum. Kami tidak menjual data pribadi. Catatan disimpan hanya selama diperlukan untuk operasi lisensi, sengketa, akuntansi, dan hukum yang berlaku. Minta akses, koreksi, atau penghapusan melalui @kaminarich; sebagian catatan transaksi mungkin wajib disimpan menurut hukum." /></p>
          </article>

          <article className="panel legal-card" id="contact">
            <h2><T en="Business Contact" id="Kontak Bisnis" /></h2>
            <dl className="business-details">
              <div><dt><T en="Business name" id="Nama usaha" /></dt><dd>KAMINARICH</dd></div>
              <div><dt><T en="Product" id="Produk" /></dt><dd>RaiRin-AI digital license</dd></div>
              <div><dt>Telegram</dt><dd><a href={TELEGRAM} target="_blank" rel="noreferrer noopener">@kaminarich</a></dd></div>
              <div><dt><T en="Support hours" id="Jam dukungan" /></dt><dd><T en="Daily, 09:00-21:00 WIB" id="Setiap hari, 09.00-21.00 WIB" /></dd></div>
            </dl>
          </article>
        </div>
      </main>
    </LanguageProvider>
  );
}
