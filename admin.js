let transaksi = [];

// =========================
// FORMAT RUPIAH
// =========================

const formatRupiah = (angka) => {
    return new Intl.NumberFormat("id-ID", {
        style: "currency",
        currency: "IDR",
        minimumFractionDigits: 0
    }).format(Number(angka) || 0);
};


// =========================
// SECURITY LOGIN
// =========================

let jumlahSalah = Number(
    sessionStorage.getItem("loginSalah") || 0
);

let waktuKunci = Number(
    sessionStorage.getItem("waktuKunci") || 0
);

let timerKunci = null;


// =========================
// ELEMENT LOGIN
// =========================

const loginForm = document.getElementById("loginForm");
const emailInput = document.getElementById("email");
const passwordInput = document.getElementById("password");
const loginMessage = document.getElementById("loginMessage");


// =========================
// CEK KUNCI LOGIN
// =========================

function cekKunciLogin() {

    const sekarang = Date.now();

    if (waktuKunci && sekarang < waktuKunci) {
        mulaiHitungMundur();
        return true;
    }

    if (waktuKunci && sekarang >= waktuKunci) {

        waktuKunci = 0;
        jumlahSalah = 0;

        sessionStorage.removeItem("waktuKunci");
        sessionStorage.removeItem("loginSalah");

        aktifkanLogin();
    }

    return false;
}


// =========================
// NONAKTIFKAN LOGIN
// =========================

function nonaktifkanLogin() {

    emailInput.disabled = true;
    passwordInput.disabled = true;

    const tombol = loginForm.querySelector("button");

    if (tombol) {
        tombol.disabled = true;
    }
}


// =========================
// AKTIFKAN LOGIN
// =========================

function aktifkanLogin() {

    emailInput.disabled = false;
    passwordInput.disabled = false;

    const tombol = loginForm.querySelector("button");

    if (tombol) {
        tombol.disabled = false;
    }
}


// =========================
// HITUNG MUNDUR 30 DETIK
// =========================

function mulaiHitungMundur() {

    nonaktifkanLogin();

    if (timerKunci) {
        clearInterval(timerKunci);
    }

    function updateTimer() {

        const sisa = Math.ceil(
            (waktuKunci - Date.now()) / 1000
        );

        if (sisa <= 0) {

            clearInterval(timerKunci);
            timerKunci = null;

            waktuKunci = 0;
            jumlahSalah = 0;

            sessionStorage.removeItem("waktuKunci");
            sessionStorage.removeItem("loginSalah");

            aktifkanLogin();

            loginMessage.textContent =
                "⏰ Kamu sudah bisa mencoba login kembali.";

            return;
        }

        loginMessage.textContent =
            `🔒 Terlalu banyak percobaan salah. Silakan tunggu ${sisa} detik.`;
    }

    updateTimer();

    timerKunci = setInterval(updateTimer, 1000);
}


// =========================
// CEK LOGIN SUPABASE
// =========================

async function cekLogin() {

    const {
        data: { session }
    } = await supabaseClient.auth.getSession();

    if (session) {

        document.getElementById("loginBox").hidden = true;

        document.getElementById("adminPanel").hidden = false;

        loadTransactions();

        tampilkanDokumentasiAdmin();

    } else {

        cekKunciLogin();
    }
}


// =========================
// LOGIN
// =========================

loginForm.addEventListener("submit", async function(e) {

    e.preventDefault();

    // Cek apakah sedang dikunci
    if (cekKunciLogin()) {
        return;
    }

    const email = emailInput.value.trim();

    const password = passwordInput.value;


    // =========================
    // LOGIN SUPABASE
    // =========================

    const { error } =
        await supabaseClient.auth.signInWithPassword({
            email,
            password
        });


    // =========================
    // LOGIN GAGAL
    // =========================

    if (error) {

        jumlahSalah++;

        sessionStorage.setItem(
            "loginSalah",
            jumlahSalah
        );


        if (jumlahSalah >= 3) {

            waktuKunci =
                Date.now() + (30 * 1000);

            sessionStorage.setItem(
                "waktuKunci",
                waktuKunci
            );

            loginMessage.textContent =
                "🔒 3 kali password salah. Login dikunci selama 30 detik.";

            mulaiHitungMundur();

            return;
        }


        const sisa =
            3 - jumlahSalah;

        loginMessage.textContent =
            `❌ Email atau password salah. Sisa percobaan: ${sisa}`;

        return;
    }


    // =========================
    // LOGIN BERHASIL
    // =========================

    jumlahSalah = 0;
    waktuKunci = 0;

    sessionStorage.removeItem("loginSalah");
    sessionStorage.removeItem("waktuKunci");

    loginMessage.textContent = "";

    document.getElementById("loginBox").hidden = true;

    document.getElementById("adminPanel").hidden = false;

    loadTransactions();

    tampilkanDokumentasiAdmin();

});


// =========================
// LOGOUT
// =========================

document.getElementById("logoutBtn")
    .addEventListener("click", async function() {

        await supabaseClient.auth.signOut();

        location.reload();

    });


// =========================
// LOAD DATA
// =========================

async function loadTransactions() {

    const { data, error } =
        await supabaseClient
            .from("transaksi")
            .select("*")
            .order("tanggal", {
                ascending: false
            })
            .order("id", {
                ascending: false
            });


    if (error) {

        console.error(error);

        return;
    }


    transaksi = data || [];

    renderTable();

    updateSummary();

}


// =========================
// SUMMARY
// =========================

function updateSummary() {

    let masuk = 0;
    let keluar = 0;


    transaksi.forEach(item => {

        if (item.jenis === "masuk") {

            masuk += Number(item.nominal);

        } else {

            keluar += Number(item.nominal);

        }

    });


    document.getElementById("adminMasuk")
        .textContent = formatRupiah(masuk);

    document.getElementById("adminKeluar")
        .textContent = formatRupiah(keluar);

    document.getElementById("adminSaldo")
        .textContent = formatRupiah(masuk - keluar);

}


// =========================
// TAMBAH TRANSAKSI
// =========================

document.getElementById("transactionForm")
    .addEventListener("submit", async function(e) {

        e.preventDefault();


        const tanggal =
            document.getElementById("tanggal").value;

        const keterangan =
            document.getElementById("keterangan").value.trim();

        const jenis =
            document.getElementById("jenis").value;

        const nominal =
            Number(document.getElementById("nominal").value);


        if (!tanggal || !keterangan || !nominal) {

            return;

        }


        const { error } =
            await supabaseClient
                .from("transaksi")
                .insert({
                    tanggal,
                    keterangan,
                    jenis,
                    nominal
                });


        if (error) {

            alert(error.message);

            return;

        }


        this.reset();

        document.getElementById("formMessage")
            .textContent =
            "Transaksi berhasil disimpan.";

        await loadTransactions();

    });


// =========================
// TABEL
// =========================

function renderTable() {

    const tbody =
        document.getElementById("adminTableBody");


    if (!transaksi.length) {

        tbody.innerHTML = `
            <tr>
                <td colspan="5">
                    Belum ada transaksi.
                </td>
            </tr>
        `;

        return;
    }


    tbody.innerHTML = transaksi.map(item => {

        const masuk =
            item.jenis === "masuk";


        return `

            <tr>

                <td>
                    ${item.tanggal}
                </td>

                <td>
                    ${escapeHTML(item.keterangan)}
                </td>

                <td>
                    ${masuk ? "Masuk" : "Keluar"}
                </td>

                <td>
                    ${formatRupiah(item.nominal)}
                </td>

                <td>

                    <button
                        class="btn-edit"
                        onclick="editTransaction(${item.id})">
                        ✏️
                    </button>

                    <button
                        class="btn-danger"
                        onclick="deleteTransaction(${item.id})">
                        🗑️
                    </button>

                </td>

            </tr>

        `;

    }).join("");

}


// =========================
// EDIT
// =========================

async function editTransaction(id) {

    const item =
        transaksi.find(x => x.id === id);

    if (!item) return;


    const nominalBaru =
        prompt(
            "Masukkan nominal baru:",
            item.nominal
        );


    if (nominalBaru === null) return;


    const nominal =
        Number(nominalBaru);


    if (!nominal || nominal <= 0) {

        alert("Nominal tidak valid.");

        return;
    }


    const { error } =
        await supabaseClient
            .from("transaksi")
            .update({
                nominal
            })
            .eq("id", id);


    if (error) {

        alert(error.message);

        return;
    }


    loadTransactions();

}


// =========================
// HAPUS
// =========================

async function deleteTransaction(id) {

    if (!confirm(
        "Yakin ingin menghapus transaksi ini?"
    )) {

        return;
    }


    const { error } =
        await supabaseClient
            .from("transaksi")
            .delete()
            .eq("id", id);


    if (error) {

        alert(error.message);

        return;
    }


    loadTransactions();

}


// =========================
// SECURITY
// =========================

function escapeHTML(text) {

    return String(text)
        .replaceAll("&", "&amp;")
        .replaceAll("<", "&lt;")
        .replaceAll(">", "&gt;")
        .replaceAll('"', "&quot;")
        .replaceAll("'", "&#039;");

}


// ==========================================
// DOKUMENTASI
// ==========================================

const inputJudul =
    document.getElementById("judulDokumentasi");

const inputGambar =
    document.getElementById("gambarDokumentasi");

const btnTambah =
    document.getElementById("btnTambahDokumentasi");

const statusDokumentasi =
    document.getElementById("statusDokumentasi");

const daftarAdmin =
    document.getElementById("daftarDokumentasiAdmin");


// ==========================================
// TAMBAH DOKUMENTASI
// ==========================================

if (btnTambah) {

    btnTambah.addEventListener("click", async () => {

        const judul =
            inputJudul.value.trim();

        const file =
            inputGambar.files[0];


        if (!file) {

            statusDokumentasi.textContent =
                "Pilih gambar terlebih dahulu.";

            return;
        }


        // Batasi ukuran 5 MB
        if (file.size > 5 * 1024 * 1024) {

            statusDokumentasi.textContent =
                "Ukuran gambar maksimal 5 MB.";

            return;
        }


        statusDokumentasi.textContent =
            "Mengunggah gambar...";

        btnTambah.disabled = true;


        try {

            const userResult =
                await supabaseClient.auth.getUser();

            if (!userResult.data.user) {

                throw new Error(
                    "Anda harus login sebagai admin."
                );

            }


            // Buat nama file unik
            const extension =
                file.name.split(".").pop();

            const namaFile =
                Date.now() +
                "-" +
                Math.random()
                    .toString(36)
                    .substring(2) +
                "." +
                extension;


            // ==================================
            // UPLOAD KE STORAGE
            // ==================================

            const upload =
                await supabaseClient.storage
                    .from("dokumentasi")
                    .upload(
                        namaFile,
                        file,
                        {
                            cacheControl: "3600",
                            upsert: false
                        }
                    );


            if (upload.error) {
                throw upload.error;
            }


            // ==================================
            // AMBIL URL GAMBAR
            // ==================================

            const urlData =
                supabaseClient.storage
                    .from("dokumentasi")
                    .getPublicUrl(namaFile);


            const gambarUrl =
                urlData.data.publicUrl;


            // ==================================
            // SIMPAN KE DATABASE
            // ==================================

            const insert =
                await supabaseClient
                    .from("dokumentasi")
                    .insert([
                        {
                            judul:
                                judul ||
                                "Dokumentasi",

                            gambar_url:
                                gambarUrl
                        }
                    ]);


            if (insert.error) {

                // Kalau database gagal,
                // hapus file yang sudah ter-upload

                await supabaseClient.storage
                    .from("dokumentasi")
                    .remove([namaFile]);

                throw insert.error;
            }


            statusDokumentasi.textContent =
                "✅ Dokumentasi berhasil ditambahkan.";


            inputJudul.value = "";
            inputGambar.value = "";


            tampilkanDokumentasiAdmin();


        } catch (error) {

            console.error(error);

            statusDokumentasi.textContent =
                "❌ Gagal: " + error.message;

        } finally {

            btnTambah.disabled = false;

        }

    });

}


// ==========================================
// TAMPILKAN DOKUMENTASI DI ADMIN
// ==========================================

async function tampilkanDokumentasiAdmin() {

    if (!daftarAdmin) return;


    const { data, error } =
        await supabaseClient
            .from("dokumentasi")
            .select("*")
            .order("created_at", {
                ascending: false
            });


    if (error) {

        daftarAdmin.innerHTML =
            "<p>Gagal mengambil dokumentasi.</p>";

        return;
    }


    if (!data || data.length === 0) {

        daftarAdmin.innerHTML =
            "<p>Belum ada dokumentasi.</p>";

        return;
    }


    daftarAdmin.innerHTML =
        data.map(item => `

            <div class="admin-dokumentasi">

                <img
                    src="${escapeHtml(item.gambar_url)}"
                    alt="${escapeHtml(
                        item.judul || "Dokumentasi"
                    )}">

                <div>

                    <strong>
                        ${escapeHtml(
                            item.judul ||
                            "Dokumentasi"
                        )}
                    </strong>

                    <br>

                    <button
                        type="button"
                        onclick="hapusDokumentasi(
                            ${item.id},
                            '${escapeHtml(item.gambar_url)}'
                        )">

                        🗑️ Hapus

                    </button>

                </div>

            </div>

        `).join("");
}


// ==========================================
// HAPUS DOKUMENTASI
// ==========================================

async function hapusDokumentasi(id, url) {

    if (!confirm(
        "Hapus dokumentasi ini?"
    )) {

        return;
    }


    try {

        // Ambil nama file dari URL
        const namaFile =
            decodeURIComponent(
                url.split("/").pop()
            );


        // Hapus file Storage
        const storage =
            await supabaseClient.storage
                .from("dokumentasi")
                .remove([namaFile]);


        if (storage.error) {
            console.warn(storage.error);
        }


        // Hapus data database
        const result =
            await supabaseClient
                .from("dokumentasi")
                .delete()
                .eq("id", id);


        if (result.error) {
            throw result.error;
        }


        tampilkanDokumentasiAdmin();


    } catch (error) {

        alert(
            "Gagal menghapus: " +
            error.message
        );

    }

}


// ==========================================
// ESCAPE HTML
// ==========================================

function escapeHtml(value) {

    return String(value)
        .replace(/&/g, "&amp;")
        .replace(/</g, "&lt;")
        .replace(/>/g, "&gt;")
        .replace(/"/g, "&quot;")
        .replace(/'/g, "&#039;");
}


// ==========================================
// JALANKAN SAAT ADMIN MEMBUKA HALAMAN
// ==========================================

if (daftarAdmin) {
    // Dokumentasi akan dimuat setelah status login dicek
}


// Jalankan pengecekan login
cekLogin();