let semuaTransaksi = [];

const formatRupiah = (angka) => {
    return new Intl.NumberFormat("id-ID", {
        style: "currency",
        currency: "IDR",
        minimumFractionDigits: 0
    }).format(Number(angka) || 0);
};


async function loadData() {

    const { data, error } = await supabaseClient
        .from("transaksi")
        .select("*")
        .order("tanggal", { ascending: false })
        .order("id", { ascending: false });

    if (error) {

        console.error(error);

        document.getElementById("daftarTransaksi").innerHTML = `
            <tr>
                <td colspan="4">
                    Gagal mengambil data.
                </td>
            </tr>
        `;

        return;
    }

    semuaTransaksi = data || [];

    hitungSaldo();
    tampilkanTransaksi(semuaTransaksi);
}


function hitungSaldo() {

    let masuk = 0;
    let keluar = 0;

    semuaTransaksi.forEach(item => {

        const nominal = Number(item.nominal) || 0;

        if (item.jenis === "masuk") {
            masuk += nominal;
        }

        if (item.jenis === "keluar") {
            keluar += nominal;
        }

    });

    const saldo = masuk - keluar;

    document.getElementById("totalMasuk").textContent =
        formatRupiah(masuk);

    document.getElementById("totalKeluar").textContent =
        formatRupiah(keluar);

    document.getElementById("saldo").textContent =
        formatRupiah(saldo);
}


function tampilkanTransaksi(data) {

    const tbody =
        document.getElementById("daftarTransaksi");

    if (!data.length) {

        tbody.innerHTML = `
            <tr>
                <td colspan="4">
                    Belum ada transaksi.
                </td>
            </tr>
        `;

        return;
    }


    tbody.innerHTML = data.map(item => {

        const tanggal = new Date(item.tanggal)
            .toLocaleDateString("id-ID", {
                day: "2-digit",
                month: "short",
                year: "numeric"
            });

        const masuk =
            item.jenis === "masuk";

        return `
            <tr>

                <td>${tanggal}</td>

                <td>
                    ${escapeHTML(item.keterangan)}
                </td>

                <td>
                    <span class="jenis ${masuk ? "jenis-masuk" : "jenis-keluar"}">
                        ${masuk ? "Masuk" : "Keluar"}
                    </span>
                </td>

                <td class="${masuk ? "nominal-masuk" : "nominal-keluar"}">
                    ${masuk ? "+" : "-"}
                    ${formatRupiah(item.nominal)}
                </td>

            </tr>
        `;

    }).join("");
}


function escapeHTML(text) {

    return String(text)
        .replaceAll("&", "&amp;")
        .replaceAll("<", "&lt;")
        .replaceAll(">", "&gt;")
        .replaceAll('"', "&quot;")
        .replaceAll("'", "&#039;");
}


document.getElementById("search")
    .addEventListener("input", function () {

        const keyword =
            this.value.toLowerCase().trim();

        const hasil = semuaTransaksi.filter(item =>

            String(item.keterangan)
                .toLowerCase()
                .includes(keyword)

        );

        tampilkanTransaksi(hasil);

    });


loadData();// ==========================================
// JADWAL SHOLAT OTOMATIS
// KEMENAG RI - METHOD 20
// ==========================================

const prayerConfig = {
    // Koordinat area Jakarta Utara / Penjaringan
    latitude: -6.1352,
    longitude: 106.8125,

    // Method 20 = Kementerian Agama Republik Indonesia
    method: 20,

    timezone: "Asia/Jakarta"
};

const namaSholat = {
    Fajr: "Subuh",
    Dhuhr: "Dzuhur",
    Asr: "Ashar",
    Maghrib: "Maghrib",
    Isha: "Isya"
};

let jadwalHariIni = null;

function formatTanggalIndonesia(date) {
    return new Intl.DateTimeFormat("id-ID", {
        weekday: "long",
        day: "numeric",
        month: "long",
        year: "numeric",
        timeZone: prayerConfig.timezone
    }).format(date);
}

function getTanggalAPI() {
    const sekarang = new Date();

    const formatter = new Intl.DateTimeFormat("en-GB", {
        timeZone: prayerConfig.timezone,
        day: "2-digit",
        month: "2-digit",
        year: "numeric"
    });

    const bagian = formatter.formatToParts(sekarang);

    const day = bagian.find(x => x.type === "day").value;
    const month = bagian.find(x => x.type === "month").value;
    const year = bagian.find(x => x.type === "year").value;

    return `${day}-${month}-${year}`;
}

async function loadJadwalSholat() {
    const status = document.getElementById("statusSholat");

    if (!status) return;

    status.textContent = "Mengambil jadwal sholat...";

    try {
        const tanggal = getTanggalAPI();

        const url =
            `https://api.aladhan.com/v1/timings/${tanggal}` +
            `?latitude=${prayerConfig.latitude}` +
            `&longitude=${prayerConfig.longitude}` +
            `&method=${prayerConfig.method}` +
            `&school=0` +
            `&timezone=${encodeURIComponent(prayerConfig.timezone)}`;

        const response = await fetch(url);

        if (!response.ok) {
            throw new Error("Gagal mengambil data jadwal.");
        }

        const json = await response.json();

        if (!json.data || !json.data.timings) {
            throw new Error("Data jadwal tidak ditemukan.");
        }

        jadwalHariIni = json.data.timings;

        tampilkanJadwal(json.data.timings);

        status.textContent =
            "Jadwal otomatis • Kementerian Agama RI";

    } catch (error) {
        console.error("Jadwal sholat:", error);

        status.textContent =
            "Jadwal sholat gagal dimuat. Periksa koneksi internet.";

        document.getElementById("subuh").textContent = "--:--";
        document.getElementById("dzuhur").textContent = "--:--";
        document.getElementById("ashar").textContent = "--:--";
        document.getElementById("maghrib").textContent = "--:--";
        document.getElementById("isya").textContent = "--:--";
    }
}

function bersihkanJam(jam) {
    if (!jam) return "--:--";

    // API kadang memberikan format "04:27 (WIB)"
    return jam.substring(0, 5);
}

function tampilkanJadwal(timings) {
    document.getElementById("subuh").textContent =
        bersihkanJam(timings.Fajr);

    document.getElementById("dzuhur").textContent =
        bersihkanJam(timings.Dhuhr);

    document.getElementById("ashar").textContent =
        bersihkanJam(timings.Asr);

    document.getElementById("maghrib").textContent =
        bersihkanJam(timings.Maghrib);

    document.getElementById("isya").textContent =
        bersihkanJam(timings.Isha);

    document.getElementById("tanggalSholat").textContent =
        formatTanggalIndonesia(new Date());

    updateNextPrayer();
}

function waktuKeMenit(jam) {
    const [h, m] = jam.split(":").map(Number);
    return h * 60 + m;
}

function getMenitSekarang() {
    const sekarang = new Date();

    const bagian = new Intl.DateTimeFormat("en-US", {
        timeZone: prayerConfig.timezone,
        hour: "2-digit",
        minute: "2-digit",
        hour12: false
    }).formatToParts(sekarang);

    let jam = Number(
        bagian.find(x => x.type === "hour").value
    );

    const menit = Number(
        bagian.find(x => x.type === "minute").value
    );

    // Beberapa browser menghasilkan 24 untuk tengah malam
    if (jam === 24) jam = 0;

    return jam * 60 + menit;
}

function updateNextPrayer() {
    if (!jadwalHariIni) return;

    const daftar = [
        {
            nama: "Subuh",
            waktu: bersihkanJam(jadwalHariIni.Fajr)
        },
        {
            nama: "Dzuhur",
            waktu: bersihkanJam(jadwalHariIni.Dhuhr)
        },
        {
            nama: "Ashar",
            waktu: bersihkanJam(jadwalHariIni.Asr)
        },
        {
            nama: "Maghrib",
            waktu: bersihkanJam(jadwalHariIni.Maghrib)
        },
        {
            nama: "Isya",
            waktu: bersihkanJam(jadwalHariIni.Isha)
        }
    ];

    const sekarang = getMenitSekarang();

    let berikutnya = null;

    for (const sholat of daftar) {
        if (waktuKeMenit(sholat.waktu) > sekarang) {
            berikutnya = sholat;
            break;
        }
    }

    // Kalau semua sholat hari ini sudah lewat,
    // berikutnya adalah Subuh besok.
    if (!berikutnya) {
        berikutnya = {
            nama: "Subuh",
            waktu: daftar[0].waktu,
            besok: true
        };
    }

    document.getElementById("sholatBerikutnya").textContent =
        `${berikutnya.nama} • ${berikutnya.waktu}`;

    hitungMundur(berikutnya);
}

function hitungMundur(sholat) {
    if (!jadwalHariIni) return;

    const sekarang = new Date();

    const formatter = new Intl.DateTimeFormat("en-US", {
        timeZone: prayerConfig.timezone,
        hour: "2-digit",
        minute: "2-digit",
        second: "2-digit",
        hour12: false
    });

    const bagian = formatter.formatToParts(sekarang);

    let jam = Number(
        bagian.find(x => x.type === "hour").value
    );

    if (jam === 24) jam = 0;

    const menit = Number(
        bagian.find(x => x.type === "minute").value
    );

    const detik = Number(
        bagian.find(x => x.type === "second").value
    );

    const sekarangDetik =
        jam * 3600 +
        menit * 60 +
        detik;

    const [targetJam, targetMenit] =
        sholat.waktu.split(":").map(Number);

    let targetDetik =
        targetJam * 3600 +
        targetMenit * 60;

    let selisih = targetDetik - sekarangDetik;

    if (sholat.besok || selisih <= 0) {
        selisih += 24 * 3600;
    }

    const jamSisa = Math.floor(selisih / 3600);

    const menitSisa =
        Math.floor((selisih % 3600) / 60);

    const detikSisa =
        selisih % 60;

    const hasil =
        String(jamSisa).padStart(2, "0") +
        ":" +
        String(menitSisa).padStart(2, "0") +
        ":" +
        String(detikSisa).padStart(2, "0");

    document.getElementById("hitungMundur").textContent =
        hasil;
}

// Update countdown setiap detik
setInterval(() => {
    updateNextPrayer();
}, 1000);

// Cek jadwal kembali setiap 10 menit
setInterval(() => {
    loadJadwalSholat();
}, 10 * 60 * 1000);

// Jalankan ketika halaman dibuka
document.addEventListener("DOMContentLoaded", () => {
    loadJadwalSholat();
});