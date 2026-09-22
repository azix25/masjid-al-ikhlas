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


loadData();